import React from "react";
import { Link } from "react-router-dom";

export default function Home() {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center py-10 px-4">
      <img src="/logo.png" alt="Logo" className="w-40 mb-4" />
      <h1 className="text-3xl font-bold text-gray-800 mb-1">RIAI by NM 🏛️</h1>
      <p className="text-gray-500 mb-10">Bem-vindo ao sistema inteligente de registros.</p>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 w-full max-w-6xl">
        {/* Certidão */}
        <Link
          to="/certidao"
          className="bg-white rounded-xl shadow-md p-6 hover:shadow-lg transition cursor-pointer"
        >
          <h2 className="text-lg font-semibold text-gray-800 mb-2">Emitir Certidão &rarr;</h2>
          <p className="text-gray-600 text-sm mb-4">Envie um ou mais PDFs ou TIFFs para gerar certidões.</p>
          <button className="bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-md text-sm font-medium">
            Acessar
          </button>
        </Link>

        {/* Escritura */}
        <Link
          to="/escritura"
          className="bg-white rounded-xl shadow-md p-6 hover:shadow-lg transition cursor-pointer"
        >
          <h2 className="text-lg font-semibold text-gray-800 mb-2">Analisar Escritura &rarr;</h2>
          <p className="text-gray-600 text-sm mb-4">Processar um PDF com IA e gerar análise descritiva.</p>
          <button className="bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-md text-sm font-medium">
            Acessar
          </button>
        </Link>

        {/* Verificação */}
        <Link
          to="/verificar"
          className="bg-white rounded-xl shadow-md p-6 hover:shadow-lg transition cursor-pointer"
        >
          <h2 className="text-lg font-semibold text-gray-800 mb-2">Verificar Documento &rarr;</h2>
          <p className="text-gray-600 text-sm mb-4">Compare registros ou verifique se um documento está regular.</p>
          <button className="bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-md text-sm font-medium">
            Acessar
          </button>
        </Link>
      </div>
    </div>
  );
}
