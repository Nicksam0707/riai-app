import React, { useState } from "react";

export default function Escritura() {
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
    formData.append("tipo", "escritura");

    const response = await fetch("http://localhost:8000/api/processar-pdf", {
      method: "POST",
      body: formData,
    });

    const blob = await response.blob();
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", "escritura-processada.pdf");
    document.body.appendChild(link);
    link.click();
    link.remove();

    setLoading(false);
  };

  return (
    <div style={{ padding: "1rem", marginTop: "2rem" }}>
      <h2>Analisar Escritura (PDF)</h2>
      <input type="file" accept=".pdf" onChange={handlePDFChange} />
      <button onClick={handleEnviar} disabled={loading || !pdfFile}>
        {loading ? "Processando..." : "Enviar PDF"}
      </button>
    </div>
  );
}

