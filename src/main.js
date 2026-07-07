import { getUsers, getPostsByUser, getCommentsByPost } from "./api.js";
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
  if (state.cache.postsByUser[userId]) {
    state.posts = state.cache.postsByUser[userId];
  } else {
    const posts = await getPostsByUser(userId);
    state.posts = posts;
    state.cache.postsByUser[userId] = posts;
  }

  const commentsPromises = state.posts.map((post) =>
    getCommentsByPost(post.id),
  );
  const commentsResults = await Promise.all(commentsPromises);

  state.commentsByPostId = {};
  state.posts.forEach((post, index) => {
    state.commentsByPostId[post.id] = commentsResults[index];
  });
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

  if (id === "minChars") {
    state.filters.minChars = numericValue;
  } else if (id === "minPosts") {
    state.filters.minPosts = numericValue;
  }

  recalculateAndRender();
}

const debouncedFilterChange = debounce(handleFilterChange, 300);

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
}

async function init() {
  bindEvents();
  await loadUsers();
}

init();
