import {store} from "../store.js";

export function setupLogin() {
  const loginForm = document.getElementById("panel__form")

  loginForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    const username = document.getElementById("username-login").value;

    store.user = username;

    console.log("Logged in:", store.user);
  });
}
