# ATENÇÃO: Para evitar erro de CORS, acesse o backend via http://localhost:8000 no frontend (não use http://127.0.0.1:8000)
import os
from fastapi import FastAPI, UploadFile, File, Form
from fastapi.middleware.cors import CORSMiddleware
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.responses import Response
from fastapi.responses import FileResponse, JSONResponse
from openai import OpenAI
GUIA_IRIB_FILE_ID = os.getenv("GUIA_IRIB_FILE_ID")  # Coloque o file_id do guia IRIB aqui
from dotenv import load_dotenv
from fpdf import FPDF
import pdfplumber
import io
import pytesseract
from PIL import Image, ImageSequence
from pdf2image import convert_from_bytes
import os
import uuid
import datetime
import traceback
import zipfile
import re

load_dotenv()
# Modelos configuráveis por .env
MODEL_CERTIDAO = os.getenv("MODEL_CERTIDAO", "gpt-4o")
MODEL_ESCRITURA = os.getenv("MODEL_ESCRITURA", "gpt-4o")
DEBUG_MODE = os.getenv("DEBUG", "false").lower() == "true"
app = FastAPI()

# CORS: permita local e o frontend na Render
FRONTEND_ORIGIN = os.getenv("FRONTEND_ORIGIN", "https://riai-frontend.onrender.com")
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        FRONTEND_ORIGIN,
    ],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)
ALLOWED_ORIGINS_SET = set([
    "http://localhost:3000",
    "http://127.0.0.1:3000",
    FRONTEND_ORIGIN,
])

class EnsureCORSMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request, call_next):
        origin = request.headers.get("origin")

        # Preflight
        if request.method == "OPTIONS":
            headers = {
                "Access-Control-Allow-Origin": "*",
                "Vary": "Origin",
                "Access-Control-Allow-Credentials": "false",
                "Access-Control-Allow-Methods": "GET,POST,OPTIONS",
                "Access-Control-Allow-Headers": request.headers.get("access-control-request-headers", "*"),
                "Access-Control-Max-Age": "86400",
            }
            return Response(status_code=200, headers=headers)

        try:
            response = await call_next(request)
        except Exception as exc:
            # Em caso de erro, ainda assim devolve CORS (com 500)
            response = JSONResponse(status_code=500, content={"erro": str(exc)})

        # Always allow any origin (no credentials) to avoid deployment origin mismatches
        response.headers["Access-Control-Allow-Origin"] = "*"
        response.headers["Vary"] = "Origin"
        response.headers["Access-Control-Allow-Credentials"] = "false"
        response.headers["Access-Control-Expose-Headers"] = "Content-Disposition, Content-Type"
        return response

app.add_middleware(EnsureCORSMiddleware)

client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))

# ---------- Utilidades ----------

@app.get("/api/health")
def health():
    return {"status": "ok"}

def _pt_data_extenso_e_hora():
    agora = datetime.datetime.now()
    meses_pt = [
        "janeiro","fevereiro","março","abril","maio","junho",
        "julho","agosto","setembro","outubro","novembro","dezembro"
    ]
    data_extenso = f"{agora.day} de {meses_pt[agora.month - 1]} de {agora.year}"
    hora = agora.strftime("%H:%M:%S")
    return data_extenso, hora

def extrair_texto_pdf(file_bytes: bytes) -> str:
    """
    Tenta extrair com pdfplumber; se falhar ou vier vazio, faz OCR nas páginas convertidas via pdf2image.
    """
    texto = ""
    try:
        # Use BytesIO to avoid falling back to OCR desnecessariamente
        with pdfplumber.open(io.BytesIO(file_bytes)) as pdf:
            for page in pdf.pages:
                texto += page.extract_text() or ""
    except Exception:
        pass

    if not texto.strip():
        try:
            imagens = convert_from_bytes(file_bytes)
            for img in imagens:
                texto += pytesseract.image_to_string(img)
        except Exception:
            pass
    return texto

