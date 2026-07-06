import { getUsers } from "./api.js";
import { state } from "./state.js";
import { renderUserOptions, renderError, renderLoading } from "./render.js";

async function init() {
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

init();
