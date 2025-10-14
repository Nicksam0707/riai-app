// src/components/Home.js
import React from "react";
import { useNavigate } from "react-router-dom";
import logo from "../assets/logo.png";

export default function Home() {
  const navigate = useNavigate();

  const Card = ({ title, subtitle, btn, to, accent }) => (
    <div className="card">
      <h3>{title} <span className="arrow">→</span></h3>
      <small className="muted">{subtitle}</small>

      <div className="upload">
        <div className="icon">⬇</div>
        <p>Solte PDFs<br /><span className="muted">ou TIFF</span></p>
      </div>

      <button className={`btn ${accent}`} onClick={() => navigate(to)}>
        {btn}
      </button>
    </div>
  );

  return (
    <div className="screen">
      {/* Fundo */}
      <div className="bg">
        <div className="blob b1"></div>
        <div className="blob b2"></div>
      </div>

      {/* Topo */}
      <header className="topbar">
        <img src={logo} alt="Registro de Imóveis do Brasil" className="brand" />
        <span className="product">RIAI by NM</span>
      </header>

      {/* Painel em vidro */}
      <main className="glass">
        <h1>RIAI by NM <span className="emoji">🏛️</span></h1>
        <p className="subtitle">Bem-vindo ao sistema inteligente de registros.</p>

        <div className="cards">
          <Card
            title="Emitir Certidão"
            subtitle="(PDFs)"
            btn="Gerar Certidão"
            to="/certidao"
            accent="primary"
          />
          <Card
            title="Analisar Escritura"
            subtitle="(PDFs)"
            btn="Gerar Escritura"
            to="/escritura"
            accent="success"
          />
          <Card
            title="Verificar"
            subtitle="(PDFs)"
            btn="Verificar"
            to="/verificar"
            accent="warning"
          />
        </div>
      </main>
    </div>
  );
}
