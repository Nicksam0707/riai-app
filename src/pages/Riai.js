// src/pages/Riai.js
import React, { useRef, useState } from "react";

import API_BASE_URL from "../utils/api";

const CARD_CONFIG = [
  {
    key: "certidao",
    title: "Certidão do ônus",
    button: "Emitir Certidão",
    fileName: { zip: "certidoes.zip", pdf: "certidao.pdf" },
  },
  {
    key: "escritura",
    title: "Escritura",
    button: "Analisar Escritura",
    fileName: { zip: "escrituras.zip", pdf: "escritura-processada.pdf" },
  },
  {
    key: "verificar",
    title: "Verificar Documento",
    button: "Verificar",
    fileName: { zip: "verificacoes.zip", pdf: "verificacao.pdf" },
  },
];

function SpinnerOverlay() {
  return (
    <div className="spinner-overlay" aria-live="polite">
      <div className="spinner-logo">
        <span role="img" aria-label="spinner" className="spinner-emoji">🔄</span>
        <span className="spinner-text">RIAI by NM</span>
      </div>
    </div>
  );
}

function CardUpload({ config }) {
  const inputRef = useRef(null);
  const [files, setFiles] = useState([]);
  const [dragOver, setDragOver] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Accessibility: focus management
  const buttonRef = useRef(null);

  const handleFiles = (fileList) => {
    const accepted = Array.from(fileList).filter(f =>
      [".pdf", ".tif", ".tiff"].some(ext => f.name.toLowerCase().endsWith(ext))
    );
    setFiles(accepted);
    setError("");
    setSuccess("");
  };

  const handleInputChange = (e) => {
    handleFiles(e.target.files);
    e.target.value = "";
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    handleFiles(e.dataTransfer.files);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setDragOver(true);
  };

  const handleDragLeave = () => setDragOver(false);

  const handleButtonClick = async () => {
    if (config.key === "escritura" && files.length < 2) {
      setError("Selecione pelo menos 2 arquivos para analisar.");
      return;
    }
    if (!files.length) return;
    setLoading(true);
    setError("");
    setSuccess("");
    try {
      const form = new FormData();
      files.forEach(f => form.append("files", f));
      form.append("tipo", config.key);

      const res = await fetch(`${API_BASE_URL}/api/processar-pdf?tipo=${config.key}`, {
        method: "POST",
        body: form,
      });

      if (!res.ok) throw new Error("Falha ao processar. Tente novamente.");

      const blob = await res.blob();
      const ct = res.headers.get("content-type") || "";
      const isZip = ct.includes("application/zip");
      const filename = isZip ? config.fileName.zip : config.fileName.pdf;

      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);

      setSuccess("Download concluído!");
      setFiles([]);
    } catch (err) {
      setError("Erro ao processar. Tente novamente.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className={`card-upload card${dragOver ? " dragover" : ""}`}
      tabIndex={0}
      aria-label={config.title}
      onKeyDown={e => {
        if (e.key === "Enter" && !loading) inputRef.current?.click();
      }}
    >
      <h3>{config.title}</h3>
      <div
        className="dropzone"
        tabIndex={0}
        aria-label={`Solte o PDF/TIF aqui ou clique para selecionar`}
        onClick={() => !loading && inputRef.current?.click()}
        onKeyDown={e => {
          if ((e.key === "Enter" || e.key === " ") && !loading) inputRef.current?.click();
        }}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        style={{ outline: dragOver ? "2px solid #6366f1" : undefined }}
      >
        <span role="img" aria-label="document" style={{ fontSize: 32 }}>📄</span>
        <p>Solte o PDF/TIF aqui ou clique</p>
        <input
          ref={inputRef}
          type="file"
          accept=".pdf,.tif,.tiff"
          multiple
          style={{ display: "none" }}
          onChange={handleInputChange}
          aria-label="Selecionar arquivos"
        />
      </div>
      <div className="file-list" aria-live="polite">
        {files.length > 0 && (
          <ul>
            {files.map((f, i) => (
              <li key={i}>{f.name}</li>
            ))}
          </ul>
        )}
        <span className="file-count" aria-live="polite">
          {files.length > 0 && `${files.length} arquivo${files.length > 1 ? "s" : ""} selecionado${files.length > 1 ? "s" : ""}`}
        </span>
      </div>
      <button
        ref={buttonRef}
        className="btn btn-action"
        onClick={handleButtonClick}
        disabled={loading || !files.length || (config.key === "escritura" && files.length < 2)}
        aria-disabled={loading || !files.length || (config.key === "escritura" && files.length < 2)}
        tabIndex={0}
      >
        {config.button}
      </button>
      {loading && <SpinnerOverlay />}
      {error && <div className="error-msg" aria-live="assertive">{error}</div>}
      {success && <div className="success-msg" aria-live="polite">{success}</div>}
    </div>
  );
}

export default function Riai() {
  return (
    <div className="riai-root">
      <section className="hero">
        <h1>RIAI by NM <span role="img" aria-label="registro">🏛️</span></h1>
        <p>Bem-vindo ao sistema inteligente de registros.</p>
      </section>
      <section className="grid-cards">
        {CARD_CONFIG.map(cfg => (
          <CardUpload key={cfg.key} config={cfg} />
        ))}
      </section>
    </div>
  );
}

