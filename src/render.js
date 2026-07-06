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
