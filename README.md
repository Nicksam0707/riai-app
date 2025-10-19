# RIAI App (Frontend + FastAPI Backend)

AI-assisted analysis of Escrituras and emissão de Certidão do ônus. Frontend em React, backend em FastAPI com OpenAI.

## Estrutura

- Frontend (React): `src/`, `public/`, `Dockerfile` (raiz)
- Backend (FastAPI): `backend/` (inclui OCR/PDF libs, `requirements.txt`, `Dockerfile`)
- Deploy: `render.yaml` (Blueprint com 2 serviços)

## Pré-requisitos

- Node.js 18+ e npm
- Python 3.11+ (para rodar o backend localmente)
- OpenAI API key
- poppler e tesseract (para OCR local; já inclusos no Docker do backend)

## Configuração de ambiente

1) Copie `backend/.env.example` para `backend/.env` e preencha:

```
OPENAI_API_KEY=seu_token
GUIA_IRIB_FILE_ID=opcional
MODEL_CERTIDAO=gpt-5-mini
MODEL_ESCRITURA=gpt-5-mini
DEBUG=false
```

2) (Opcional) Faça upload do Guia IRIB para usar como attachment no fluxo de Escritura:
- Coloque o PDF em `backend/attachments/Guia_IRIB.pdf`
- Rode `python backend/upload_guia_irib.py` e copie o `file_id` para `GUIA_IRIB_FILE_ID`.

## Rodando localmente

Backend:
1) Instale dependências: `pip install -r backend/requirements.txt`
2) Inicie: `uvicorn backend.main:app --reload --host 127.0.0.1 --port 8000`
3) Verifique: abra `http://127.0.0.1:8000/docs`

Frontend:
1) Instale: `npm install`
2) Inicie: `npm start`
3) O app abre em `http://localhost:3000`

Obs.: O frontend usa `REACT_APP_API_BASE_URL` (em build) ou fallback `http://127.0.0.1:8000` para desenvolvimento.

## Deploy na Render (Blueprint)

1) Faça push do repositório para o GitHub.
2) Em Render, crie um Blueprint apontando para este repo (arquivo `render.yaml`).
3) Configure as env vars do backend (serviço `riai-backend`):
	- `OPENAI_API_KEY` (Required)
	- `GUIA_IRIB_FILE_ID` (Opcional, se tiver subido o PDF)
	- `MODEL_CERTIDAO` = gpt-5-mini
	- `MODEL_ESCRITURA` = gpt-5-mini
4) O serviço `riai-frontend` já passa `REACT_APP_API_BASE_URL` apontando para o backend.
5) Depois do deploy:
	- Teste o backend em `https://<backend>.onrender.com/docs`
	- Abra o frontend e valide os fluxos (upload, geração de PDF/ZIP).

## Dicas / Troubleshooting

- CORS: O backend está com `allow_origins=["*"]` e `allow_credentials=false`. Use o mesmo host (localhost ou 127.0.0.1) durante dev.
- Limpeza de arquivos: PDFs/ZIPs gerados são removidos automaticamente após alguns segundos, depois do download.
- Erros da IA: O backend tenta uma cadeia de fallbacks. Se todos falharem, retorna 502 com detalhes. Ative `DEBUG=true` para mais logs.

## Licença

Uso interno/experimental.
