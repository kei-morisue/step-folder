import { SVG } from "../flatfolder/svg.js";
import { DIST } from "../distortionfolder/distortion.js";
import { Y } from "./y.js";
import { N } from "./nath.js";


import { M } from "../flatfolder/math.js";
import { X } from "../flatfolder/conversion.js";
import { IO } from "../flatfolder/io.js";


import { DRAW_LIN } from "./draw_lin.js";
import { DRAW } from "./draw.js";
import { DIFF } from "./diff.js";
import { SEG } from "./segment.js";
import { LOAD } from "./gui/load.js";

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
    get_scale: (zoom) => {
        return 2 * (Math.log(zoom) / Math.LN2) + 1;
    },
    limit_scale: (scale) => {
        return Math.min(10, Math.max(1, scale));
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
        DRAW.draw_cp(STEP.FOLD, SVG.clear("cp3"));
        if (STEP.CATAL) {
            DRAW.draw_cp(STEP.CATAL, SVG.clear("cp_catalyst"));
        }
        else {
            SVG.clear("cp_catalyst");
        }
        if (STEP.CELL_D) {
            const FOLD = STEP.FOLD_D;
            const CELL = STEP.CELL_D;
            STEP.STATE = STEP.update_celled_state(FOLD, CELL, "state3", T, STEP.STATE);
            document.getElementById("apply_tt").style.background = "";
        } else {
            STEP.update_linear_state(STEP.FOLD_D, STEP.LIN.S, "state3", T);
            if (STEP.LIN.cycle.length != 0) {
                document.getElementById("apply_tt").style.background = "red";
            } else {
                document.getElementById("apply_tt").style.background = "";
                document.getElementById("depth").max = STEP.LIN.S.length;
            }
        }
        document.getElementById("state3").style.background = DRAW.color.background;
        const select = document.getElementById("selectG");
        const assign = document.getElementById("assign");
        STEP.reset_component(STEP.CELL0, select, assign);
    },

    new: (ini = true) => {
        if (ini) {
            STEP.refresh();
        }
        STEP.update_states();
        const select = document.getElementById("selectG");
        const assign = document.getElementById("assign");
        STEP.reset_component(STEP.CELL0, select, assign);
        DIST.refresh();
        SEG.refresh();
        STEP.update_dist();
    },

    recalculate: async () => {
        const FOLD = STEP.FOLD_D;
        const CELL = Y.FOLD_2_CELL(FOLD);
        CELL.BF = STEP.CELL0.BF;
        CELL.BI = STEP.CELL0.BI;
        CELL.GB = STEP.CELL0.GB;
        CELL.GA = STEP.CELL0.GA;
        CELL.GI = STEP.CELL0.GI;
        STEP.CELL_D = CELL;
        await LOAD.report();
        const T = STEP.get_transform();
        STEP.STATE = STEP.update_celled_state(FOLD, CELL, "state3", T)
        if (STEP.STATE) {
            STEP.LIN = STEP.STATE.L;
        }
        document.getElementById("apply_tt").style.background = "";
        await LOAD.report();
    },

    update_dist: () => {
        STEP.CELL_D = undefined;
        const { Vf, FV, EV, EF, FE, Ff, EA, V, VV, Vc, FU, UV, UA, FO } = STEP.FOLD
        let catalyst = V;
        if (STEP.CATAL != undefined) {
            catalyst = STEP.CATAL.Vf;
        }
        const VD = DIST.FOLD_2_VD(Vf, catalyst)
        STEP.FOLD_D = { V, Vf: VD, FV, EV, EF, FE, Ff, EA, VV, Vc, FU, UV, UA, FO };

        if (STEP.LIN.cycle.length != 0) {

            document.getElementById("apply_tt").setAttribute("style", "background: red")
        } else {
            document.getElementById("apply_tt").setAttribute("style", "background: default");
            document.getElementById("depth").max = STEP.LIN.S.length;
        }
        document.getElementById("state3").setAttribute("style", "background: " + DRAW.color.background);
        const T = STEP.get_transform();
        return STEP.update_linear_state(STEP.FOLD_D, STEP.LIN.S, "state3", T);
    },
    reset_component: (CELL, el_select, el_assign) => {
        const { GB, GA, } = CELL
        SVG.clear(el_select.id)
        el_assign.max = GA[0].length
        el_assign.value = 1;
        for (let i = 0; i < GB.length; i++) {
            const el = document.createElement("option");
            el.setAttribute("value", `${i}`);
            el.textContent = `${i}`;
            el_select.appendChild(el);
        }
    },

    update_component: (CELL, g, a) => {
        const { GA, } = CELL;
        document.getElementById("selectG").value = g;
        document.getElementById("assign").max = GA[g].length;
        document.getElementById("assign").value = a + 1;
        document.getElementById("assigns").innerHTML = "/" + GA[g].length;
    },

    update_states: () => {
        const T = STEP.get_transform();
        STEP.SYMBOLS = [];
        STEP.STATE0 = STEP.update_celled_state(STEP.FOLD0, STEP.CELL0, "state0", T);
        DRAW.draw_group_text(STEP.FOLD0, STEP.CELL0, document.getElementById("state0"), T);
        if (STEP.FOLD1) {
            [STEP.FOLD, STEP.LIN] = DIFF.diff(STEP.FOLD0, STEP.FOLD1, STEP.STATE0.L);
        } else {
            [STEP.FOLD, STEP.LIN] = [STEP.FOLD0, STEP.STATE0.L];
        }
        document.getElementById("depth").max = STEP.LIN.S.length;
        DRAW.draw_cp(STEP.FOLD, SVG.clear("cp3"));
        STEP.CATAL = STEP.update_catalyst(STEP.FOLD);
        if (STEP.CATAL) {
            DRAW.draw_cp(STEP.CATAL, SVG.clear("cp_catalyst"));
        }
    },


    update_catalyst: (FOLD) => {
        if (STEP.CATAL == undefined) {
            return undefined;
        }
        let segs = STEP.CATAL.L;
        let EA_ = STEP.CATAL.EA;
        segs = segs.concat(FOLD.EV.map((vs) => M.expand(vs, FOLD.V)));
        EA_ = EA_.concat(FOLD.EA.map(() => "F"));
        segs = segs.concat(FOLD.UV.map((vs) => M.expand(vs, FOLD.V)));
        EA_ = EA_.concat(FOLD.UA.map(() => "F"));
        const doc = Y.segs_EA_2_CP(segs, EA_, 1.0);
        const [V_, VV_, EV_, EA, EF, FV_, FE] =
            IO.doc_type_side_2_V_VV_EV_EA_EF_FV_FE(doc, "cp", true);
        const [Vf_, Ff] = X.V_FV_EV_EA_2_Vf_Ff(V_, FV_, EV_, EA);


        const Vf = FOLD.Vf.map(() => undefined);
        const W = M.normalize_points(V_);
        for (const [i, v] of FOLD.V.entries()) {
            for (const [j, v0] of W.entries()) {
                if (Math.abs(M.distsq(v0, v)) < M.FLOAT_EPS) {
                    Vf[i] = Vf_[j];
                    break;
                }
            }
        }

        return {
            Vf,
            L: STEP.CATAL.L,
            EA: STEP.CATAL.EA,
            EV: STEP.CATAL.EV,
            V: STEP.CATAL.V,
        };

    },
    update_celled_state: (FOLD, CELL, svg_state, T, STATE = undefined) => {
        if (!FOLD) {
            return;
        }
        const STATE_ = STATE ?? Y.FOLD_CELL_2_STATE(FOLD, CELL);
        DRAW.draw_state(SVG.clear(svg_state), FOLD, CELL, STATE_, T, SEG.clip, STEP.id, STEP.SYMBOLS);
        return STATE_
    },
    update_linear_state: (FOLD, S, svg_state, T) => {
        if (!FOLD) {
            return;
        }
        DRAW_LIN.draw_state(SVG.clear(svg_state), FOLD, S, T, SEG.clip, STEP.depth, STEP.id, STEP.SYMBOLS);
        return undefined;
    },
};
