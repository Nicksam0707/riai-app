import os
import sys
from dotenv import load_dotenv
from openai import OpenAI


def main():
    # Carrega variáveis do .env (backend/.env)
    load_dotenv()

    api_key = os.getenv("OPENAI_API_KEY")
    if not api_key:
        print("ERROR: OPENAI_API_KEY não definido. Crie backend/.env (baseado em backend/.env.example) e preencha sua chave.")
        sys.exit(1)

    # Caminho do arquivo (padrão) ou via argumento
    default_path = os.path.join("attachments", "Guia_IRIB.pdf")
    file_path = sys.argv[1] if len(sys.argv) > 1 else default_path

    if not os.path.exists(file_path):
        print(f"ERROR: Arquivo não encontrado: {file_path}")
        print("Dica: coloque o PDF em backend/attachments/Guia_IRIB.pdf ou passe o caminho como argumento.")
        sys.exit(1)

    print(f"Enviando arquivo: {file_path}")
    client = OpenAI(api_key=api_key)
    try:
        with open(file_path, "rb") as f:
            uploaded = client.files.create(file=f, purpose="assistants")
        print("Arquivo enviado com sucesso!")
        print(f"file_id: {uploaded.id}")
    except Exception as e:
        print("Erro ao enviar arquivo:", e)
        sys.exit(1)


if __name__ == "__main__":
    main()
