export function setUpCardInfo() {
    // Get the modal
    const modal = document.getElementById("modal");
    const infoButton = document.getElementById("chart-help");
    const exitInfo = document.getElementById("modal-close");

    infoButton.addEventListener("click", () => {
        modal.style.display = "block";
    });

    exitInfo.addEventListener("click", () => {
        modal.style.display = "none";
    });

    window.addEventListener("click", (event) => {
        if (event.target == modal) {
            modal.style.display = "none";
        }
    });
}