import {store} from "../store.js";

export function computeStatistics() {
  const container = document.getElementById("statistics-tab");
  container.innerHTML = ``;
  const statisticsInfo = store.cache.statisticsCache.data;

  statisticsInfo.forEach((ranking) => {
    let statisticsContainer = document.getElementById(`${ranking.bucket}-container`);

    // Creates accordion section of bucket
    if (statisticsContainer == null) {
      const statisticsButton = document.createElement("button");
      statisticsButton.classList.add("accordion", "active");
      statisticsButton.textContent = `${ranking.bucket}`;
      statisticsContainer = document.createElement("div");
      statisticsContainer.id = `${ranking.bucket}-container`;
      statisticsContainer.classList.add("statistics");
      statisticsContainer.style.display = "flex"
      container.appendChild(statisticsButton);
      container.appendChild(statisticsContainer);

      statisticsButton.addEventListener("click", async () => {
        statisticsButton.classList.toggle("active");
        if (statisticsContainer.style.maxHeight) {
          statisticsContainer.style.maxHeight = null;
        } else {
          statisticsContainer.style.maxHeight = statisticsContainer.scrollHeight + "px";
        }
      });
    }

    // Adding Statistics Card
    const ranks = document.createElement("div");
    ranks.className = "statistics__category";

    let html = `<h2>${ranking.title}</h2> ${ranking.size ? `<ol>` : `<ul>`}`;

    ranking.rows.slice(0, ranking.size ?? ranking.rows.length).forEach((entry) => {
        html += `<li>${entry.song.name} (${entry.value})</li>`;
    })
    html += `${ranking.size ? `</ol>` : `</ul>`}`;
    ranks.innerHTML = html; 

    statisticsContainer.appendChild(ranks);
  });

  document.querySelectorAll(".statistics").forEach(container => {
    container.style.maxHeight = container.scrollHeight + "px";
    console.log(container.style.maxHeight);
  });
}