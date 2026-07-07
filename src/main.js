import { getUsers, getPostsByUser, getCommentsByPost } from "./api.js";
import { state } from "./state.js";
import {
  renderUserOptions,
  renderError,
  renderLoading,
  renderMetrics,
} from "./render.js";
import { calculateMetrics } from "./metrics.js";

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

async function handleUserSelect(event) {
  const userId = event.target.value;

  if (!userId) {
    document.getElementById("results").innerHTML = "";
    return;
  }

  state.selectedUserId = userId;
  renderLoading("Carregando posts e comentários...");

  try {
    await loadUserPostsAndComments(userId);

    const metrics = calculateMetrics(state.posts, state.commentsByPostId);
    const user = state.users.find((u) => String(u.id) === String(userId));
    renderMetrics(user, metrics);
  } catch (error) {
    renderError("Não foi possível carregar os dados desse usuário.");
  }
}

function bindEvents() {
  document
    .getElementById("userSelect")
    .addEventListener("change", handleUserSelect);
}

async function init() {
  bindEvents();
  await loadUsers();
}

init();
