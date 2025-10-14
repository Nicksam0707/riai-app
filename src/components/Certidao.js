import React, { useState } from "react";
import SpinnerLogo from "./SpinnerLogo";

export default function Escritura() {
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    const picked = Array.from(e.target.files || []);
    if (picked.length) setFiles(picked);
    e.target.value = "";
  };

  const handleDrop = (e) => {
    e.preventDefault();
    const dropped = Array.from(e.dataTransfer.files || []);
    const filtered = dropped.filter((f) =>
      [".pdf", ".tif", ".tiff"].some((ext) => f.name.toLowerCase().endsWith(ext))
    );
    if (filtered.length) setFiles(filtered);
  };

  const handleEnviar = async () => {
    if (!files.length) return;
    try {
      setLoading(true);
      const formData = new FormData();
      files.forEach((f) => formData.append("files", f));
      formData.append("tipo", "escritura");

      const res = await fetch("http://localhost:8000/api/processar-pdf", {
        method: "POST",
        body: formData,
      });
      if (!res.ok) throw new Error("Erro ao processar");

      const blob = await res.blob();
      const contentType = res.headers.get("content-type") || "";
      const isZip = contentType.includes("application/zip");
      const filename = isZip ? "escrituras.zip" : "escritura.pdf";

      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.setAttribute("download", filename);
      document.body.appendChild(a);
      a.click();
      a.remove();
    } catch (e) {
      console.error(e);
      alert("Falha ao gerar a(s) escritura(s).");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="container">
      <div className="panel">
        <h2>Analisar Escritura</h2>

        <label
          htmlFor="escritura-files"
          onDragOver={(e) => e.preventDefault()}
          onDrop={handleDrop}
          className="dropzone"
        >
          <div style={{ textAlign: "center" }}>
            <div style={{ fontSize: 28 }}>⬇️</div>
            <p>Solte PDFs ou TIFF<br /><small>(ou clique para escolher)</small></p>
          </div>
        </label>

        <input
          id="escritura-files"
          type="file"
          accept=".pdf,.tif,.tiff"
          multiple
          hidden
          onChange={handleChange}
        />

        {files.length > 0 && (
          <ul className="file-list">
            {files.map((f, i) => <li key={i}>• {f.name}</li>)}
          </ul>
        )}

        <div style={{ display: "flex", gap: 12, marginTop: 12 }}>
          {loading ? (
            <div className="spinner-wrap"><SpinnerLogo /></div>
          ) : (
            <>
              <button
                onClick={handleEnviar}
                disabled={!files.length}
                className="btn btn-green"
              >
                Gerar Escritura
              </button>
              <button
                onClick={() => setFiles([])}
                disabled={!files.length}
                className="btn"
                style={{ background: "#e2e8f0", color: "#0f172a" }}
              >
                Limpar
              </button>
            </>
          )}
        </div>
      </div>
    </main>
  );
}
