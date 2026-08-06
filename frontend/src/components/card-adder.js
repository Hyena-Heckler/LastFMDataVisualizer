import {store} from "../store.js";

export function addCard(entry, currentWeek) {
  const container = document.getElementById("chart-container");

  const song = store.cache.weeklyCache.songs[entry.songId];
  const card = document.createElement("div");
  const image = song.image || "/null-image.png";

  card.className = "chart__song"
  card.innerHTML = `
    <div class="chart__position">
      <div class="chart__position-header">
        <h2>#${entry.position}</h2>
        ${entry.streak > 1 ? `<h5>x${entry.streak}</h5>` : ""}
      </div>
      
      ${entry.previousPosition != null 
        ? `
          <h5>LW: ${entry.previousPosition}</h5>
          <h5>(${
            entry.previousPosition > entry.position ? "⬆" : 
            entry.previousPosition < entry.position ? "⬇" : "↔"
          }${
            entry.previousPosition != entry.position 
              ? Math.abs(entry.position - entry.previousPosition) 
              : ""
          })</h5>` 
        : currentWeek == song.firstAppearance
          ? `<h5>★ NEW</h5>`
          : `<h5>★ RE</h5>`
      }
    </div>

    <div class="chart__icon">
      <img 
        src="${image}" 
        alt="${song.name}"
      />
    </div>
    <div class="chart__identifier">
      <h3>${song.name}</h3>
      <div class="chart__identifier-extra">
        <h4>${song.album}</h4>
        <h4>-</h4>
        <h4>${song.artists.join(", ")}</h4>
      </div>
    </div>
    <div class="chart__main">
      <h5>${entry.points.toFixed(2)} Pts</h5>
      <h5>${entry.weeks} WOC</h5>
      <h5>Peak: #${entry.peak}</h5>
    </div>
    <div class="chart__extra">
      <h5>Lifetime ${entry.lifetimePoints.toFixed(2)} Pts</h5>
      <h5>Appeared First: ${song.firstAppearance}</h5>
    </div>
  `
  const img = card.querySelector(".chart__icon img");

  img.onerror = function () {
    this.onerror = null;
    this.src = "/null-image.png";
  };

  container.appendChild(card);
}