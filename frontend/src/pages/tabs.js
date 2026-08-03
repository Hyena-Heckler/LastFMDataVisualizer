export function setUpTabs() {
    const tabs = document.querySelectorAll(".panel_tab");

    tabs.forEach(tab => {
        tab.addEventListener("click", () => {
            document.querySelector(".panel_tab.active")?.classList.remove("active");
            tab.classList.add("active");

            document.querySelectorAll(".tab-content").forEach(content => {
                content.hidden = true;
            });

            document.getElementById(`${tab.dataset.tab}-tab`)
                .hidden = false;
        });
    });
}