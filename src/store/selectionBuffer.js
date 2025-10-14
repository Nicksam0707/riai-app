// src/store/selectionBuffer.js
let _files = null;

export function setPreselected(files) {
  // espera um array de File
  _files = Array.isArray(files) ? files : Array.from(files || []);
}

export function consumePreselected() {
  const out = _files ? [..._files] : [];
  _files = null; // consome e limpa
  return out;
}
