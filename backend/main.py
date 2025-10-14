from fastapi import FastAPI, UploadFile, File, Form
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse, JSONResponse
from openai import OpenAI
from dotenv import load_dotenv
from fpdf import FPDF
import pdfplumber
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
app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://localhost:3001"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))

# ---------- Utilidades ----------

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
        with pdfplumber.open(file_bytes) as pdf:
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

    base_prompt = f"""
Você é um registrador do 6º Registro de Imóveis de Curitiba.

Analise a matrícula abaixo e, em texto corrido, elabore uma certidão da situação jurídica do imóvel, observando:

1. Descreva o imóvel, localização e características.
2. Informe o(s) proprietário(s) atual(is) e forma de aquisição.
3. Aponte o histórico recente de registros.
4. Indique se há algum dos seguintes ônus ou gravames vigentes: "regime de patrimônio de afetação imobiliária", "hipoteca", "alienação fiduciária", "penhora", "usufruto", "servidão", "ação real", "ação pessoal", "ação reipersecutória", "impenhorabilidade", "inalienabilidade", "anticrese", "gravame", "ônus". **Desconsidere quaisquer ônus que já tenham sido cancelados.**
5. Além dos termos descritos, fique atento a qualquer outro caso de ônus ou gravame existente e também aos transportes de ônus ou gravames.
6. Atentar que, enquanto não forem expressamente cancelados, os ônus ou gravames continuam vigentes e devem ser mencionados.
7. SE FOR MATRÍCULA MÃE (ex.: incorporação imobiliária ou instituição de condomínio), RETORNAR SOMENTE: "MANDAR A MATRÍCULA FILHA".
8. Se a matrícula enviada já estiver encerrada, escrever ANTES da certidão: "A MATRÍCULA JÁ FOI ENCERRADA, A CERTIDÃO DE QUANDO ELA ESTAVA ATIVA SEGUE ABAIXO".

No fim, use exatamente este modelo:

Certifico, a requerimento de pessoa interessada, que, revendo os livros de registros imobiliários existentes nesta serventia, em relação ao imóvel constante da matrícula sob nº [NÚMERO], [DESCRIÇÃO DO IMÓVEL], de propriedade de [NOME E CPF DO PROPRIETÁRIO];

- Se não houver ônus: "NÃO CONSTAM quaisquer ônus, gravames, ações reais ou pessoais e reipersecutórias."
- Se houver ônus: repetir a frase acima e adicionar "a não ser: ..." com a lista.

Consulta a Central Nacional de Indisponibilidade de Bens – CNIB, códigos Hash: [HASH]. O referido é verdade e dou fé.
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

        for file in files:
            conteudo = await file.read()
            filename = (file.filename or "").lower()

            # 1) extrair texto conforme extensão
            if filename.endswith(".pdf"):
                texto = extrair_texto_pdf(conteudo)
            elif filename.endswith(".tif") or filename.endswith(".tiff"):
                texto = extrair_texto_tiff(file)
            else:
                # tenta OCR genérico via PIL
                try:
                    file.file.seek(0)
                    img = Image.open(file.file)
                    texto = pytesseract.image_to_string(img)
                except Exception:
                    texto = ""

            if not texto.strip():
                # ignora arquivos sem texto extraído
                continue

            # 2) extrair matrícula p/ nome do arquivo
            matricula = extrair_matricula(texto)

            # 3) montar prompt
            prompt = gerar_prompt(tipo, texto)

            # 4) chamar a IA (Responses API com fallbacks)
            try:
                resposta = client.responses.create(
                    model="gpt-5",
                    input=[
                        {"role": "system", "content": "Você é um registrador de imóveis experiente."},
                        {"role": "user", "content": prompt}
                    ],
                    temperature=0.2,
                )
                try:
                    resultado = resposta.output[0].content[0].text
                except Exception:
                    resultado = getattr(resposta, "output_text", None) or str(resposta)
            except Exception:
                try:
                    resposta = client.responses.create(
                        model="gpt-4.1-mini",
                        input=[
                            {"role": "system", "content": "Você é um registrador de imóveis experiente."},
                            {"role": "user", "content": prompt}
                        ],
                        temperature=0.2,
                    )
                    try:
                        resultado = resposta.output[0].content[0].text
                    except Exception:
                        resultado = getattr(resposta, "output_text", None) or str(resposta)
                except Exception:
                    # fallback legado
                    resposta = client.chat.completions.create(
                        model="gpt-4o-mini",
                        messages=[
                            {"role": "system", "content": "Você é um registrador de imóveis experiente."},
                            {"role": "user", "content": prompt}
                        ],
                        temperature=0.2,
                    )
                    resultado = resposta.choices[0].message.content

            # 5) gerar PDF com nomeado pela matrícula
            # Se você prefere com acento, troque por f"certidão_{matricula}.pdf"
            nome_pdf = f"certidao_{matricula}.pdf"
            _gerar_pdf(resultado, nome_pdf)
            nomes_pdfs.append(nome_pdf)

        if not nomes_pdfs:
            return JSONResponse(status_code=400, content={"erro": "Nenhum texto válido extraído dos arquivos enviados."})

        if len(nomes_pdfs) == 1:
            return FileResponse(nomes_pdfs[0], media_type="application/pdf", filename=nomes_pdfs[0])
        else:
            zip_path = f"certidoes_{uuid.uuid4().hex}.zip"
            with zipfile.ZipFile(zip_path, "w") as zipf:
                for pdf in nomes_pdfs:
                    zipf.write(pdf)
            return FileResponse(zip_path, media_type="application/zip", filename="certidoes.zip")

    except Exception as e:
        print("Erro geral:", traceback.format_exc())
        return JSONResponse(status_code=500, content={"erro": str(e)})
