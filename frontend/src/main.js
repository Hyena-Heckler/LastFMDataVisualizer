import {setupButtons} from "./components/button.js";
import {setupLogin} from "./pages/login.js";
import {setupDateDropdown} from "./pages/dashboard.js";
import {addCard} from "./components/card-adder.js";
import {store} from "./store.js";

function init() {
    setupButtons();
    setupDateDropdown();
    setupLogin();
}

init();