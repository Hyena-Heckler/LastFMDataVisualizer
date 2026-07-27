import {store} from "../store.js";
import { addCard } from "../components/card-adder.js";

export function setupDateDropdown() {
    const dateDropdown = document.getElementById("date");
    const container = document.getElementById("chart");
  
    dateDropdown.addEventListener("change", () => {
        container.innerHTML = "";
        store.cache.weeklyCache.weeks[dateDropdown.value]
            .filter(entry => entry !== null)
            .forEach((entry) => {
                addCard(entry);
        });
    });
}