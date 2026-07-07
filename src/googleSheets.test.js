import test from "node:test";
import assert from "node:assert/strict";
import { sendToGoogleSheets } from "./googleSheets.js";

function mockFetch(responseBody, { ok = true, status = 200 } = {}) {
  const calls = [];
  global.fetch = async (url, options) => {
    calls.push({ url, options });
    return {
      ok,
      status,
      json: async () => responseBody,
    };
  };
  return calls;
}

test("sendToGoogleSheets: envia relatório para a URL configurada", async () => {
  const calls = mockFetch({ success: true, rowsAdded: 2 });
  const rows = [{ id: 1, nome: "Leanne Graham" }];

  const result = await sendToGoogleSheets(rows, "https://script.google.com/app");

  assert.deepEqual(result, { success: true, rowsAdded: 2 });
  assert.equal(calls[0].url, "https://script.google.com/app");
  assert.equal(calls[0].options.method, "POST");
  assert.equal(
    calls[0].options.headers["Content-Type"],
    "text/plain;charset=utf-8",
  );
  assert.deepEqual(JSON.parse(calls[0].options.body), { report: rows });
});

test("sendToGoogleSheets: lança erro claro quando a URL não foi configurada", async () => {
  await assert.rejects(
    async () => await sendToGoogleSheets([], ""),
    /URL do Google Apps Script não configurada/,
  );
});

test("sendToGoogleSheets: lança erro claro quando a resposta HTTP falha", async () => {
  mockFetch({}, { ok: false, status: 500 });

  await assert.rejects(
    async () => await sendToGoogleSheets([], "https://script.google.com/app"),
    /Erro HTTP 500 ao enviar para o Google Sheets/,
  );
});

test("sendToGoogleSheets: lança erro claro quando o Apps Script retorna falha", async () => {
  mockFetch({ success: false, error: "Planilha não encontrada." });

  await assert.rejects(
    async () => await sendToGoogleSheets([], "https://script.google.com/app"),
    /Planilha não encontrada/,
  );
});

test("sendToGoogleSheets: lança erro claro quando a resposta não é JSON válido", async () => {
  global.fetch = async () => ({
    ok: true,
    status: 200,
    json: async () => {
      throw new SyntaxError("Unexpected token <");
    },
  });

  await assert.rejects(
    async () => await sendToGoogleSheets([], "https://script.google.com/app"),
    /não retornou uma resposta JSON válida/,
  );
});
