import {store} from "../store.js";

export function computeStatistics() {
  const container = document.getElementById("statistics-container");
  container.innerHTML = ``;
  const statisticsInfo = store.cache.statisticsCache.data;

  statisticsInfo.forEach((ranking) => {
    const ranks = document.createElement("div");
    ranks.className = "statistics__category";

    let html = `<h2>${ranking.title}</h2> <ol>`;
    ranking.values.slice(0, 10).forEach((entry) => {
        html += `<li>${entry.song.name} (${entry.value})</li>`;
    })
    html += `</ol>`;
    ranks.innerHTML = html; 

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