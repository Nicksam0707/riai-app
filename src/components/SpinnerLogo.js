import React from "react";
import logo from "../assets/logo.png";
import "./spinner.css";

export default function SpinnerLogo() {
  return (
    <div className="spinner-container">
      <img src={logo} alt="Logo RIAI by NM" className="logo-blink" />
    </div>
  );
}
