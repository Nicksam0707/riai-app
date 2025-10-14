// src/pages/Riai.js
import React, { useRef, useState } from "react";
import Header from "../components/Header";
import SpinnerLogo from "../components/SpinnerLogo";
const API = "http://127.0.0.1:8000"; // troque para 8001 se rodar em outra porta

// util simples para baixar blobs
function downloadBlob(blob, filename) {
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.setAttribute("download", filename);
  document.body.appendChild(a);
  a.click();
  a.remove();
  window.URL.revokeObjectURL(url);
}

// envia arquivos para o backend conforme o tipo
async function enviarArquivos(tipo, files, setLoading) {
  if (!files.length) return;
  try {
    setLoading(true);
    const formData = new FormData();
    files.forEach((f) => formData.append("files", f));
    formData.append("tipo", tipo);

    const res = await fetch("http://localhost:8000/api/processar-pdf", {
      method: "POST",
      body: formData,
    });
    if (!res.ok) throw new Error("Falha no processamento");

    const blob = await res.blob();
    const contentType = res.headers.get("content-type") || "";
    const isZip = contentType.includes("application/zip");

    const filename =
      tipo === "certidao"
        ? isZip ? "certidoes.zip" : "certidao.pdf"
        : tipo === "escritura"
        ? isZip ? "escrituras.zip" : "escritura.pdf"
        : isZip ? "verificacoes.zip" : "verificacao.pdf";

    downloadBlob(blob, filename);
  } catch (e) {
    console.error(e);
    alert("Erro ao processar os arquivos. Veja o console para detalhes.");
  } finally {
    setLoading(false);
  }
}

