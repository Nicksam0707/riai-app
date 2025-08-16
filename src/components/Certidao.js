import React, { useState } from "react";
import SpinnerLogo from "../components/SpinnerLogo";

export default function Certidao() {
  const [pdfFiles, setPdfFiles] = useState([]);
  const [loading, setLoading] = useState(false);

  const handlePDFChange = (e) => {
    setPdfFiles([...e.target.files]);
  };

  const handleEnviar = async () => {
    console.log("Enviando PDFs...");

    if (!pdfFiles.length) return;

    try {
      setLoading(true);
      const formData = new FormData();
      pdfFiles.forEach((file) => formData.append("files", file));
      formData.append("tipo", "certidao");

      const response = await fetch("http://localhost:8000/api/processar-pdf", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        throw new Error("Erro ao processar PDFs");
      }

      const blob = await response.blob();
      const contentType = response.headers.get("content-type");
      const isZip = contentType.includes("application/zip");
      const filename = isZip ? "certidoes.zip" : "certidao.pdf";

      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", filename);
      document.body.appendChild(link);
      link.click();
      link.remove();

      console.log("PDF(s) recebidos com sucesso!");
    } catch (error) {
      console.error("Erro ao enviar os PDFs:", error);
      alert("Falha ao gerar a(s) certidão(ões).");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: "1rem" }}>
      <h2>Emitir Certidão (Múltiplos PDFs)</h2>
      <input type="file" accept=".pdf,.tif,.tiff" multiple onChange={handlePDFChange} />
      {loading ? (
        <SpinnerLogo />
      ) : (
        <button onClick={handleEnviar} disabled={!pdfFiles.length}>
          Gerar Certidão
        </button>
      )}
    </div>
  );
}