def extrair_texto_tiff(upload: UploadFile) -> str:
    """
    OCR para .tif/.tiff, suportando multi-página.
    """
    try:
        upload.file.seek(0)
        img = Image.open(upload.file)
        texto = ""
        for frame in ImageSequence.Iterator(img):
            texto += pytesseract.image_to_string(frame)
        return texto
    except Exception:
        return ""

def extrair_matricula(texto: str) -> str:
    """
    Captura padrões como: matrícula nº 12345 / matricula n° 123 / matrícula número 000123 / etc.
    """
    padrao = r"matr[íi]cula(?:\s*(?:n[ºo]|n[oº]\.?|número|nº))?\s*[:\-]?\s*(\d{3,})"
    m = re.search(padrao, texto, re.IGNORECASE)
    return m.group(1) if m else str(uuid.uuid4())[:8]

def gerar_prompt(tipo: str, texto: str) -> str:
    data_extenso, hora_emissao = _pt_data_extenso_e_hora()
    if tipo == "escritura":
        return f"""
Você é um registrador de imóveis. Analise a(s) escritura(s) enviada(s) conforme as melhores práticas do IRIB, utilizando o guia IRIB em anexo (attachment). Fundamente sua resposta com base no guia e destaque pontos relevantes, inconsistências ou riscos.

Texto(s) da(s) escritura(s):
{texto}
"""
    else:
        base_prompt = f"""
Você é um registrador do 6º Registro de Imóveis de Curitiba.

Analise a matrícula abaixo e, em texto corrido, elabore uma certidão da situação jurídica do imóvel, observando:

1. Descreva o imóvel, localização e características.
2. Informe o(s) proprietário(s) atual(is), INDICANDO, A PARTIR DE CÁLCULOS, A PORCENTAGEM DE PROPRIEDADE DE CADA UM (caso não seja possível explicite o motivo) e a forma de aquisição.
3. Aponte o histórico recente de registros.
4. Indique se há algum dos seguintes ônus ou gravames vigentes: "regime de patrimônio de afetação imobiliária", "hipoteca", "alienação fiduciária", "penhora", "usufruto", "servidão", "ação real", "ação pessoal", "ação reipersecutória", "impenhorabilidade", "inalienabilidade", "anticrese", "gravame", "ônus". **Desconsidere quaisquer ônus que já tenham sido cancelados.**
5. Além dos termos descritos, fique atento a qualquer outro caso de ônus ou gravame existente e também aos transportes de ônus ou gravames.
6. Atentar que, enquanto não forem expressamente cancelados, os ônus ou gravames continuam vigentes e devem ser mencionados.
7. SE FOR MATRÍCULA MÃE (ex.: incorporação imobiliária ou instituição de condomínio), RETORNAR SOMENTE: "MANDAR A MATRÍCULA FILHA".
8. Se a matrícula enviada já estiver encerrada, escrever ANTES da certidão: "A MATRÍCULA JÁ FOI ENCERRADA, A CERTIDÃO DE QUANDO ELA ESTAVA ATIVA SEGUE ABAIXO".
9. Lembre-se de que usucapião não é considerado ônus.
10. LEMBRE-SE DE INDICAR AS PORCENTAGENS DE PROPRIEDADE DE CADA PROPRIETÁRIO.
No fim, use exatamente este modelo:

Certifico, a requerimento de pessoa interessada, que, revendo os livros de registros imobiliários existentes nesta serventia, em relação ao imóvel constante da matrícula sob nº [NÚMERO], [DESCRIÇÃO DO IMÓVEL], de propriedade de [NOME E CPF DO PROPRIETÁRIO];

- Se não houver ônus: "NÃO CONSTAM quaisquer ônus, gravames, ações reais ou pessoais e reipersecutórias."
- Se houver ônus: repetir a frase acima e adicionar "a não ser: ..." com a lista.

O referido é verdade e dou fé.
Curitiba – PR, {data_extenso}. Certidão emitida às {hora_emissao}.

A matrícula é:

{texto}
"""
        return base_prompt

