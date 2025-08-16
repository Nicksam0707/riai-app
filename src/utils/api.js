// src/utils/api.js
export const processarPDF = async (formData) => {
  const response = await fetch("http://localhost:8000/api/processar-pdf", {
    method: "POST",
    body: formData,
  });

  if (!response.ok) {
    throw new Error("Erro ao processar o arquivo PDF.");
  }

  const blob = await response.blob();
  const url = URL.createObjectURL(blob);
  return url;
};