export default function Riai() {
  // refs para acionar os seletores nativos
  const certInputRef = useRef(null);
  const escriInputRef = useRef(null);
  const veriInputRef = useRef(null);

  // estados de arquivos selecionados
  const [certFiles, setCertFiles] = useState([]);
  const [escriFiles, setEscriFiles] = useState([]);
  const [veriFiles, setVeriFiles] = useState([]);

  // loadings
  const [loadingCert, setLoadingCert] = useState(false);
  const [loadingEscri, setLoadingEscri] = useState(false);
  const [loadingVeri, setLoadingVeri] = useState(false);

  // handlers de seleção
  const onPickCert = (e) => {
    const list = Array.from(e.target.files || []);
    if (list.length) setCertFiles(list);
    e.target.value = ""; // permite escolher o mesmo arquivo de novo
  };
  const onPickEscri = (e) => {
    const list = Array.from(e.target.files || []);
    if (list.length) setEscriFiles(list);
    e.target.value = "";
  };
  const onPickVeri = (e) => {
    const list = Array.from(e.target.files || []);
    if (list.length) setVeriFiles(list);
    e.target.value = "";
  };

  // drag & drop (opcional) – aceita PDF/TIFF
  const filterAccepted = (files) =>
    files.filter((f) =>
      [".pdf", ".tif", ".tiff"].some((ext) =>
        f.name.toLowerCase().endsWith(ext)
      )
    );

  const onDropCert = (e) => {
    e.preventDefault();
    const dropped = filterAccepted(Array.from(e.dataTransfer.files || []));
    if (dropped.length) setCertFiles(dropped);
  };
  const onDropEscri = (e) => {
    e.preventDefault();
    const dropped = filterAccepted(Array.from(e.dataTransfer.files || []));
    if (dropped.length) setEscriFiles(dropped);
  };
  const onDropVeri = (e) => {
    e.preventDefault();
    const dropped = filterAccepted(Array.from(e.dataTransfer.files || []));
    if (dropped.length) setVeriFiles(dropped);
  };

  return (
    <div>
      <Header />

      <main className="container">
        {/* HERO / Título */}
        <section className="hero">
          <h1>RIAI by NM 🏛️</h1>
          <p>Bem-vindo ao sistema inteligente de registros.</p>
        </section>

        {/* TRÊS PAINÉIS – cada um abre o seletor de arquivos (sem navegar) */}
        <section className="grid" style={{ marginTop: "1rem" }}>
          {/* Certidão */}
          <div className="card">
            <h3>Emitir Certidão</h3>

            {/* Botão GRANDE – abre o seletor nativo */}
            <button
              type="button"
              className="dropzone"
              onClick={() => certInputRef.current?.click()}
              onDragOver={(e) => e.preventDefault()}
              onDrop={onDropCert}
              aria-label="Selecionar arquivos para certidão"
            >
              <div style={{ textAlign: "center" }}>
                <div style={{ fontSize: 28 }}>📄</div>
                <p>
                  Solte PDFs ou TIFF
                  <br />
                  <small>(ou clique para escolher)</small>
                </p>
              </div>
            </button>

            {/* input hidden acionado pelo botão */}
            <input
              ref={certInputRef}
              type="file"
              accept=".pdf,.tif,.tiff"
              multiple
              hidden
              onChange={onPickCert}
            />

            {/* lista de arquivos */}
            {certFiles.length > 0 && (
              <ul className="file-list">
                {certFiles.map((f, i) => (
                  <li key={i}>• {f.name}</li>
                ))}
              </ul>
            )}

            {/* ações */}
            <div style={{ display: "flex", gap: 12 }}>
              {loadingCert ? (
                <div className="spinner-wrap">
                  <SpinnerLogo />
                </div>
              ) : (
                <>
                  <button
                    className="btn btn-blue"
                    disabled={!certFiles.length}
                    onClick={() =>
                      enviarArquivos("certidao", certFiles, setLoadingCert)
                    }
                  >
                    Gerar Certidão
                  </button>
                  <button
                    className="btn"
                    style={{ background: "#e2e8f0", color: "#0f172a" }}
                    disabled={!certFiles.length}
                    onClick={() => setCertFiles([])}
                  >
                    Limpar
                  </button>
                </>
              )}
            </div>
          </div>

          {/* Escritura */}
          <div className="card">
            <h3>Analisar Escritura</h3>

            <button
              type="button"
              className="dropzone"
              onClick={() => escriInputRef.current?.click()}
              onDragOver={(e) => e.preventDefault()}
              onDrop={onDropEscri}
              aria-label="Selecionar arquivos para escritura"
            >
              <div style={{ textAlign: "center" }}>
                <div style={{ fontSize: 28 }}>📄</div>
                <p>
                  Solte PDFs ou TIFF
                  <br />
                  <small>(ou clique para escolher)</small>
                </p>
              </div>
            </button>

            <input
              ref={escriInputRef}
              type="file"
              accept=".pdf,.tif,.tiff"
              multiple
              hidden
              onChange={onPickEscri}
            />

            {escriFiles.length > 0 && (
              <ul className="file-list">
                {escriFiles.map((f, i) => (
                  <li key={i}>• {f.name}</li>
                ))}
              </ul>
            )}

            <div style={{ display: "flex", gap: 12 }}>
              {loadingEscri ? (
                <div className="spinner-wrap">
                  <SpinnerLogo />
                </div>
              ) : (
                <>
                  <button
                    className="btn btn-green"
                    disabled={!escriFiles.length}
                    onClick={() =>
                      enviarArquivos("escritura", escriFiles, setLoadingEscri)
                    }
                  >
                    Gerar Escritura
                  </button>
                  <button
                    className="btn"
                    style={{ background: "#e2e8f0", color: "#0f172a" }}
                    disabled={!escriFiles.length}
                    onClick={() => setEscriFiles([])}
                  >
                    Limpar
                  </button>
                </>
              )}
            </div>
          </div>

          {/* Verificação */}
          <div className="card">
            <h3>Verificar Documento</h3>

            <button
              type="button"
              className="dropzone"
              onClick={() => veriInputRef.current?.click()}
              onDragOver={(e) => e.preventDefault()}
              onDrop={onDropVeri}
              aria-label="Selecionar arquivos para verificação"
            >
              <div style={{ textAlign: "center" }}>
                <div style={{ fontSize: 28 }}>📄</div>
                <p>
                  Solte PDFs ou TIFF
                  <br />
                  <small>(ou clique para escolher)</small>
                </p>
              </div>
            </button>

            <input
              ref={veriInputRef}
              type="file"
              accept=".pdf,.tif,.tiff"
              multiple
              hidden
              onChange={onPickVeri}
            />

            {veriFiles.length > 0 && (
              <ul className="file-list">
                {veriFiles.map((f, i) => (
                  <li key={i}>• {f.name}</li>
                ))}
              </ul>
            )}

            <div style={{ display: "flex", gap: 12 }}>
              {loadingVeri ? (
                <div className="spinner-wrap">
                  <SpinnerLogo />
                </div>
              ) : (
                <>
                  <button
                    className="btn btn-amber"
                    disabled={!veriFiles.length}
                    onClick={() =>
                      enviarArquivos("verificar", veriFiles, setLoadingVeri)
                    }
                  >
                    Verificar
                  </button>
                  <button
                    className="btn"
                    style={{ background: "#e2e8f0", color: "#0f172a" }}
                    disabled={!veriFiles.length}
                    onClick={() => setVeriFiles([])}
                  >
                    Limpar
                  </button>
                </>
              )}
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
