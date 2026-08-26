import { setupLogin } from "./pages/login.js";
import { clearCache } from "./services/database.js";

function initialize() {
    clearCache();
    setupLogin();
}

initialize();