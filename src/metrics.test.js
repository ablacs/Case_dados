import test from "node:test";
import assert from "node:assert/strict";
import {
  calculatePostCount,
  calculateAverageChars,
  calculateAverageComments,
  calculateMetrics,
  filterPostsByMinChars,
  getUserStatus,
} from "./metrics.js";

//  Dados de exemplo usados em vários testes
const posts = [
  { id: 1, body: "abc" }, // 3 caracteres
  { id: 2, body: "abcdefghij" }, // 10 caracteres
  { id: 3, body: "abcde" }, // 5 caracteres
];

const commentsByPostId = {
  1: [{ id: 100 }, { id: 101 }], // 2 comentários
  2: [{ id: 102 }], // 1 comentário
  3: [{ id: 103 }, { id: 104 }, { id: 105 }], // 3 comentários
};

//  calculatePostCount
test("calculatePostCount: conta corretamente a quantidade de posts", () => {
  assert.equal(calculatePostCount(posts), 3);
});

test("calculatePostCount: retorna 0 para array vazio", () => {
  assert.equal(calculatePostCount([]), 0);
});

//  calculateAverageChars
test("calculateAverageChars: calcula a média corretamente", () => {
  // (3 + 10 + 5) / 3 = 6
  assert.equal(calculateAverageChars(posts), 6);
});

test("calculateAverageChars: retorna 0 para array vazio (evita NaN)", () => {
  assert.equal(calculateAverageChars([]), 0);
});

// calculateAverageComments
test("calculateAverageComments: calcula a média corretamente", () => {
  // (2 + 1 + 3) / 3 = 2
  assert.equal(calculateAverageComments(posts, commentsByPostId), 2);
});

test("calculateAverageComments: trata post sem comentários registrados como 0", () => {
  const commentsIncompletos = { 1: [{ id: 100 }] }; // posts 2 e 3 sem entrada
  assert.equal(calculateAverageComments(posts, commentsIncompletos), 1 / 3);
});

test("calculateAverageComments: retorna 0 para array de posts vazio", () => {
  assert.equal(calculateAverageComments([], commentsByPostId), 0);
});

//  calculateMetrics (agregador)
test("calculateMetrics: retorna os três valores agregados corretamente", () => {
  const result = calculateMetrics(posts, commentsByPostId);
  assert.deepEqual(result, {
    postCount: 3,
    avgChars: 6,
    avgComments: 2,
  });
});

//  filterPostsByMinChars
test("filterPostsByMinChars: filtra posts abaixo do mínimo de caracteres", () => {
  const filtrados = filterPostsByMinChars(posts, 5);
  // Só posts com >= 5 caracteres: id 2 (10 chars) e id 3 (5 chars)
  assert.equal(filtrados.length, 2);
  assert.deepEqual(
    filtrados.map((p) => p.id),
    [2, 3],
  );
});

test("filterPostsByMinChars: com minChars 0 ou vazio, retorna todos os posts", () => {
  assert.equal(filterPostsByMinChars(posts, 0).length, 3);
});

test("filterPostsByMinChars: com minChars muito alto, retorna array vazio", () => {
  assert.equal(filterPostsByMinChars(posts, 999).length, 0);
});

//  getUserStatus
test("getUserStatus: retorna Ativo quando postCount >= minPosts", () => {
  assert.equal(getUserStatus(10, 5), "Ativo");
});

test("getUserStatus: retorna Inativo quando postCount < minPosts", () => {
  assert.equal(getUserStatus(3, 5), "Inativo");
});

test("getUserStatus: sem minPosts definido (0), considera Ativo por padrão", () => {
  assert.equal(getUserStatus(0, 0), "Ativo");
});

test("getUserStatus: caso limite, postCount igual a minPosts é Ativo", () => {
  assert.equal(getUserStatus(5, 5), "Ativo");
});
