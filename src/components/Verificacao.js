import React, { useState } from "react";
import SpinnerLogo from "../components/SpinnerLogo";
import API_BASE_URL from "../utils/api";

export default function Verificacao() {
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(false);
  const handleChange = (e) => setFiles([...e.target.files]);
  const handleEnviar = async () => {
    if (!files.length) return;
    setLoading(true);
    try {
      const form = new FormData();
      files.forEach((f) => form.append("files", f));
      form.append("tipo", "verificar");
      const resp = await fetch(`${API_BASE_URL}/api/processar-pdf`, { method: "POST", body: form });
      if (!resp.ok) throw new Error(`Erro ${resp.status}: ${await resp.text()}`);
      const blob = await resp.blob();
      const ct = resp.headers.get("content-type") || "";
      const isZip = ct.includes("application/zip");
      const filename = isZip ? "verificacoes.zip" : "verificacao.pdf";
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a"); a.href = url; a.download = filename;
      document.body.appendChild(a); a.click(); a.remove(); URL.revokeObjectURL(url);
    } catch (err) { console.error(err); alert("Falha na verificação."); }
    finally { setLoading(false); }
  };
  return (
    <div style={{ padding: "1rem", marginTop: "2rem" }}>
      <h2>Verificar Documento (PDF/TIFF)</h2>
      <input type="file" accept=".pdf,.tif,.tiff" multiple onChange={handleChange} />
      {loading ? <SpinnerLogo /> : <button onClick={handleEnviar} disabled={!files.length}>Enviar</button>}
    </div>
  );
}
