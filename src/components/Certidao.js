import React, { useState } from "react";
import SpinnerLogo from "../components/SpinnerLogo";
import API_BASE_URL from "../utils/api";

export default function Certidao() {
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(false);
  const handleChange = (e) => setFiles([...e.target.files]);
  const handleEnviar = async () => {
    if (!files.length) return;
    setLoading(true);
    try {
      const form = new FormData();
      files.forEach((f) => form.append("files", f));
      form.append("tipo", "certidao");
      const resp = await fetch(`${API_BASE_URL}/api/processar-pdf`, { method: "POST", body: form });
      if (!resp.ok) throw new Error(`Erro ${resp.status}: ${await resp.text()}`);
      const blob = await resp.blob();
      const ct = resp.headers.get("content-type") || "";
      const isZip = ct.includes("application/zip");
      const filename = isZip ? "certidoes.zip" : "certidao.pdf";
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a"); a.href = url; a.download = filename;
      document.body.appendChild(a); a.click(); a.remove(); URL.revokeObjectURL(url);
    } catch (err) { console.error(err); alert("Falha ao gerar certidão. Verifique o backend."); }
    finally { setLoading(false); }
  };
  return (
    <div style={{ padding: "1rem", marginTop: "2rem", borderRadius: "12px", boxShadow: "0 2px 8px #0001", background: "#fff", position: "relative" }}>
  <div style={{ position: "absolute", top: 12, left: 20, fontWeight: "bold", fontSize: 20, color: "#2c3e50" }}>Certidão do ônus</div>
      <div style={{ height: 32 }} />
      <input type="file" accept=".pdf,.tif,.tiff" multiple onChange={handleChange} style={{ marginBottom: 16 }} />
      {loading ? <SpinnerLogo /> : <button onClick={handleEnviar} disabled={!files.length} style={{ fontWeight: "bold", background: "#2c3e50", color: "#fff", borderRadius: 6, padding: "8px 20px", border: "none" }}>Emitir Certidão</button>}
    </div>
  );
}
