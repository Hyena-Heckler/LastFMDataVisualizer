import {setupButtons} from "./components/button.js";
import { getCache } from "./services/database.js";
import {setupDateDropdown, addDateDropdown} from "./pages/dashboard.js";
import { setUpVideo } from "./components/video.js";
import { setUpTabs } from "./pages/tabs.js";
import { setUpCardInfo } from "./pages/card-info.js";
import { setUpFooter } from "./pages/footer.js";
import { store } from "./store.js";
import {computeStatistics} from "./components/statistics-adder.js";

async function main() {
    let cacheData = await getCache();
    if (cacheData == null) window.location.href = "/";
    store.user = cacheData.user;
    const pageType = document.body.dataset.pageType;
    switch (pageType) {
        case "albums":
            store.cache = cacheData.cache.albums;
            break;
        case "tracks":
            store.cache = cacheData.cache.tracks;
            break;
        case "artists":
            store.cache = cacheData.cache.artists;
            break;
    }
    setupButtons();
    setupDateDropdown();
    setUpTabs();
    setUpVideo();
    setUpCardInfo();
    setUpFooter();
    addDateDropdown();
    computeStatistics();
}

main();