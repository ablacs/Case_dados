import { getUsers } from "./api.js";
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

function debounce(fn, delay = 300) {
  let timeoutId;
  return (...args) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => fn(...args), delay);
  };
}

async function loadUsers() {
  renderLoading("Carregando usuários...");
  try {
    const users = await getUsers();
    state.users = users;
    renderUserOptions(users);
    document.getElementById("results").innerHTML = "";
  } catch (error) {
    renderError(
      "Não foi possível carregar os usuários. Tente recarregar a página.",
    );
  }
}

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
    renderError("Não foi possível carregar os dados desse usuário.");
  }
}

function handleFilterChange(event) {
  const { id, value } = event.target;
  const numericValue = value === "" ? 0 : Number(value);

  if (id === "minChars") state.filters.minChars = numericValue;
  else if (id === "minPosts") state.filters.minPosts = numericValue;

  recalculateAndRender();
}

const debouncedFilterChange = debounce(handleFilterChange, 300);

async function handleGenerateReport() {
  if (state.users.length === 0) return;

  renderLoading("Gerando relatório de todos os usuários...");

  try {
    const { minChars, minPosts } = state.filters;

    const rows = await Promise.all(
      state.users.map(async (user) => {
        const { posts, commentsByPostId } = await fetchUserData(user.id);
        const filteredPosts = filterPostsByMinChars(posts, minChars);
        const metrics = calculateMetrics(filteredPosts, commentsByPostId);
        const status = getUserStatus(metrics.postCount, minPosts);
        return buildReportRow(user, metrics, status);
      }),
    );

    const csv = toCSV(rows);
    downloadCSV("relatorio_usuarios.csv", csv);
    if (state.selectedUserId) {
      recalculateAndRender();
    } else {
      document.getElementById("results").innerHTML = "";
    }
    recalculateAndRender();
  } catch (error) {
    console.error("Error", error);
    renderError("Não foi possível gerar o relatório.");
  }
}

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
}

async function init() {
  bindEvents();
  await loadUsers();
}

init();
