import {store} from "../store.js";

export function addCard(entry) {
  const container = document.getElementById("chart-container");

  const song = store.cache.weeklyCache.songs[entry.songId];
  const card = document.createElement("div");
  const image = song.image || "/null-image.png";

  card.className = "chart__song"
  card.innerHTML = `
    <div class="chart__position">
      <h5>${entry.streak} Streak</h5>
      <h2>${entry.position}</h2>
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
        : `<h5>★ NEW</h5>`
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

/*
<div class="chart__song">
          <div class="chart__position">
            <h5>Streak</h5>
            <h2>POS</h2>
            <h5>LW+Symbol</h5>
          </div>
          <div class="chart__icon">
            <img src="https://lastfm.freetls.fastly.net/i/u/900x900/88b646daa5e6626399ccd002ba67e50d.jpg"/>
          </div>
          <div class="chart__identifier">
            <h3>Title</h3>
            <div class="chart__identifier-extra">
              <h4>Album</h4>
              <h4>-</h4>
              <h4>Artists</h4>
            </div>
          </div>
          <div class="chart__main">
            <h5>Points</h5>
            <h5>Week</h5>
            <h5>Peak</h5>
          </div>
          <div class="chart__extra">
            <h5>Year-End</h5>
            <h5>YE Points</h5>
            <h5>First Appearance</h5>
          </div>
        </div>


songs": {
  "0": {
    "name": "Locals (Girls like us) [with gabby start]",
    "artists": [
      "underscores"
    ],
    "album": "Locals (Girls like us) [with gabby start]",
    "image": "https://lastfm.freetls.fastly.net/i/u/34s/a94dfffbec77b0b508338a85e59fc546.jpg",
    "color": [
      0.7333333333333333,
      0.7333333333333333,
      0.7333333333333333
    ]
  },
*/

/*
<div class="chart__song">
  <div class="chart__position">
    <h5>Streak</h5>
    <h2>POS</h2>
    <h5>LW+Symbol</h5>
  </div>
  <div class="chart__icon">
    <img src="https://lastfm.freetls.fastly.net/i/u/900x900/88b646daa5e6626399ccd002ba67e50d.jpg"/>
  </div>
  <div class="chart__identifier">
    <h3>Title</h3>
    <div class="chart__identifier-extra">
      <h4>Album</h4>
      <h4>-</h4>
      <h4>Artists</h4>
    </div>
  </div>
  <div class="chart__main">
    <h5>Points</h5>
    <h5>Week</h5>
    <h5>Peak</h5>
  </div>
  <div class="chart__extra">
    <h5>Year-End</h5>
    <h5>YE Points</h5>
    <h5>First Appearance</h5>
  </div>
</div>

*/
/*
  const json = JSON.stringify(data, null, 2);
  const blob = new Blob([json], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${filename}.json`;
  a.click();

  URL.revokeObjectURL(url);
}

document.getElementById("download").addEventListener("click", async () => {
  const res = await fetch("http://localhost:3000/api/tracks");
  const data = await res.json();
  downloadJSON(data, "Data");
})
*/
