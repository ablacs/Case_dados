import { getUsers, postReport } from "./api.js";
import { fetchUserData } from "./userData.js";
import { state } from "./state.js";
import {
  renderUserOptions,
  renderError,
  renderLoading,
  renderMetrics,
} from "./render.js";
import {
  calculateMetrics,
  filterPostsByMinChars,
  getUserStatus,
} from "./metrics.js";
import { buildReportRow, toCSV, downloadCSV } from "./report.js";

// --- Utilitário: debounce genérico ---
function debounce(fn, delay = 300) {
  let timeoutId;
  return (...args) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => fn(...args), delay);
  };
}

//  Task 1: Carregamento Inicial
async function loadUsers() {
  renderLoading("Carregando usuários...");
  try {
    const users = await getUsers();
    state.users = users;
    renderUserOptions(users);
    document.getElementById("results").innerHTML = "";
  } catch (error) {
    console.error("Erro ao carregar usuários:", error);
    renderError(
      "Não foi possível carregar os usuários. Tente recarregar a página.",
    );
  }
}

//  Task 2: Seleção de Usuário
async function loadUserPostsAndComments(userId) {
  const { posts, commentsByPostId } = await fetchUserData(userId);
  state.posts = posts;
  state.commentsByPostId = commentsByPostId;
}

function recalculateAndRender() {
  if (!state.selectedUserId || state.posts.length === 0) return;

  const { minChars, minPosts } = state.filters;
  const filteredPosts = filterPostsByMinChars(state.posts, minChars);
  const metrics = calculateMetrics(filteredPosts, state.commentsByPostId);
  const status = getUserStatus(metrics.postCount, minPosts);

  const user = state.users.find(
    (u) => String(u.id) === String(state.selectedUserId),
  );
  renderMetrics(user, metrics, status);
}

async function handleUserSelect(event) {
  const userId = event.target.value;

  if (!userId) {
    state.selectedUserId = null;
    document.getElementById("results").innerHTML = "";
    return;
  }

  state.selectedUserId = userId;
  renderLoading("Carregando posts e comentários...");

  try {
    await loadUserPostsAndComments(userId);
    recalculateAndRender();
  } catch (error) {
    console.error("Erro ao carregar dados do usuário:", error);
    renderError("Não foi possível carregar os dados desse usuário.");
  }
}

//  Task 3: Alteração de Campos (filtros reativos com debounce)
function handleFilterChange(event) {
  const { id, value } = event.target;
  const numericValue = value === "" ? 0 : Number(value);

  if (id === "minChars") state.filters.minChars = numericValue;
  else if (id === "minPosts") state.filters.minPosts = numericValue;

  recalculateAndRender();
}

const debouncedFilterChange = debounce(handleFilterChange, 300);

// Helper compartilhado: monta as linhas do relatório de TODOS os usuários
// Usado tanto pela Task 4 (exportar CSV) quanto pela Task 5 (enviar via POST),
// garantindo que os dois caminhos usem exatamente o mesmo cálculo.
async function buildAllUsersReportRows() {
  const { minChars, minPosts } = state.filters;

  return Promise.all(
    state.users.map(async (user) => {
      const { posts, commentsByPostId } = await fetchUserData(user.id);
      const filteredPosts = filterPostsByMinChars(posts, minChars);
      const metrics = calculateMetrics(filteredPosts, commentsByPostId);
      const status = getUserStatus(metrics.postCount, minPosts);
      return buildReportRow(user, metrics, status);
    }),
  );
}

// Task 4: Geração de Relatório (CSV de todos os usuários)
async function handleGenerateReport() {
  if (state.users.length === 0) return;

  renderLoading("Gerando relatório de todos os usuários...");

  try {
    const rows = await buildAllUsersReportRows();
    const csv = toCSV(rows);
    downloadCSV("relatorio_usuarios.csv", csv);

    if (state.selectedUserId) {
      recalculateAndRender();
    } else {
      document.getElementById("results").innerHTML = "";
    }
  } catch (error) {
    console.error("Erro ao gerar relatório:", error);
    renderError("Não foi possível gerar o relatório.");
  }
}

//  Task 5: Simulação de Envio (POST /reports)
async function handleSendReport() {
  if (state.users.length === 0) return;

  renderLoading("Enviando relatório...");

  try {
    const rows = await buildAllUsersReportRows();
    const response = await postReport({ report: rows });

    console.log("Resposta do envio simulado:", response);

    const results = document.getElementById("results");
    results.innerHTML = `<p style="color: green;">Relatório enviado com sucesso! (ID simulado: ${response.id})</p>`;
  } catch (error) {
    console.error("Erro ao enviar relatório:", error);
    renderError("Não foi possível enviar o relatório.");
  }
}

// Orquestração de eventos
function bindEvents() {
  document
    .getElementById("userSelect")
    .addEventListener("change", handleUserSelect);
  document
    .getElementById("minChars")
    .addEventListener("input", debouncedFilterChange);
  document
    .getElementById("minPosts")
    .addEventListener("input", debouncedFilterChange);
  document
    .getElementById("generateReport")
    .addEventListener("click", handleGenerateReport);
  document
    .getElementById("sendReport")
    .addEventListener("click", handleSendReport);
}

async function init() {
  bindEvents();
  await loadUsers();
}

init();
