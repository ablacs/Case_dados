import { getUsers, postReport } from "./api.js";
import { fetchUserData } from "./userData.js";
import { sendToGoogleSheets } from "./googleSheets.js";
import { state } from "./state.js";
import {
  renderUserOptions,
  clearResults,
  renderError,
  renderLoading,
  renderMetrics,
  renderSuccess,
  setControlsDisabled,
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

// --- Etapa 1: Carregamento inicial ---
async function loadUsers() {
  renderLoading("Carregando usuários...");
  setControlsDisabled(true);
  try {
    const users = await getUsers();
    state.users = users;
    renderUserOptions(users);
    clearResults();
  } catch (error) {
    console.error("Erro ao carregar usuários:", error);
    renderError(
      "Não foi possível carregar os usuários. Tente recarregar a página.",
    );
  } finally {
    setControlsDisabled(false);
  }
}

// --- Etapa 2: Seleção de usuário ---
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
    clearResults();
    return;
  }

  state.selectedUserId = userId;
  renderLoading("Carregando posts e comentários...");
  setControlsDisabled(true);

  try {
    await loadUserPostsAndComments(userId);
    recalculateAndRender();
  } catch (error) {
    console.error("Erro ao carregar dados do usuário:", error);
    renderError("Não foi possível carregar os dados desse usuário.");
  } finally {
    setControlsDisabled(false);
  }
}

// --- Etapa 3: Alteração de campos (filtros reativos com debounce) ---
function handleFilterChange(event) {
  const { id, value } = event.target;
  let numericValue = value === "" ? 0 : Number(value);

  // Validação: nunca aceitar valores negativos ou não numéricos
  if (Number.isNaN(numericValue) || numericValue < 0) {
    numericValue = 0;
    event.target.value = 0;
  }

  if (id === "minChars") state.filters.minChars = numericValue;
  else if (id === "minPosts") state.filters.minPosts = numericValue;

  recalculateAndRender();
}

const debouncedFilterChange = debounce(handleFilterChange, 300);

// --- Auxiliar compartilhado: monta as linhas do relatório de todos os usuários ---
// Usado pela etapa 4 (exportar CSV), etapa 5 (POST simulado) e pelo diferencial
// do Google Sheets, garantindo que os três caminhos usem exatamente o mesmo cálculo.
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

// --- Etapa 4: Geração de relatório (CSV de todos os usuários) ---
async function handleGenerateReport() {
  if (state.users.length === 0) return;

  renderLoading("Gerando relatório de todos os usuários...");
  setControlsDisabled(true);

  try {
    const rows = await buildAllUsersReportRows();
    const csv = toCSV(rows);
    downloadCSV("relatorio_usuarios.csv", csv);

    renderSuccess(
      `Relatório CSV gerado com sucesso! ${rows.length} usuários exportados.`,
    );
  } catch (error) {
    console.error("Erro ao gerar relatório:", error);
    renderError("Não foi possível gerar o relatório.");
  } finally {
    setControlsDisabled(false);
  }
}

// --- Etapa 5: Simulação de envio (POST /posts, adaptado de /reports) ---
async function handleSendReport() {
  if (state.users.length === 0) return;

  renderLoading("Enviando relatório...");
  setControlsDisabled(true);

  try {
    const rows = await buildAllUsersReportRows();
    const response = await postReport({ report: rows });

    renderSuccess(`Relatório enviado com sucesso! ID simulado: ${response.id}`);
  } catch (error) {
    console.error("Erro ao enviar relatório:", error);
    renderError("Não foi possível enviar o relatório.");
  } finally {
    setControlsDisabled(false);
  }
}

// --- Diferencial: Integração com Google Sheets ---
async function handleSendToSheets() {
  if (state.users.length === 0) return;

  const webAppUrl = document.getElementById("sheetsUrl").value.trim();

  if (!webAppUrl) {
    renderError("Cole a URL do Google Apps Script antes de enviar.");
    return;
  }

  renderLoading("Enviando relatório para o Google Sheets...");
  setControlsDisabled(true);

  try {
    const rows = await buildAllUsersReportRows();
    const result = await sendToGoogleSheets(rows, webAppUrl);

    renderSuccess(
      `Enviado com sucesso! ${result.rowsAdded} linhas adicionadas na planilha.`,
    );
  } catch (error) {
    console.error("Erro ao enviar para o Google Sheets:", error);
    renderError(
      "Não foi possível enviar para o Google Sheets. Verifique a URL e tente novamente.",
    );
  } finally {
    setControlsDisabled(false);
  }
}

// --- Orquestração de eventos ---
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
  document
    .getElementById("sendToSheets")
    .addEventListener("click", handleSendToSheets);
}

async function init() {
  bindEvents();
  await loadUsers();
}

init();
