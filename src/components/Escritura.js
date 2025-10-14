// src/components/Escritura.js
import React, { useState } from "react";
import SpinnerLogo from "./SpinnerLogo";

export default function Escritura() {
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    const list = Array.from(e.target.files || []);
    if (list.length) setFiles(list);
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
    <div className="container mx-auto max-w-3xl px-4 py-8">
      <div className="rounded-2xl border border-slate-200 bg-white/90 p-6 shadow">
        <h2 className="text-2xl font-bold text-slate-900">Analisar Escritura</h2>

        <label
          htmlFor="escritura-files"
          onDragOver={(e) => e.preventDefault()}
          onDrop={handleDrop}
          className="mt-4 grid h-40 w-full cursor-pointer place-items-center rounded-xl border-2 border-dashed border-slate-300 bg-slate-50 hover:border-green-600 hover:bg-green-50 transition"
        >
          <div className="text-center text-slate-600">
            <div className="text-3xl">⬇️</div>
            <p className="mt-2">
              Solte PDFs ou TIFF
              <br />
              <span className="text-slate-400 text-sm">(ou clique para escolher)</span>
            </p>
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
          <ul className="mt-4 space-y-1 text-sm text-slate-700">
            {files.map((f, idx) => (
              <li key={idx} className="truncate">• {f.name}</li>
            ))}
          </ul>
        )}

        <div className="mt-5 flex items-center gap-3">
          {loading ? (
            <div className="flex-1 rounded-xl bg-slate-100 py-3">
              <SpinnerLogo />
            </div>
          ) : (
            <>
              <button
                onClick={handleEnviar}
                disabled={!files.length}
                className="flex-1 rounded-xl bg-green-600 py-3 font-medium text-white hover:bg-green-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Gerar Escritura
              </button>
              <button
                onClick={() => setFiles([])}
                disabled={!files.length}
                className="rounded-xl border border-slate-300 px-4 py-3 text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Limpar
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
