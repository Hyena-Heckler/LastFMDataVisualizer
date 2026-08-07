export function setUpTabs() {
    const tabs = document.querySelectorAll(".panel__tab");

    tabs.forEach(tab => {
        tab.addEventListener("click", () => {
            document.querySelector(".panel__tab.active")?.classList.remove("active");
            tab.classList.add("active");

            const selectedTab = document.getElementById(`${tab.dataset.tab}-tab`);

            document.querySelectorAll(".tab-content").forEach(content => {
                if (content !== selectedTab) {
                    content.classList.remove("active");
                    content.hidden = true;
                }
            });

            if (selectedTab) {
                selectedTab.hidden = false;
                requestAnimationFrame(() => {
                    selectedTab.classList.add("active");
                });
            }
            
        });

        
    });
}