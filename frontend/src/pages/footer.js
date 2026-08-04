export function setUpFooter() {
    const footerTitle = document.getElementById("footer-title");
    const footerDescription = document.getElementById("footer-description");

    footerTitle.addEventListener("click", () => {
        window.scrollTo({
            top: document.documentElement.scrollHeight,
            behavior: "smooth"
        });
    });
}