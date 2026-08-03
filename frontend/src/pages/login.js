import {store} from "../store.js";
import {updateUser, fetchCache} from "../services/api.js";
import {computeStatistics} from "../components/statistics-adder.js";
import data from "./Data.json";

export function setupLogin() {
  const loginForm = document.getElementById("panel__form")

  loginForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    
    const submitButton = loginForm.querySelector("button");
    const loginDisclaimer = document.getElementById("login-disclaimer");

    try {
      submitButton.disabled = true;
      loginDisclaimer.hidden = false;
      const username = document.getElementById("username-login").value;
      if (username === "") {
        alert("No Username Inputted");
        return
      }

      store.user = username;

      console.log("Logged in:", store.user);

      store.cache = data;
      // let status = await updateUser();
      // if (status == "failed") {
      //   store.user = null;
      //   alert("Invalid Username");
      //   return
      // }

      // await fetchCache();

      addDateDropdown();

      computeStatistics();
      document.getElementById("login-disclaimer").hidden = true;
      console.log("Found User");

    } catch (err) {
      console.error(err);
      alert("Failed to load user data");
    } finally {
      submitButton.disabled = false;
      loginDisclaimer.hidden = true;
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

  document.getElementById("previous").disabled = false;
  document.getElementById("next").disabled = false;
}
