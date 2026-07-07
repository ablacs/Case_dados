const BASE_URL = "https://jsonplaceholder.typicode.com";

async function request(path, options = {}) {
  try {
    const response = await fetch(`${BASE_URL}${path}`, options);
    if (!response.ok) {
      throw new Error(`Erro HTTP ${response.status} ao acessar ${path}`);
    }
    return await response.json();
  } catch (error) {
    console.error(`[api] Falha na requisição para ${path}:`, error);
    throw error;
    renderError("Não foi possível acessar a API. Tente novamente mais tarde.");
  }
}

export function getUsers() {
  return request("/users");
}

export function getPostsByUser(userId) {
  return request(`/posts?userId=${userId}`);
}

export function getCommentsByPost(postId) {
  return request(`/comments?postId=${postId}`);
}

export function postReport(payload) {
  return request("/reports", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
}
