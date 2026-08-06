import {setupButtons} from "./components/button.js";
import {setupLogin} from "./pages/login.js";
import {setupDateDropdown} from "./pages/dashboard.js";
import {addCard} from "./components/card-adder.js";
import {store} from "./store.js";
import { setUpVideo } from "./components/video.js";
import { setUpTabs } from "./pages/tabs.js";
import { setUpCardInfo } from "./pages/card-info.js";
import { setUpFooter } from "./pages/footer.js";


function init() {
    setupButtons();
    setupDateDropdown();
    setupLogin();
    setUpTabs();
    setUpVideo();
    setUpCardInfo();
    setUpFooter();
}

init();