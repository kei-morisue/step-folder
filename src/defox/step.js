import { SVG } from "../flatfolder/svg.js";
import { DIST } from "../distortionfolder/distortion.js";
import { Y } from "./y.js";
import { N } from "./nath.js";


import { M } from "../flatfolder/math.js";

import { DRAW_LIN } from "./draw_lin.js";
import { DRAW } from "./draw.js";
import { DIFF } from "./diff.js";
import { SEG } from "./segment.js";

export const STEP = {
    id: 0,
    flip0: false,
    rotate: 0.5,
    cx: .5,
    cy: .5,
    scale: 1,

    get_transform: () => {
        const scale = STEP.get_zoom();
        const theta = (2 * STEP.rotate - 1) * Math.PI;
        const A = N.mat(STEP.flip0, scale, theta);
        const b = M.sub([.5, .5], N.apply(A, [STEP.cx, STEP.cy]));
        return [A, b];
    },

    get_zoom: () => {
        return Math.pow(2, (STEP.scale - 1) / 2);
    },
    refresh: () => {
        STEP.flip0 = false;
        STEP.rotate = 0.5;
        STEP.cx = .5;
        STEP.cy = .5;
        STEP.scale = 1;
    },
    redraw: () => {
        const T = STEP.get_transform();
        STEP.update_state(STEP.FOLD0, STEP.CELL0, "state0", T);
        DRAW.draw_group_text(STEP.FOLD0, STEP.CELL0, document.getElementById("state0"), T);
        // STEP.update_state(STEP.FOLD1, STEP.CELL1, "state1", T);
        DRAW.draw_cp(STEP.FOLD, SVG.clear("cp3"), false)

        STEP.update_state(STEP.FOLD_D, STEP.CELL_D, "state3", T);
        document.getElementById("state3").setAttribute("style", "background: " + DRAW.color.background);

        const select = document.getElementById("selectG");
        const assign = document.getElementById("assign");
        STEP.update_component(STEP.FOLD0, STEP.CELL0, select, assign);
    },

    new: () => {
        STEP.refresh();
        STEP.update_states();
        const select = document.getElementById("selectG");
        const assign = document.getElementById("assign");
        STEP.update_component(STEP.FOLD0, STEP.CELL0, select, assign);
        DIST.refresh();
        SEG.refresh();
        STEP.update_dist();
    },

    update_lin: () => {
        STEP.LIN = undefined;

        [STEP.FOLD, STEP.CELL,] = DIFF.diff(STEP.FOLD0, STEP.FOLD1, undefined);
        const state = STEP.update_dist();
        if (state.L) {
            STEP.LIN = state.L
            STEP.CELL_D = undefined;
            STEP.update_state(STEP.FOLD_D, STEP.CELL_D, "state3", STEP.get_transform());
        }
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


        document.getElementById("state3").setAttribute("style", "background: " + DRAW.color.background);
        // DRAW.draw_cp(STEP.FOLD, document.getElementById("cp3"), false);
        return STEP.update_state(STEP.FOLD_D, STEP.CELL_D, "state3", STEP.get_transform());

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
        const T = STEP.get_transform();
        STEP.STATE0 = STEP.update_state(STEP.FOLD0, STEP.CELL0, "state0", T);
        DRAW.draw_group_text(STEP.FOLD0, STEP.CELL0, document.getElementById("state0"), T);
        if (STEP.FOLD1) {
            // STEP.update_state(STEP.FOLD1, STEP.CELL1, "state1", T);
            [STEP.FOLD, STEP.CELL, STEP.LIN] = DIFF.diff(STEP.FOLD0, STEP.FOLD1, STEP.STATE0.L);
        } else {
            [STEP.FOLD, STEP.CELL, STEP.LIN] = [STEP.FOLD0, STEP.CELL0, STEP.STATE0.L];
        }

        DRAW.draw_cp(STEP.FOLD, SVG.clear("cp3"), false)

    },

    update_state: (FOLD, CELL, svg_state, T) => {
        if (!FOLD) {
            return;
        }
        if (!CELL) {
            DRAW_LIN.draw_state(SVG.clear(svg_state), FOLD, STEP.LIN, T, STEP.id);
            return undefined;
        } else {
            const STATE = Y.FOLD_CELL_2_STATE(FOLD, CELL);
            DRAW.draw_state(SVG.clear(svg_state), FOLD, CELL, STATE, T, STEP.id);
            return STATE
        }
    },
};
