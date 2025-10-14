// src/App.js
import React from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";

import Riai from "./pages/Riai";
import Certidao from "./components/Certidao";
import Escritura from "./components/Escritura";
import Verificacao from "./components/Verificacao";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Riai />} />
        <Route path="/certidao" element={<Certidao />} />
        <Route path="/escritura" element={<Escritura />} />
        <Route path="/verificar" element={<Verificacao />} />
      </Routes>
    </BrowserRouter>
  );
}
