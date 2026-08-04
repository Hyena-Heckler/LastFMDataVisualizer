export function setUpFooter() {
    const footerTitle = document.getElementById("footer-title");
    const footer = document.getElementById("footer");

    footerTitle.addEventListener("click", () => {
        window.scrollTo({
            top: document.documentElement.scrollHeight,
            behavior: "smooth"
        });
    });

    function updateAboutSticky() {
        const peekHeight = 28;
        const height = footer.getBoundingClientRect().height;

        footer.style.bottom = `-${height - peekHeight}px`;
    }

    const observer = new ResizeObserver(updateAboutSticky);
    observer.observe(footer);

    updateAboutSticky();
}