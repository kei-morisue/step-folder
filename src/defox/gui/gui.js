import { CON } from "../../flatfolder/constraints.js";

import { SMPL } from "../sample.js";
import { PRJ } from "../project.js";
import { GUI_STATE } from "./state.js";
import { GUI_PAGE } from "./page.js";
import { GUI_IO } from "./io.js";
import { LOAD } from "./load.js";
import { IO3 } from "../io.js";
import { STEP } from "../step.js";
import { PAGE } from "../page.js";
export const GUI = {

    startup: async () => {
        const defs = document.getElementById("defs");
        await GUI.fetch(defs, './resources/defs.xml');
        CON.build();
        GUI_IO.startup();
        GUI_STATE.startup();
        await GUI_PAGE.startup();
        await GUI.build();
        PRJ.redraw_page();
    },

    build: async () => {
        try {
            const response = await fetch('./resources/NewProject.defox');
            const json = await response.json();
            PRJ.steps = await IO3.load(json);
            PRJ.restore(PRJ.steps.length - 1);
            STEP.redraw();
            PAGE.current_idx = 0;
            PRJ.redraw_page();
        }
        catch (error) {
            console.error("sample load error:", error)
        }
    },

    open_close: (id, display_style) => {
        var el = document.getElementById(id);
        document.getElementById(id + "_b").onclick = () => {
            if (el.style.display == display_style) {
                el.style.display = "none";
            }
            else {
                el.style.display = display_style;
            }
        }
    },

    fetch: async (par, url) => {
        try {
            const response = await fetch(url);
            const xml = await response.text();
            par.innerHTML = xml;
        }
        catch (error) {
            console.error("fetch error:", error)
        }
    },


}