def _font_path_dejavu() -> str:
    """
    Resolve o caminho do DejaVuSans.ttf conforme sua estrutura de pastas.
    """
    here = os.path.dirname(__file__)
    candidatos = [
        os.path.join(here, "fonts", "dejavu-fonts-ttf-2.37", "dejavu-fonts-ttf-2.37", "ttf", "DejaVuSans.ttf"),
        os.path.join(here, "fonts", "dejavu-fonts-ttf-2.37", "ttf", "DejaVuSans.ttf"),
        os.path.join(here, "fonts", "DejaVuSans.ttf"),
    ]
    for p in candidatos:
        if os.path.exists(p):
            return p
    # como último recurso, tente no cwd
    fallback = os.path.join(os.getcwd(), "backend", "fonts", "dejavu-fonts-ttf-2.37", "ttf", "DejaVuSans.ttf")
    if os.path.exists(fallback):
        return fallback
    raise RuntimeError("DejaVuSans.ttf não encontrado. Verifique a pasta backend/fonts/...")

def _gerar_pdf(texto_certidao: str, nome_pdf: str):
    pdf = FPDF()
    pdf.add_page()
    pdf.set_auto_page_break(auto=True, margin=15)
    # fonte com acentos
    fonte = _font_path_dejavu()
    pdf.add_font("DejaVu", "", fonte, uni=True)
    pdf.set_font("DejaVu", "", 12)
    for linha in texto_certidao.split("\n"):
        pdf.multi_cell(0, 8, txt=linha.strip())
    pdf.output(nome_pdf)

# ---------- Endpoint ----------

