// Integração com Google Sheets via Google Apps Script (Web App).
//
// Por que não usar a API oficial do Google Sheets diretamente?
// A API oficial (Sheets API v4) exige OAuth 2.0 com consentimento do usuário
// e configuração de um projeto no Google Cloud Console (client ID, tela de
// consentimento, escopos). Isso é desproporcional para um diferencial opcional
// deste case. A alternativa mais simples e comumente usada é publicar um
// Google Apps Script como "Web App", que atua como um endpoint HTTP simples
// que grava diretamente na planilha, sem exigir OAuth do lado do cliente.
//
// Por que Content-Type "text/plain" em vez de "application/json"?
// O Apps Script Web App não responde corretamente ao preflight (OPTIONS) que
// o navegador dispara automaticamente para requisições com Content-Type
// "application/json". Usando "text/plain", o navegador não dispara o
// preflight, e fazemos o parse do JSON manualmente dentro do doPost (no
// Apps Script). Essa é a técnica padrão documentada para esse cenário.

export async function sendToGoogleSheets(rows, webAppUrl) {
  if (!webAppUrl) {
    throw new Error("URL do Google Apps Script não configurada.");
  }

  const response = await fetch(webAppUrl, {
    method: "POST",
    headers: { "Content-Type": "text/plain;charset=utf-8" },
    body: JSON.stringify({ report: rows }),
  });

  const result = await response.json();

  if (!result.success) {
    throw new Error(
      result.error || "Erro desconhecido ao enviar para o Google Sheets.",
    );
  }

  return result;
}
