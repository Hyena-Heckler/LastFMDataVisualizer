import {store} from "../store.js";
import {updateUser, fetchCache} from "../services/api.js";
import {computeStatistics} from "../components/statistics-adder.js";

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

      let status = await updateUser();
      if (status == "failed") {
        store.user = null;
        alert("Invalid Username");
        return
      }

      await fetchCache();

      setupDateDropdown();

      computeStatistics();

      console.log("Found User");

    } catch (err) {
      console.error(err);
      alert("Failed to load user data");
    } finally {
      submitButton.disabled = false;
    }
  });
}

export function setupDateDropdown() {
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
}