@app.post("/api/processar-pdf")
async def processar_pdf(tipo: str = Form(...), files: list[UploadFile] = File(...)):
    try:
        nomes_pdfs = []

        # 1) Extrair textos de todos os arquivos enviados
        textos_extraidos = []
        for file in files:
            conteudo = await file.read()
            filename = (file.filename or "").lower()

            if filename.endswith(".pdf"):
                texto = extrair_texto_pdf(conteudo)
            elif filename.endswith(".tif") or filename.endswith(".tiff"):
                texto = extrair_texto_tiff(file)
            else:
                try:
                    file.file.seek(0)
                    img = Image.open(file.file)
                    texto = pytesseract.image_to_string(img)
                except Exception:
                    texto = ""

            if texto and texto.strip():
                textos_extraidos.append(texto)

        if not textos_extraidos:
            return JSONResponse(status_code=400, content={"erro": "Nenhum texto válido extraído dos arquivos enviados."})

        modelo = MODEL_CERTIDAO if tipo == "certidao" else MODEL_ESCRITURA if tipo == "escritura" else "gpt-4o-mini"

        def chamar_ia(prompt: str):
            resultado = None
            ia_errors = []
            try:
                attachments = None
                if tipo == "escritura" and GUIA_IRIB_FILE_ID:
                    attachments = [{"file_id": GUIA_IRIB_FILE_ID, "tools": [{"type": "file_search"}]}]
                resposta = client.responses.create(
                    model=modelo,
                    input=[
                        {"role": "system", "content": "Você é um registrador de imóveis experiente."},
                        {"role": "user", "content": prompt}
                    ],
                    temperature=0.2,
                    attachments=attachments,
                )
                try:
                    resultado = resposta.output[0].content[0].text
                except Exception:
                    resultado = getattr(resposta, "output_text", None)
            except Exception as e1:
                msg = f"Fallback1 falhou (responses API): {repr(e1)}"
                ia_errors.append(msg)
                if DEBUG_MODE:
                    print(msg)
                    print(traceback.format_exc())

            if not resultado:
                try:
                    resposta = client.responses.create(
                        model=modelo,
                        input=[
                            {"role": "system", "content": "Você é um registrador de imóveis experiente."},
                            {"role": "user", "content": prompt}
                        ],
                        temperature=0.2,
                    )
                    try:
                        resultado = resposta.output[0].content[0].text
                    except Exception:
                        resultado = getattr(resposta, "output_text", None)
                except Exception as e2:
                    msg = f"Fallback2 falhou (responses API sem attachment): {repr(e2)}"
                    ia_errors.append(msg)
                    if DEBUG_MODE:
                        print(msg)
                        print(traceback.format_exc())

            if not resultado:
                try:
                    backup_model = "gpt-4o"
                    resposta = client.chat.completions.create(
                        model=backup_model,
                        messages=[
                            {"role": "system", "content": "Você é um registrador de imóveis experiente."},
                            {"role": "user", "content": prompt}
                        ],
                        temperature=0.2,
                    )
                    resultado = resposta.choices[0].message.content
                except Exception as e3:
                    msg = f"Fallback3 falhou (chat.completions): {repr(e3)}"
                    ia_errors.append(msg)
                    if DEBUG_MODE:
                        print(msg)
                        print(traceback.format_exc())
                    resultado = None

            return resultado, ia_errors

        if tipo == "escritura":
            # Combine todos os textos em uma única análise para reduzir latência e evitar timeouts
            combinado = "\n\n-----\n\n".join(textos_extraidos)
            prompt = gerar_prompt(tipo, combinado)
            resultado, ia_errors = chamar_ia(prompt)
            if not resultado or (isinstance(resultado, str) and not resultado.strip()):
                return JSONResponse(status_code=502, content={
                    "erro": "Falha ao obter resposta da IA",
                    "modelo": modelo,
                    "tipo": tipo,
                    "detalhes": ia_errors[:5]
                })
            nome_pdf = f"escritura_analise_{uuid.uuid4().hex[:8]}.pdf"
            _gerar_pdf(resultado, nome_pdf)
            nomes_pdfs.append(nome_pdf)
        else:
            # Mantém processamento individual por arquivo para certidões
            for texto in textos_extraidos:
                prompt = gerar_prompt(tipo, texto)
                resultado, ia_errors = chamar_ia(prompt)
                if not resultado or (isinstance(resultado, str) and not resultado.strip()):
                    return JSONResponse(status_code=502, content={
                        "erro": "Falha ao obter resposta da IA",
                        "modelo": modelo,
                        "tipo": tipo,
                        "detalhes": ia_errors[:5]
                    })
                matricula = extrair_matricula(texto)
                nome_pdf = f"certidao_{matricula}.pdf"
                _gerar_pdf(resultado, nome_pdf)
                nomes_pdfs.append(nome_pdf)

        if len(nomes_pdfs) == 1:
            response = FileResponse(nomes_pdfs[0], media_type="application/pdf", filename=nomes_pdfs[0])
            # Apaga o PDF após um pequeno atraso para garantir o download
            import threading
            def remove_file_later(path):
                import time; time.sleep(10)
                try: os.remove(path)
                except Exception as e: print(f"Erro ao apagar PDF gerado: {e}")
            threading.Thread(target=remove_file_later, args=(nomes_pdfs[0],)).start()
            return response
        else:
            zip_path = f"certidoes_{uuid.uuid4().hex}.zip"
            with zipfile.ZipFile(zip_path, "w") as zipf:
                for pdf in nomes_pdfs:
                    zipf.write(pdf)
            response = FileResponse(zip_path, media_type="application/zip", filename="certidoes.zip")
            import threading
            def remove_files_later(paths):
                import time; time.sleep(10)
                for path in paths:
                    try: os.remove(path)
                    except Exception as e: print(f"Erro ao apagar arquivo gerado: {e}")
            threading.Thread(target=remove_files_later, args=([*nomes_pdfs, zip_path],)).start()
            return response

    except Exception as e:
        print("Erro geral:", traceback.format_exc())
        return JSONResponse(status_code=500, content={"erro": str(e)})
