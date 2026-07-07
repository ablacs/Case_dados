import test from "node:test";
import assert from "node:assert/strict";
import { buildReportRow, toCSV } from "./report.js";

// --- buildReportRow ---
test("buildReportRow: monta a linha do relatório com os campos corretos", () => {
  const user = { id: 1, name: "Leanne Graham" };
  const metrics = { postCount: 10, avgChars: 162.9, avgComments: 5 };
  const status = "Ativo";

  const row = buildReportRow(user, metrics, status);

  assert.deepEqual(row, {
    id: 1,
    nome: "Leanne Graham",
    quantidadePosts: 10,
    mediaCaracteres: 162.9,
    mediaComentarios: 5,
    status: "Ativo",
  });
});

test("buildReportRow: arredonda corretamente médias com muitas casas decimais", () => {
  const user = { id: 4, name: "Patricia Lebsack" };
  const metrics = { postCount: 3, avgChars: 206.333333, avgComments: 5 };
  const status = "Inativo";

  const row = buildReportRow(user, metrics, status);

  assert.equal(row.mediaCaracteres, 206.33);
});

test("buildReportRow: preserva o status Inativo corretamente", () => {
  const user = { id: 8, name: "Nicholas Runolfsdottir V" };
  const metrics = { postCount: 0, avgChars: 0, avgComments: 0 };
  const status = "Inativo";

  const row = buildReportRow(user, metrics, status);

  assert.equal(row.status, "Inativo");
  assert.equal(row.quantidadePosts, 0);
});

// --- toCSV ---
test("toCSV: gera o cabeçalho correto", () => {
  const csv = toCSV([]);
  const [header] = csv.split("\n");
  assert.equal(
    header,
    "ID,Nome,Quantidade de Posts,Media de Caracteres,Media de Comentarios,Status",
  );
});

test("toCSV: gera uma linha por usuário, na ordem correta", () => {
  const rows = [
    {
      id: 1,
      nome: "Leanne Graham",
      quantidadePosts: 10,
      mediaCaracteres: 162.9,
      mediaComentarios: 5,
      status: "Ativo",
    },
    {
      id: 2,
      nome: "Ervin Howell",
      quantidadePosts: 2,
      mediaCaracteres: 219,
      mediaComentarios: 5,
      status: "Inativo",
    },
  ];

  const csv = toCSV(rows);
  const lines = csv.split("\n");

  assert.equal(lines.length, 3); // 1 cabeçalho + 2 linhas de dados
  assert.equal(lines[1], '1,"Leanne Graham",10,162.9,5,Ativo');
  assert.equal(lines[2], '2,"Ervin Howell",2,219,5,Inativo');
});

test("toCSV: escapa nomes que contêm vírgula ou aspas (evita quebrar o CSV)", () => {
  const rows = [
    {
      id: 5,
      nome: 'Chelsey "Chels" Dietrich, Jr.',
      quantidadePosts: 1,
      mediaCaracteres: 100,
      mediaComentarios: 5,
      status: "Ativo",
    },
  ];

  const csv = toCSV(rows);
  const [, dataLine] = csv.split("\n");

  // Aspas internas devem virar aspas duplas ("") e o campo continua entre aspas
  assert.equal(dataLine, '5,"Chelsey ""Chels"" Dietrich, Jr.",1,100,5,Ativo');
});

test("toCSV: com array vazio, gera só o cabeçalho", () => {
  const csv = toCSV([]);
  assert.equal(csv.split("\n").length, 1);
});
