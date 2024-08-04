import { M } from "../flatfolder/math.js";
import { NOTE } from "../flatfolder/note.js";
import { SVG } from "../flatfolder/svg.js";
import { IO } from "../flatfolder/io.js";
import { X } from "../flatfolder/conversion.js";
import { SOLVER } from "../flatfolder/solver.js";
import { CON } from "../flatfolder/constraints.js";

export const GUI = {
    startup: () => {

    },

    refresh: () => {
        const slider = document.getElementById("slider");
        slider.style.display = "none";
        slider.value = 0;
        document.getElementById("cycle").style.display = "none";
        document.getElementById("replace").style.display = "none";
        document.getElementById("fold_button").style.display = "none";
        document.getElementById("state_controls").style.display = "none";
        document.getElementById("state_config").style.display = "none";
    },

    flip: (FS, STATE) => {
        NOTE.start("Flipping model");
        MAIN.draw_state(SVG.clear("input"), FS, STATE);
        NOTE.end();
    },

    back: (FS) => {
        if (FS.length == 1) { return; }
        FS.pop();
        MAIN.update_fold(FS);
    }
}