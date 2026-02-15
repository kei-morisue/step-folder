import { SVG } from "../flatfolder/svg.js";
import { DIST } from "../distortionfolder/distortion.js";
import { Y } from "./y.js";
import { N } from "./nath.js";


import { M } from "../flatfolder/math.js";

import { DRAW_LIN } from "./draw_lin.js";
import { DRAW } from "./draw.js";
import { DIFF } from "./diff.js";
import { SEG } from "./segment.js";
import { NOTE } from "../flatfolder/note.js";

export const STEP = {
    id: 0,
    flip0: false,
    rotate: 0.5,
    cx: .5,
    cy: .5,
    scale: 1,
    depth: 0,

    get_transform: () => {
        return STEP.get_T(STEP.flip0, STEP.rotate, STEP.scale, STEP.cx, STEP.cy);
    },

    get_T: (flip0, rotate, scale, cx, cy) => {
        const s = STEP.get_zoom(scale);
        const theta = (2 * rotate - 1) * Math.PI;
        const A = N.mat(flip0, s, theta);
        const b = M.sub([.5, .5], N.apply(A, [cx, cy]));
        return [A, b];
    },

    get_zoom: (scale) => {
        return Math.pow(2, (scale - 1) / 2);
    },
    refresh: () => {
        STEP.flip0 = false;
        STEP.rotate = 0.5;
        STEP.cx = .5;
        STEP.cy = .5;
        STEP.scale = 1;
        SEG.clip = .0;
        STEP.depth = 0;
        document.getElementById("clip").value = SEG.clip;
        document.getElementById("rotate").value = STEP.rotate;
        document.getElementById("depth").value = STEP.depth;
    },
    redraw: () => {
        const T = STEP.get_transform();
        DRAW.draw_state(SVG.clear("state0"), STEP.FOLD0, STEP.CELL0, STEP.STATE0, T, SEG.clip, STEP.id, []);
        DRAW.draw_group_text(STEP.FOLD0, STEP.CELL0, document.getElementById("state0"), T);
        DRAW.draw_cp(STEP.FOLD, SVG.clear("cp3"))
        if (STEP.CELL_D) {
            const FOLD = STEP.FOLD_D;
            const CELL = STEP.CELL_D;
            STEP.update_state(FOLD, CELL, "state3", T);
            document.getElementById("apply_tt").style.background = "";
        } else {
            STEP.update_serial_state(STEP.FOLD_D, STEP.LIN.S, "state3", T);
            if (STEP.LIN.cycle.length != 0) {
                NOTE.annotate(STEP.LIN.S, "serials");
                NOTE.annotate(STEP.LIN.cycle, "cycles");
                document.getElementById("apply_tt").style.background = "red";
            } else {
                document.getElementById("apply_tt").style.background = "";
                document.getElementById("depth").max = STEP.LIN.S.length;
            }
        }
        document.getElementById("state3").style.background = DRAW.color.background;
        const select = document.getElementById("selectG");
        const assign = document.getElementById("assign");
        STEP.update_component(STEP.CELL0, select, assign);
    },

    new: () => {
        STEP.refresh();
        STEP.update_states();
        const select = document.getElementById("selectG");
        const assign = document.getElementById("assign");
        STEP.update_component(STEP.CELL0, select, assign);
        DIST.refresh();
        SEG.refresh();
        STEP.update_dist();
    },

    recalculate: () => {
        const FOLD = STEP.FOLD;
        const CELL = Y.FOLD_2_CELL(STEP.FOLD_D);
        STEP.CELL_D = CELL;
        const FO = DIST.infer_FO(FOLD, CELL);
        STEP.FOLD_D.FO = FO;
        STEP.FOLD.FO = FO;
        const T = STEP.get_transform();
        const STATE = STEP.update_state(STEP.FOLD_D, CELL, "state3", T)
        if (STATE) {
            STEP.LIN = STATE.L;
        }
        document.getElementById("apply_tt").style.background = "";
    },

    update_dist: () => {
        STEP.CELL_D = undefined;
        const { Vf, FV, EV, EF, FE, Ff, EA, V, VV, Vc, FU, UV, UA, FO } = STEP.FOLD
        const VD = DIST.FOLD_2_VD(Vf, V)
        STEP.FOLD_D = { V, Vf: VD, FV, EV, EF, FE, Ff, EA, VV, Vc, FU, UV, UA, FO };

        if (STEP.LIN.cycle.length != 0) {
            NOTE.annotate(STEP.LIN.S, "serials");
            NOTE.annotate(STEP.LIN.cycle, "cycles");
            document.getElementById("apply_tt").setAttribute("style", "background: red")
        } else {
            document.getElementById("apply_tt").setAttribute("style", "background: default");
            document.getElementById("depth").max = STEP.LIN.S.length;
        }
        document.getElementById("state3").setAttribute("style", "background: " + DRAW.color.background);
        return STEP.update_serial_state(STEP.FOLD_D, STEP.LIN.S, "state3", STEP.get_transform());
    },
    update_component: (CELL, el_select, el_assign) => {
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
            [STEP.FOLD, STEP.LIN] = DIFF.diff(STEP.FOLD0, STEP.FOLD1, STEP.STATE0.L);
        } else {
            [STEP.FOLD, STEP.LIN] = [STEP.FOLD0, STEP.STATE0.L];
        }
        document.getElementById("depth").max = STEP.LIN.S.length;
        DRAW.draw_cp(STEP.FOLD, SVG.clear("cp3"));
    },

    update_state: (FOLD, CELL, svg_state, T) => {
        if (!FOLD) {
            return;
        }
        const STATE = Y.FOLD_CELL_2_STATE(FOLD, CELL);
        DRAW.draw_state(SVG.clear(svg_state), FOLD, CELL, STATE, T, SEG.clip, STEP.id, STEP.SYMBOLS);
        return STATE
    },
    update_serial_state: (FOLD, S, svg_state, T) => {
        if (!FOLD) {
            return;
        }
        DRAW_LIN.draw_state(SVG.clear(svg_state), FOLD, S, T, SEG.clip, STEP.depth, STEP.id, STEP.SYMBOLS);
        return undefined;
    },
};
