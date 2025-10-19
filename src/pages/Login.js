import React, { useState } from "react";
import { getAuth, signInWithEmailAndPassword, createUserWithEmailAndPassword } from "firebase/auth";
import { app } from "../lib/firebase"; // ajuste o caminho se necessário
import { useLocation, useNavigate } from "react-router-dom";

const auth = getAuth(app);

export default function Login() {
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [modoCadastro, setModoCadastro] = useState(false);
  const [mensagem, setMensagem] = useState("");
  const navigate = useNavigate();
  const location = useLocation();
  const from = location.state?.from?.pathname || "/";

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMensagem("");

    try {
      if (modoCadastro) {
        await createUserWithEmailAndPassword(auth, email, senha);
        setMensagem("✅ Cadastro realizado com sucesso!");
      } else {
        await signInWithEmailAndPassword(auth, email, senha);
        setMensagem("✅ Login realizado com sucesso!");
      }
      // redirect after success
      setTimeout(() => navigate(from, { replace: true }), 300);
    } catch (err) {
      setMensagem("❌ " + err.message);
    }
  };

  return (
    <div style={{ padding: "1rem", maxWidth: "400px", margin: "0 auto", fontFamily: "sans-serif" }}>
      {/* LOGO */}
      <img
        src="/logo-registro.png"
        alt="Registro de Imóveis"
        style={{ width: "180px", display: "block", margin: "0 auto 1rem" }}
      />

      {/* TÍTULO */}
      <h1 style={{ textAlign: "center", fontWeight: "bold", fontSize: "1.5rem", marginBottom: "1rem", color: "#000" }}>
        RIAI by NM
      </h1>

      {/* FORMULÁRIO */}
      <h2 style={{ textAlign: "center", marginBottom: "1rem" }}>
        {modoCadastro ? "Cadastro" : "Login"}
      </h2>

      <form onSubmit={handleSubmit}>
        <input
          type="email"
          placeholder="E-mail"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          style={{ width: "100%", marginBottom: "10px", padding: "8px" }}
        />
        <input
          type="password"
          placeholder="Senha"
          value={senha}
          onChange={(e) => setSenha(e.target.value)}
          required
          style={{ width: "100%", marginBottom: "10px", padding: "8px" }}
        />
        <button type="submit" style={{ width: "100%", padding: "10px", backgroundColor: "#4CAF50", color: "#fff", border: "none" }}>
          {modoCadastro ? "Cadastrar" : "Entrar"}
        </button>
        <br /><br />
        <button type="button" onClick={() => setModoCadastro(!modoCadastro)} style={{ width: "100%", padding: "8px" }}>
          {modoCadastro ? "Já tem conta? Faça login" : "Não tem conta? Cadastre-se"}
        </button>
        <div style={{ marginTop: "15px", fontSize: "14px", color: "#333" }}>{mensagem}</div>
      </form>
    </div>
  );
}
