import {store} from "../store.js";
import {updateUser, fetchCache} from "../services/api.js";
import {computeStatistics} from "../components/statistics-adder.js";

export function setupLogin() {
  const loginForm = document.getElementById("panel__form");
  const submitButton = loginForm.querySelector("button");
  const loginWaiting = document.getElementById("login-waiting-progress");
  submitButton.disabled = false;

  loginForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    
    const delay = ms => new Promise(resolve => setTimeout(resolve, ms));


    try {
      submitButton.disabled = true;
      loginWaiting.hidden = false;
      const username = document.getElementById("username-login").value;
      if (username === "") {
        alert("No Username Inputted");
        return
      }
      

      store.user = username;
      const status = await updateUser((progress) => {
        showLoginProgress(progress);
      });
      if (status == "failed") {
        store.user = null;
        alert("Invalid Username");
        return
      }

      await fetchCache();

      addDateDropdown();

      computeStatistics();
      document.getElementById("login-disclaimer").hidden = true;
    } catch (err) {
      console.error(err);
      alert("Failed to load user data");
    } finally {
      submitButton.disabled = false;
      loginWaiting.hidden = true;
      document.getElementById("render-video").disabled = false;
      document.getElementById("render-video").hidden = false;
      document.getElementById("animated-video").hidden = true;
    }
  });
}

export function addDateDropdown() {
  const dateDropdown = document.getElementById("date");
  dateDropdown.innerHTML = "";
  if (!store.cache.weeklyCache?.weeks) {
    console.error("Missing Cache");
    return;
  }
  Object.keys(store.cache.weeklyCache.weeks).forEach(week => {
    const option = document.createElement("option");
    option.value = week;
    option.textContent = week;
    dateDropdown.appendChild(option);
  });
  dateDropdown.dispatchEvent(new Event("change"));

  dateDropdown.disabled = false;
}

function showLoginProgress(progress) {
    const percentage = (progress * 100).toFixed(0)
    document.getElementById("login-progress-bar")
        .style.width = `${percentage}%`
    document.getElementById("login-status-percent")
        .textContent = `${percentage}%`
}