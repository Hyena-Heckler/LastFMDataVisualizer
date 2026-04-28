
export function addCard(song) {
  const container = document.getElementById("song-card-profile");

  const card = document.createElement("div");
  card.className = "card"
  
  card.innerHTML = `
    <h3>${song.name}</h3>
  `

}

/*
<div class="card-example">
  <div class="right-side">
    <h5>Streak</h5>
    <h2>POS</h2>
    <h5>LW+Symbol</h5>
  </div>
  <div class="image">
    <img src="https://lastfm.freetls.fastly.net/i/u/300x300/88b646daa5e6626399ccd002ba67e50d.jpg"/>
  </div>
  <div class="main-identifier">
    <h3>Title</h3>
    <h3>Artists</h3>
  </div>
  <div class="top-row">
    <h5>Album</h5>
    <h5>Points</h5>
    <h5>Week</h5>
    <h5>Peak</h5>
  </div>
  <div class="bottom-row">
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
