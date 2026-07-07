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

export function clearResults() {
  const results = document.getElementById("results");
  results.className = "results-empty";
  results.replaceChildren();
}

function renderMessage(message, type) {
  const results = document.getElementById("results");
  const paragraph = document.createElement("p");

  results.className = "";
  paragraph.className = `message message-${type}`;
  paragraph.textContent = message;
  results.replaceChildren(paragraph);
}

export function renderError(message) {
  renderMessage(`Erro: ${message}`, "error");
}

export function renderLoading(message = "Carregando...") {
  renderMessage(message, "loading");
}

export function renderSuccess(message) {
  renderMessage(message, "success");
}

export function renderMetrics(user, metrics, status) {
  const results = document.getElementById("results");
  const isActive = status === "Ativo";
  const metricsList = [
    ["Quantidade de Posts", metrics.postCount],
    ["Média de Caracteres", metrics.avgChars.toFixed(2)],
    ["Média de Comentários", metrics.avgComments.toFixed(2)],
  ];

  const card = document.createElement("article");
  const header = document.createElement("div");
  const name = document.createElement("p");
  const badge = document.createElement("span");
  const grid = document.createElement("div");

  results.className = "";
  card.className = "metric-card";
  header.className = "metric-user";
  name.className = "metric-user-name";
  badge.className = `status-badge ${isActive ? "status-active" : "status-inactive"}`;
  grid.className = "metrics-grid";

  name.textContent = user.name;
  badge.textContent = status;

  metricsList.forEach(([label, value]) => {
    const item = document.createElement("div");
    const labelElement = document.createElement("p");
    const valueElement = document.createElement("p");

    item.className = "metric-item";
    labelElement.className = "metric-label";
    valueElement.className = "metric-value";

    labelElement.textContent = label;
    valueElement.textContent = value;

    item.append(labelElement, valueElement);
    grid.appendChild(item);
  });

  header.append(name, badge);
  card.append(header, grid);
  results.replaceChildren(card);
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
