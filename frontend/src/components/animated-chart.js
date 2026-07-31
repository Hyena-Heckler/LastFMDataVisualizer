export function showPositionChartProgress(progress) {
  const container = document.getElementById("positions-time");


  const percentage = (progress * 100).toFixed(0)
  container.innerHTML = `
    <div class="animated-chart__loader">
    </div>
    <div class="animated-chart__bar">
        <div class="animated-chart__bar-progress"
            style="width: ${percentage}%"
        ></div>
    </div>
    <div class="animated-chart__status">
        <span>Rendering</span>
        <span>${percentage}%</span>
    </div>
  `
}

export function showPositionChartVideo(videoFile) {
  const container = document.getElementById("positions-time");

  container.innerHTML = `
    <video class="animated-chart__video" controls src="${videoFile}">
    </video>
  `
}