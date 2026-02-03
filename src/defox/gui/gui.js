import { CON } from "../../flatfolder/constraints.js";

import { SMPL } from "../sample.js";
import { PRJ } from "../project.js";
import { GUI_STATE } from "./state.js";
import { GUI_PAGE } from "./page.js";
import { GUI_IO } from "./io.js";

export const GUI = {

    startup: () => {
        CON.build();
        GUI_IO.startup();
        GUI_STATE.startup();
        GUI_PAGE.startup();
        GUI_IO.import_new("sample", SMPL.sq);
        GUI_IO.import("sample", SMPL.hanikamu);
        PRJ.redraw_page();
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


}