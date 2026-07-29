import {store} from "../store.js";

export function computeStatistics() {
  const container = document.getElementById("statistics-container");

  const statisticsInfo = store.cache.statisticsCache.data;

  Object.entries(statisticsInfo).forEach(([ranking, values]) => {
    const ranks = document.createElement("div");
    ranks.className = "statistics__category";

    ranks.innerHTML = `<h2>${ranking}</h2> <ol>`;
    values.forEach((entry) => {
        ranks.innerHTML += `<li>${entry.song.name} (${entry.value})</li>`;
    })

    ranks.innerHTML += `</ol>`;

    container.appendChild(ranks);
  })
}

/*
<div class="statistics" id="statistics-container">
      <div class="statistics__category">
        <h2>Ranking</h2>
        <ol>
          <li>First item and maybe something else (put something here)</li>
          <li>Second item</li>
          <li>Third item</li>
        </ol>
      </div>
      <div class="statistics__category">
        <h2>Ranking</h2>
        <ol>
          <li>First item</li>
          <li>Second item</li>
          <li>Third item</li>
        </ol>
      </div>
    </div>
*/