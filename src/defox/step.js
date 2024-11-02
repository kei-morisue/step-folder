import { M } from "../flatfolder/math.js";
import { NOTE } from "../flatfolder/note.js";
import { SVG } from "../flatfolder/svg.js";
import { IO } from "../flatfolder/io.js";
import { X } from "../flatfolder/conversion.js";
import { SOLVER } from "../flatfolder/solver.js";
import { CON } from "../flatfolder/constraints.js";

import { DIST } from "../distortionfolder/distortion.js";


import { Y } from "./y.js";
import { GUI } from "./gui.js";
import { DRAW } from "./draw.js";
import { DIFF } from "./diff.js";
import { SMPL } from "./sample.js"

export const STEP = {
    flip0: false,
    update_dist: () => {
        const { Vf, FV, EV, EF, FE, Ff, EA, V } = STEP.FOLD
        const VD = DIST.FOLD_2_VD(V, Vf)
        STEP.FOLD_D = { V: VD, Vf, FV, EV, EF, FE, Ff, EA }
        STEP.CELL_D = Y.FOLD_2_CELL(STEP.FOLD_D)
        const FO_D = DIST.infer_FO(STEP.FOLD, STEP.CELL_D)
        STEP.FOLD_D.FO = FO_D
        STEP.update_state(STEP.FOLD_D, STEP.CELL_D, "state3", "cp3", STEP.flip0);
        document.getElementById("state3").setAttribute("style", "background: " + DRAW.color.background);
    },
    update_component: (FOLD, CELL, el_select, el_assign) => {
        const { GB, GA } = CELL
        SVG.clear(el_select.id)
        el_assign.max = GA[0].length
        el_assign.value = 1;
        GB.map((_, i) => {
            const el = document.createElement("option");
            el.setAttribute("value", `${i}`);
            el.textContent = `${i}`;
            el_select.appendChild(el);
        })
    },


    update_states: () => {
        STEP.update_state(STEP.FOLD0, STEP.CELL0, "state0", "cp0", STEP.flip0);
        DRAW.draw_group_text(STEP.FOLD0, STEP.CELL0, document.getElementById("state0"), STEP.flip0);

        STEP.update_state(STEP.FOLD1, STEP.CELL1, "state1", "cp1", false);
        [STEP.FOLD, STEP.CELL] = DIFF.diff(STEP.FOLD0, STEP.CELL0, STEP.FOLD1);
        STEP.update_state(STEP.FOLD_D, STEP.CELL_D, "state3", "cp3", STEP.flip0);

    },

    update_state: (FOLD, CELL, svg_state, svg_cp, is_flip) => {
        const STATE = Y.FOLD_CELL_2_STATE(FOLD, CELL, is_flip);
        DRAW.draw_state(SVG.clear(svg_state), FOLD, CELL, STATE);
        DRAW.draw_cp(FOLD, SVG.clear(svg_cp));
    },
};
