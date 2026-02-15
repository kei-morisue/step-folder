import { CON } from "../../flatfolder/constraints.js";

import { SMPL } from "../sample.js";
import { PRJ } from "../project.js";
import { GUI_STATE } from "./state.js";
import { GUI_PAGE } from "./page.js";
import { GUI_IO } from "./io.js";

export const GUI = {

    startup: () => {
        CON.build();
        const defs = document.getElementById("defs");
        GUI.fetch(defs, './resources/defs.xml');

        GUI_IO.startup();
        GUI_STATE.startup();
        GUI_PAGE.startup();
        GUI_IO.import_cp("sample", SMPL.hf, true);
        GUI_IO.import_cp("sample", SMPL.nonlin);
        GUI_IO.import_cp("sample", SMPL.sq);
        GUI_IO.import_cp("sample", SMPL.hanikamu);

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

    fetch: (par, url) => {
        fetch(url)
            .then(response => response.text())
            .then(xml => {
                par.innerHTML = xml;
            });
    },

}