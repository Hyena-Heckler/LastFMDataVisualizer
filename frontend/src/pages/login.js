import {store} from "../store.js";
import {updateUser, fetchCache} from "../services/api.js";

export function setupLogin() {
  const loginForm = document.getElementById("panel__form");
  const submitButton = loginForm.querySelector("button");
  const loginWaiting = document.getElementById("login-waiting-progress");
  submitButton.disabled = false;

  loginForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    
    try {
      submitButton.disabled = true;
      loginWaiting.hidden = false;
      const username = document.getElementById("username-login").value;
      if (username === "") {
        alert("No Username Inputted");
        return
      }
      

      store.user = username;
      const status = await updateUser((progress, status) => {
        showLoginProgress(progress, status);
      });
      if (status == "failed") {
        store.user = null;
        alert("Invalid Username");
        return
      }

      await fetchCache();

      document.getElementById("login-disclaimer").hidden = true;
    } catch (err) {
      console.error(err);
      alert("Failed to load user data");
    } finally {
      submitButton.disabled = false;
      loginWaiting.hidden = true;
      window.location.href = "/songs/";

    }
  });
}

function showLoginProgress(progress, status) {
  const percentage = (progress * 100).toFixed(0)
  document.getElementById("login-progress-bar")
    .style.width = `${percentage}%`;
  document.getElementById("login-status-percent")
    .textContent = `${percentage}%`;
  document.getElementById("login-status")
    .textContent = status;
}