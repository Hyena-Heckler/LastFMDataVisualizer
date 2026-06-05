import {store} from "../store.js";
import {updateUser, fetchCache} from "../services/api.js";

export function setupLogin() {
  const loginForm = document.getElementById("panel__form")

  loginForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    
    const submitButton = loginForm.querySelector("button");

    try {
      submitButton.disabled = true;
      const username = document.getElementById("username-login").value;

      store.user = username;

      console.log("Logged in:", store.user);

      await updateUser();

      await fetchCache();

      console.log("Cache ready");

    } catch (err) {
      console.error(err);
      alert("Failed to load user data");
    } finally {
      submitButton.disabled = false;
    }
  });
}
