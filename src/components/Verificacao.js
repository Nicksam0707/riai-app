import React, { useState } from "react";

export default function Verificacao() {
  const [pdfFile, setPdfFile] = useState(null);
  const [loading, setLoading] = useState(false);

  const handlePDFChange = (e) => {
    setPdfFile(e.target.files[0]);
  };

  const handleEnviar = async () => {
    if (!pdfFile) return;

    setLoading(true);
    const formData = new FormData();
    formData.append("file", pdfFile);
    formData.append("tipo", "verificar");

    const response = await fetch("http://localhost:8000/api/processar-pdf", {
      method: "POST",
      body: formData,
    });

    const blob = await response.blob();
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", "verificacao.pdf");
    document.body.appendChild(link);
    link.click();
    link.remove();

    setLoading(false);
  };

  return (
    <div style={{ padding: "1rem", marginTop: "2rem" }}>
      <h2>Verificar Documento (PDF)</h2>
      <input type="file" accept=".pdf" onChange={handlePDFChange} />
      <button onClick={handleEnviar} disabled={loading || !pdfFile}>
        {loading ? "Processando..." : "Enviar PDF"}
      </button>
    </div>
  );
}
