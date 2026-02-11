import { GUI } from "./defox/gui/gui.js";
import { GUI as G } from "./cyborg/gui.js";

import { GUI as GA } from "./axanael/gui.js";

window.onload = () => {
    GUI.startup();
    G.startup();
    GA.startup();
    document.getElementById("axanael_open").click();
};

