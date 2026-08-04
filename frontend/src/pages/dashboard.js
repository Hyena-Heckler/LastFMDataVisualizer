import {store} from "../store.js";
import { addCard } from "../components/card-adder.js";

export function setupDateDropdown() {
    const dateDropdown = document.getElementById("date");
    const container = document.getElementById("chart-container");
  
    dateDropdown.addEventListener("change", () => {
        container.innerHTML = "";
        store.cache.weeklyCache.weeks[dateDropdown.value]
            .filter(entry => entry !== null)
            .forEach((entry) => {
                addCard(entry, dateDropdown.value);
        });
    });

    document.getElementById("previous").addEventListener("click", () => {
        dateDropdown.selectedIndex--; 
        dateDropdown.selectedIndex = Math.max(dateDropdown.selectedIndex, 0);
        container.innerHTML = "";
        store.cache.weeklyCache.weeks[dateDropdown.value]
            .filter(entry => entry !== null)
            .forEach((entry) => {
                addCard(entry, dateDropdown.value);
        });
    });

    document.getElementById("next").addEventListener("click", () => {
        dateDropdown.selectedIndex++; 
        dateDropdown.selectedIndex = Math.min(dateDropdown.selectedIndex, dateDropdown.options.length)
        container.innerHTML = "";
        store.cache.weeklyCache.weeks[dateDropdown.value]
            .filter(entry => entry !== null)
            .forEach((entry) => {
                addCard(entry, dateDropdown.value);
        });
    });
}