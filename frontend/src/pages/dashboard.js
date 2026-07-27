import {store} from "../store.js";
import { addCard } from "../components/card-adder.js";

export function setupDateDropdown() {
    console.log("Set Up Dropdown Complete");
    const dateDropdown = document.getElementById("date");
    const container = document.getElementById("chart-container");
  
    dateDropdown.addEventListener("change", () => {
        container.innerHTML = "";
        store.cache.weeklyCache.weeks[dateDropdown.value]
            .filter(entry => entry !== null)
            .forEach((entry) => {
                addCard(entry);
        });
        console.log("Finished Week");
    });
}