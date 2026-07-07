export function renderUserOptions(users) {
  const select = document.getElementById("userSelect");
  select.length = 1;

  users.forEach((user) => {
    const option = document.createElement("option");
    option.value = user.id;
    option.textContent = user.name;
    select.appendChild(option);
  });
}

export function renderError(message) {
  const results = document.getElementById("results");
  results.innerHTML = `<p style="color: red;">Erro: ${message}</p>`;
}

export function renderLoading(message = "Carregando...") {
  const results = document.getElementById("results");
  results.innerHTML = `<p>${message}</p>`;
}
export function renderMetrics(user, metrics, status) {
  const results = document.getElementById("results");
  results.innerHTML = `
    <p><strong>Usuário:</strong> ${user.name}</p>
    <p><strong>Quantidade de Posts:</strong> ${metrics.postCount}</p>
    <p><strong>Média de Caracteres:</strong> ${metrics.avgChars.toFixed(2)}</p>
    <p><strong>Média de Comentários por Post:</strong> ${metrics.avgComments.toFixed(2)}</p>
    <p><strong>Status:</strong> ${status}</p>
  `;
}
export function setControlsDisabled(disabled) {
  const ids = [
    "userSelect",
    "minChars",
    "minPosts",
    "generateReport",
    "sendReport",
    "sendToSheets",
  ];
  ids.forEach((id) => {
    const el = document.getElementById(id);
    if (el) el.disabled = disabled;
  });
}
