import { DIST } from "../distortionfolder/distortion.js";

import { STEP } from "./step.js"
import { SEG } from "./segment.js";
import { PAGE } from "./page.js";


export const PRJ = {
    current_idx: 0,
    steps: [],

    refresh: () => {
        PRJ.current_idx = 0;
        PRJ.steps = [];
    },

    redraw_page: () => {
        PAGE.redraw(document.getElementById("page"), PRJ.steps);
    },

    remove: () => {
        const i = PRJ.current_idx;
        if (PRJ.steps.length == 2 || i == 0) {
            return;
        }
        if (confirm("Are you sure to remove current step " + (i + 1) + "? ")) {
            PRJ.steps.splice(i, 1);
            if (PRJ.steps[i - 1]) {
                PRJ.restore(i - 1);
                STEP.update_states();
                STEP.update_dist();
                PRJ.record(i - 1);
            }
            PRJ.restore(i);
            STEP.update_states();
            STEP.update_dist();
            PRJ.record(i);

            STEP.redraw();
            PRJ.redraw_page();
        }
    },
    duplicate: () => {
        const i = PRJ.current_idx;
        const s = PRJ.steps[i];
        const step = {
            fold_cp: s.fold_cp,
            cell_cp: s.cell_cp,
            params: s.params
        };

        PRJ.steps.splice(i + 1, 0, step);
        PRJ.restore(i);
        STEP.update_states();
        STEP.update_dist();
        PRJ.record(i);
        if (PRJ.steps[i + 1]) {
            PRJ.restore(i + 1);
            STEP.update_states();
            STEP.update_dist();
            PRJ.record(i + 1);
        }
        PRJ.restore(i);
        STEP.redraw();
        PRJ.redraw_page();
    },
    restore: (i) => {
        if (i > PRJ.steps.length - 1) {
            return;
        }
        STEP.FOLD0 = PRJ.steps[i].fold_cp;
        STEP.CELL0 = PRJ.steps[i].cell_cp;
        STEP.STATE0 = PRJ.steps[i].state_cp;

        if (i < PRJ.steps.length - 1) {
            STEP.FOLD1 = PRJ.steps[i + 1].fold_cp;
            STEP.CELL1 = PRJ.steps[i + 1].cell_cp;
        } else {
            STEP.FOLD1 = undefined;
            STEP.CELL1 = undefined;
        }
        STEP.id = i;
        STEP.FOLD = PRJ.steps[i].fold;

        STEP.FOLD_D = PRJ.steps[i].fold_d;
        STEP.CELL_D = PRJ.steps[i].cell_d;
        STEP.LIN = PRJ.steps[i].lin;

        const p = PRJ.steps[i].params;
        if (p) {
            [STEP.flip0, STEP.rotate, STEP.scale, SEG.clip, DIST.p0, DIST.p1, DIST.p2, STEP.cx, STEP.cy] = p;
            document.getElementById("clip").value = SEG.clip;
            document.getElementById("rotate").value = STEP.rotate;
            document.getElementById("p0").value = DIST.p0;
            document.getElementById("p1").value = DIST.p1;
            document.getElementById("p2").value = DIST.p2;
        } else {
            STEP.refresh();
        }

        PRJ.current_idx = i
        document.getElementById("steps").innerHTML = PRJ.steps.length;
        document.getElementById("step").innerHTML = i + 1;
        document.getElementById("range_steps").max = PRJ.steps.length;
        document.getElementById("range_steps").value = i + 1;

    },
    record: (i) => {
        if (PRJ.steps.length - 1 < i) {
            return;
        }
        PRJ.steps[i].fold_cp = STEP.FOLD0;
        PRJ.steps[i].cell_cp = STEP.CELL0;
        PRJ.steps[i].state_cp = STEP.STATE0;
        PRJ.steps[i].fold = STEP.FOLD;
        PRJ.steps[i].fold_d = STEP.FOLD_D;
        PRJ.steps[i].cell_d = STEP.CELL_D;
        PRJ.steps[i].lin = STEP.LIN;
        PRJ.steps[i].params = PRJ.parameters();
    },

    parameters: () => {
        return [
            STEP.flip0,
            STEP.rotate,
            STEP.scale,
            SEG.clip,
            DIST.p0,
            DIST.p1,
            DIST.p2,
            STEP.cx,
            STEP.cy,]
    },

    setup_number_options: (ids, edge_props, init, module) => {
        for (const [i, id] of ids.entries()) {
            const props = edge_props[i]
            document.getElementById(id).onchange = (e) => {
                if (Array.isArray(props)) {
                    props.map(p => module[p] = e.target.value)
                } else {
                    module[props] = parseInt(e.target.value);
                }
                STEP.redraw();
                PRJ.redraw_page();
            }
            document.getElementById(id + "_reset").onclick = (e) => {
                if (Array.isArray(props)) {
                    props.map(p => module[p] = init[i])
                } else {
                    module[props] = init[i]
                }
                document.getElementById(id).value = init[i]
                STEP.redraw();
                PRJ.redraw_page();
            }
        }
    },

}