import {setupButtons} from "./button.js";
import {setupLogin} from "./login.js";
import {addCard} from "./card-adder.js";
import {store} from "./store.js";

function init() {
    setupButtons();
    setupLogin();
}

init();