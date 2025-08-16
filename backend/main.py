from fastapi import FastAPI, UploadFile, File, Form
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse, JSONResponse
from openai import OpenAI
from dotenv import load_dotenv
from fpdf import FPDF
import pdfplumber
import pytesseract
from PIL import Image
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

def extrair_texto_pdf(file_bytes):
    texto = ""
    try:
        with pdfplumber.open(file_bytes) as pdf:
            for page in pdf.pages:
                texto += page.extract_text() or ""
    except Exception:
        pass

    if not texto.strip():
        imagens = convert_from_bytes(file_bytes)
        for img in imagens:
            texto += pytesseract.image_to_string(img)
    return texto

def extrair_matricula(texto):
    padrao = r"matr[íi]cula(?: n[ºo]| número| nº)?[^\d]{0,3}(\d{3,})"
    resultado = re.search(padrao, texto, re.IGNORECASE)
    return resultado.group(1) if resultado else str(uuid.uuid4())[:8]

def gerar_prompt(tipo: str, texto: str) -> str:
    data = datetime.datetime.now()
    hora_emissao = data.strftime("%H:%M:%S")
    meses_pt = [
        "janeiro", "fevereiro", "março", "abril", "maio", "junho",
        "julho", "agosto", "setembro", "outubro", "novembro", "dezembro"
    ]
    data_extenso = f"{data.day} de {meses_pt[data.month - 1]} de {data.year}"

    base_prompt = f"""
Você é um registrador do 6º Registro de Imóveis de Curitiba.

Analise a matrícula abaixo e, em texto corrido, elabore uma certidão da situação jurídica do imóvel, observando:

1. Descreva o imóvel, localização e características.
2. Informe o(s) proprietário(s) atual(is) e forma de aquisição.
3. Aponte o histórico recente de registros.
4. Indique se há algum dos seguintes ônus ou gravames vigentes: "regime de patrimônio de afetação imobiliária", "hipoteca", "alienação fiduciária", "penhora", "usufruto", "servidão", "ação real", "ação pessoal", "ação reipersecutória", "impenhorabilidade", "inalienabilidade", "anticrese", "gravame", "ônus". **Desconsidere quaisquer ônus que já tenham sido cancelados.**
5. Além dos termos descritos, fique atento a qualquer outro caso de ônus ou gravame existente e também aos transportes de ônus ou gravames.
6. Atentar para o fato de que, enquanto não forem expressamente cancelados, os ônus ou gravames continuam vigentes e devem ser mencionados na certidão.
7. EM CASO DE SER UMA MATRÍCULA MÃE (IDENTIFICAR PELO REGISTRO DE UMA INCORPORAÇÃO IMOBILIÁRIA OU UMA INSTITUIÇÃO DE CONDOMÍNIO), RETORNAR O PDF ESCRITO SOMENTE: "MANDAR A MATRÍCULA FILHA"
8. Se a matrícula enviada já estiver encerrada, mandar uma mensagem escrita antes da certidão: "A MATRÍCULA JÁ FOI ENCERRADA, A CERTIDÃO DE QUANDO ELA ESTAVA ATIVA SEGUE ABAIXO".
9. Lembre-se de que pacto antenupcial não é considarado ônus.

Ao final da certidão, inclua sempre:

Certifico, a requerimento de pessoa interessada, que, revendo os livros de registros imobiliários existentes nesta serventia, em relação ao imóvel constante da matrícula sob nº [NÚMERO], [DESCRIÇÃO DO IMÓVEL], de propriedade de [NOME E CPF DO PROPRIETÁRIO];

- Se não houver ônus: "NÃO CONSTAM quaisquer ônus, gravames, ações reais ou pessoais e reipersecutórias."
- Se houver ônus: repetir a frase acima e adicionar "a não ser: ..." com a lista.

O referido é verdade e dou fé.
Curitiba – PR, {data_extenso}. Certidão emitida às {hora_emissao}.

A matrícula é:

{texto}
"""
    return base_prompt

@app.post("/api/processar-pdf")
async def processar_pdf(tipo: str = Form(...), files: list[UploadFile] = File(...)):
    try:
        nomes_pdfs = []

        for file in files:
            conteudo = await file.read()
            filename = file.filename.lower()

            if filename.endswith(".pdf"):
                texto = extrair_texto_pdf(conteudo)
            elif filename.endswith(".tif") or filename.endswith(".tiff"):
                file.file.seek(0)
                imagem = Image.open(file.file)
                texto = pytesseract.image_to_string(imagem)
            else:
                texto = ""

            if not texto.strip():
                continue

            matricula = extrair_matricula(texto)
            nome_pdf = f"certidao_{matricula}.pdf"
            nomes_pdfs.append(nome_pdf)

            prompt = gerar_prompt(tipo, texto)
            resposta = client.chat.completions.create(
                model="gpt-4o",
                messages=[
                    {"role": "system", "content": "Você é um registrador de imóveis experiente."},
                    {"role": "user", "content": prompt}
                ]
            )
            resultado = resposta.choices[0].message.content

            font_path = os.path.join(
                os.path.dirname(__file__),
                "fonts",
                "dejavu-fonts-ttf-2.37",
                "dejavu-fonts-ttf-2.37",
                "ttf",
                "DejaVuSans.ttf"
            )

            pdf = FPDF()
            pdf.add_page()
            pdf.set_auto_page_break(auto=True, margin=15)
            pdf.add_font("DejaVu", "", font_path, uni=True)
            pdf.set_font("DejaVu", "", 12)

            for linha in resultado.split("\n"):
                pdf.multi_cell(0, 10, txt=linha.strip())

            pdf.output(nome_pdf)

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
