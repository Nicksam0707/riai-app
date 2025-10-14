// src/components/Header.js
import React from "react";
import { Link } from "react-router-dom";

export default function Header() {
  return (
    <header className="header">
      <div className="header-inner">
        <Link to="/" style={{ display: "flex", alignItems: "center", gap: 12, textDecoration: "none", color: "inherit" }}>
          <img src="/logo-registro.png" alt="Registro" className="header-logo" />
          <span className="header-title">RIAI by NM</span>
        </Link>
      </div>
    </header>
  );
}
