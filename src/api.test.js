import test from "node:test";
import assert from "node:assert/strict";
import {
  getUsers,
  getPostsByUser,
  getCommentsByPost,
  postReport,
} from "./api.js";

// --- Helper: substitui global.fetch por uma versão falsa para cada teste ---
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

test("getUsers: chama a URL correta e retorna os dados", async () => {
  const calls = mockFetch([{ id: 1, name: "Leanne Graham" }]);

  const users = await getUsers();

  assert.equal(calls.length, 1);
  assert.equal(calls[0].url, "https://jsonplaceholder.typicode.com/users");
  assert.deepEqual(users, [{ id: 1, name: "Leanne Graham" }]);
});

test("getPostsByUser: monta a query string do userId corretamente", async () => {
  const calls = mockFetch([{ id: 1, userId: 1, body: "texto" }]);

  await getPostsByUser(1);

  assert.equal(
    calls[0].url,
    "https://jsonplaceholder.typicode.com/posts?userId=1",
  );
});

test("getCommentsByPost: monta a query string do postId corretamente", async () => {
  const calls = mockFetch([{ id: 1, postId: 1 }]);

  await getCommentsByPost(1);

  assert.equal(
    calls[0].url,
    "https://jsonplaceholder.typicode.com/comments?postId=1",
  );
});

test("postReport: envia método POST com o payload correto no corpo", async () => {
  const calls = mockFetch({ id: 101, report: [] }, { status: 201 });

  const payload = { report: [{ id: 1, nome: "Leanne Graham" }] };
  await postReport(payload);

  assert.equal(calls[0].url, "https://jsonplaceholder.typicode.com/posts");
  assert.equal(calls[0].options.method, "POST");
  assert.deepEqual(JSON.parse(calls[0].options.body), payload);
});

test("getUsers: lança erro quando a resposta HTTP não é 'ok' (ex: 404, 500)", async () => {
  mockFetch({}, { ok: false, status: 500 });

  await assert.rejects(async () => await getUsers(), /Erro HTTP 500/);
});

test("getPostsByUser: lança erro quando a API retorna 404", async () => {
  mockFetch({}, { ok: false, status: 404 });

  await assert.rejects(async () => await getPostsByUser(999), /Erro HTTP 404/);
});
