
import { SVG } from "../flatfolder/svg.js";


import { DIST } from "../distortionfolder/distortion.js";


import { Y } from "./y.js";
import { DRAW_LIN } from "./draw_lin.js";

import { DRAW } from "./draw.js";
import { DIFF } from "./diff.js";

import { SEG } from "./segment.js";

export const STEP = {
    flip0: false,
    redraw: () => {
        STEP.update_state(STEP.FOLD0, STEP.CELL0, "state0", "cp0", STEP.flip0);
        DRAW.draw_group_text(STEP.FOLD0, STEP.CELL0, document.getElementById("state0"), STEP.flip0);
        STEP.update_state(STEP.FOLD1, STEP.CELL1, "state1", "cp1", false);
        STEP.update_state(STEP.FOLD_D, STEP.CELL_D, "state3", "cp3", STEP.flip0);
        document.getElementById("state3").setAttribute("style", "background: " + DRAW.color.background);

        const select = document.getElementById("selectG");
        const assign = document.getElementById("assign");
        STEP.update_component(STEP.FOLD0, STEP.CELL0, select, assign);
    },

    new: () => {
        STEP.update_states();
        const select = document.getElementById("selectG");
        const assign = document.getElementById("assign");
        STEP.update_component(STEP.FOLD0, STEP.CELL0, select, assign);
        DIST.refresh();
        SEG.refresh();
        STEP.update_dist();
    },
    update_dist: () => {
        const { Vf, FV, EV, EF, FE, Ff, EA, V, VV } = STEP.FOLD
        const VD = DIST.FOLD_2_VD(V, Vf)
        STEP.FOLD_D = { V: VD, Vf, FV, EV, EF, FE, Ff, EA, VV }


        if (!STEP.LIN) {
            STEP.CELL_D = Y.FOLD_2_CELL(STEP.FOLD_D)
            const FO_D = DIST.infer_FO(STEP.FOLD, STEP.CELL_D)
            STEP.FOLD_D.FO = FO_D
        }
        else {
            STEP.CELL_D = undefined;
        }


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
        STEP.STATE0 = STEP.update_state(STEP.FOLD0, STEP.CELL0, "state0", "cp0", STEP.flip0);
        DRAW.draw_group_text(STEP.FOLD0, STEP.CELL0, document.getElementById("state0"), STEP.flip0);

        STEP.STATE1 = STEP.update_state(STEP.FOLD1, STEP.CELL1, "state1", "cp1", false);
        [STEP.FOLD, STEP.CELL, STEP.LIN] = DIFF.diff(STEP.FOLD0, STEP.FOLD1, STEP.STATE0.L);

    },

    update_state: (FOLD, CELL, svg_state, svg_cp, is_flip) => {
        if (!CELL) {
            DRAW_LIN.draw_state(SVG.clear(svg_state), FOLD, STEP.LIN);
            // DRAW.draw_cp(FOLD, SVG.clear(svg_cp));
            return undefined;
        } else {
            const STATE = Y.FOLD_CELL_2_STATE(FOLD, CELL, is_flip);
            DRAW.draw_state(SVG.clear(svg_state), FOLD, CELL, STATE);
            // DRAW.draw_cp(FOLD, SVG.clear(svg_cp));
            return STATE
        }
    },
};
