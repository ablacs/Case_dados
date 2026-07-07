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
  // Nota: a JSONPlaceholder não possui um recurso /reports real (retorna 404 — API
  // só simula CRUD para seus 6 recursos fixos: /posts, /comments, /albums, /photos,
  // /todos, /users). Usamos POST /posts como endpoint de simulação de envio,
  // mantendo o payload do relatório no corpo da requisição.
  return request("/posts", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
}
