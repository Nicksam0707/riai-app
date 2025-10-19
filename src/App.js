// src/App.js
import React from "react";
import { Routes, Route } from "react-router-dom";
import Header from "./components/Header";

import Riai from "./pages/Riai";
import Certidao from "./components/Certidao";
import Escritura from "./components/Escritura";
import Verificacao from "./components/Verificacao";
import Login from "./pages/Login";
import ProtectedRoute from "./components/ProtectedRoute";

export default function App() {
  return (
    <>
      <Header />
      <main className="container">
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <Riai />
              </ProtectedRoute>
            }
          />
          <Route
            path="/certidao"
            element={
              <ProtectedRoute>
                <Certidao />
              </ProtectedRoute>
            }
          />
          <Route
            path="/escritura"
            element={
              <ProtectedRoute>
                <Escritura />
              </ProtectedRoute>
            }
          />
          <Route
            path="/verificar"
            element={
              <ProtectedRoute>
                <Verificacao />
              </ProtectedRoute>
            }
          />
        </Routes>
      </main>
    </>
  );
}
