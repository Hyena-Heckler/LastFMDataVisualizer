import {store} from "../store.js";
import { addCard } from "../components/card-adder.js";

export function setupDateDropdown() {
    const dateDropdown = document.getElementById("date");
    const container = document.getElementById("chart-container");
    const previousButton = document.getElementById("previous");
    const nextButton = document.getElementById("next");
  
    dateDropdown.addEventListener("change", () => {
        container.innerHTML = "";
        store.cache.weeklyCache.weeks[dateDropdown.value]
            .filter(entry => entry !== null)
            .forEach((entry) => {
                addCard(entry, dateDropdown.value);
        });
        if(dateDropdown.selectedIndex === 0) previousButton.disabled = true;
        else previousButton.disabled = false;
        if(dateDropdown.selectedIndex === dateDropdown.options.length - 1) nextButton.disabled = true;
        else nextButton.disabled = false;
    });

    previousButton.addEventListener("click", () => {
        if(dateDropdown.selectedIndex === 0) return;
        dateDropdown.selectedIndex--; 
        dateDropdown.dispatchEvent(new Event("change"));
    });

    nextButton.addEventListener("click", () => {
        if(dateDropdown.selectedIndex === dateDropdown.options.length - 1) return;
        dateDropdown.selectedIndex++;
        dateDropdown.dispatchEvent(new Event("change"));
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