import React from "react";

export default function Header() {
  return (
    <header style={{
      display: "flex",
      alignItems: "center",
      padding: "1rem 2rem",
      borderBottom: "1px solid #ccc",
      backgroundColor: "#fff",
      justifyContent: "center",
      gap: "1rem"
    }}>
      <img
        src="/logo-registro.png"
        alt="Registro de Imóveis"
        style={{ height: "50px" }}
      />
      <h1 style={{
        margin: 0,
        fontSize: "1.5rem",
        fontWeight: "bold",
        color: "#000",
        fontFamily: "'Segoe UI', sans-serif"
      }}>
        RIAI by NM
      </h1>
    </header>
  );
}
