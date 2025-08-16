import React from "react";
import { useNavigate } from "react-router-dom";
import { getAuth, signOut } from "firebase/auth";
import Header from "../components/Header";

export default function Riai() {
  const navigate = useNavigate();
  const auth = getAuth();

  const handleLogout = async () => {
    await signOut(auth);
    window.location.reload();
  };

  return (
    <div className="min-h-screen bg-gray-100 text-gray-800">
      <Header />
      <div className="max-w-4xl mx-auto py-10 px-4">
        <h1 className="text-3xl font-bold mb-2">RIAI by NM 🏛️</h1>
        <p className="mb-8">Bem-vindo ao sistema inteligente de registros.</p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          <div className="bg-white rounded-xl shadow p-6 hover:shadow-md">
            <h2 className="text-xl font-semibold mb-2">Emitir Certidão</h2>
            <p className="text-sm mb-4">Envie um ou mais PDFs de matrícula e gere a certidão automaticamente.</p>
            <button
              className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
              onClick={() => navigate("/certidao")}
            >
              Acessar
            </button>
          </div>

          <div className="bg-white rounded-xl shadow p-6 hover:shadow-md">
            <h2 className="text-xl font-semibold mb-2">Analisar Escritura</h2>
            <p className="text-sm mb-4">Envie uma escritura em PDF e receba a análise jurídica automatizada.</p>
            <button
              className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
              onClick={() => navigate("/escritura")}
            >
              Acessar
            </button>
          </div>

          <div className="bg-white rounded-xl shadow p-6 hover:shadow-md">
            <h2 className="text-xl font-semibold mb-2">Verificar Documento</h2>
            <p className="text-sm mb-4">Verifique se um documento corresponde à matrícula original.</p>
            <button
              className="bg-yellow-500 text-white px-4 py-2 rounded hover:bg-yellow-600"
              onClick={() => navigate("/verificacao")}
            >
              Acessar
            </button>
          </div>
        </div>

        <div className="mt-10">
          <button
            onClick={handleLogout}
            className="text-red-600 underline hover:text-red-800"
          >
            Sair
          </button>
        </div>
      </div>
    </div>
  );
}
