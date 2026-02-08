import { M } from "../../flatfolder/math.js";
import { SVG } from "../../flatfolder/svg.js";
import { DIST } from "../../distortionfolder/distortion.js";

import { STEP } from "../step.js";
import { N } from "../nath.js";
import { Y } from "../y.js";
import { SEG } from "../segment.js";
import { PRJ } from "../project.js";
import { GUI } from "./gui.js";
import { PAGE } from "../page.js";

export const GUI_STATE = {

    startup: () => {
        GUI_STATE.set_svg("states");
        document.getElementById("flip").onclick = (e) => {
            STEP.flip0 = !STEP.flip0;
            STEP.redraw();
        }
        document.getElementById("render_reset").onclick = (e) => {
            STEP.refresh();
            STEP.redraw();
        }

        document.getElementById("infer_prev").onclick = (e) => {
            const i = PRJ.current_idx;
            if (i < 1) {
                return;
            }
            const params = PRJ.steps[i - 1].params;
            STEP.scale = params[0];
            STEP.rotate = params[1];
            STEP.scale = params[2];
            DIST.p0 = params[4];
            DIST.p1 = params[5];
            DIST.p2 = params[6];
            DIST.cx = params[7];
            DIST.cy = params[8];
            STEP.update_states();
            STEP.update_dist();
            PRJ.record(i);
            STEP.redraw();
            document.getElementById("rotate").value = STEP.rotate;
            document.getElementById("p0").value = DIST.p0;
            document.getElementById("p1").value = DIST.p1;
            document.getElementById("p2").value = DIST.p2;
        }

        document.getElementById("infer_next").onclick = (e) => {
            const i = PRJ.current_idx;
            if (i >= PRJ.steps.length - 1) {
                return;
            }
            const params = PRJ.steps[i + 1].params;
            STEP.scale = params[0];
            STEP.rotate = params[1];
            STEP.scale = params[2];
            DIST.p0 = params[4];
            DIST.p1 = params[5];
            DIST.p2 = params[6];
            DIST.cx = params[7];
            DIST.cy = params[8];
            STEP.update_states();
            STEP.update_dist();
            PRJ.record(i);
            STEP.redraw();
            document.getElementById("rotate").value = STEP.rotate;
            document.getElementById("p0").value = DIST.p0;
            document.getElementById("p1").value = DIST.p1;
            document.getElementById("p2").value = DIST.p2;
        }

        document.getElementById("state3").onwheel = (e) => {
            e.preventDefault();
            const lvl = STEP.scale - Math.sign(e.deltaY);
            STEP.scale = Math.max(1, lvl);
            STEP.redraw();
        }
        document.getElementById("state3").onclick = (e) => {
            e.preventDefault();
            const svg = document.getElementById("state3")
            var pt = svg.createSVGPoint();  // Created once for document
            pt.x = e.clientX;
            pt.y = e.clientY;
            // The cursor point, translated into svg coordinates
            var cursorpt = pt.matrixTransform(svg.getScreenCTM().inverse());
            const w = SVG.SCALE;
            const z = STEP.get_zoom(STEP.scale);
            const th = (2 * STEP.rotate - 1) * Math.PI * (2 * STEP.flip0 - 1);
            const Ainv = N.mat(STEP.flip0, 1 / z, th);
            const x0 = cursorpt.x / w - 0.5;
            const y0 = cursorpt.y / w - 0.5;
            [STEP.cx, STEP.cy] = M.add([STEP.cx, STEP.cy], N.apply(Ainv, [x0, y0]));
            STEP.redraw();
        }
        GUI.open_close("edit_dist", "inline");
        GUI.open_close("edit_symbol", "inline");
        GUI.open_close("edit_render", "inline");

        document.getElementById("assign").onchange = (e) => {
            const { GB, BF, GA, GI } = STEP.CELL0
            const { Ff } = STEP.FOLD0

            const a = e.target.value - 1;
            const g = document.getElementById("selectG").value

            STEP.CELL0.GI[g] = a
            STEP.FOLD0.FO = Y.BF_GB_GA_GI_Ff_2_FO(BF, GB, GA, GI, Ff)
            STEP.update_states()
            STEP.update_dist();
        }

        document.getElementById("reset_tt").onclick = (e) => {
            for (const [i, id] of ["T0", "T1", "T2", "T3"].entries()) {
                DIST[id] = true;
                document.getElementById("cb_" + id).checked = true;
            }
            STEP.CELL_D = undefined;
            PRJ.record(PRJ.current_idx);
        }

        document.getElementById("selectG").onchange = (e) => {
            const { GA, GI } = STEP.CELL0
            const g = e.target.value
            document.getElementById("assign").max = GA[g].length
            document.getElementById("assign").value = GI[g] + 1
            document.getElementById("assigns").innerHTML = "/" + GA[g].length
        }

        document.getElementById("range_steps").oninput = GUI_STATE.jump;
        document.getElementById("next").onclick = GUI_STATE.next;
        document.getElementById("prev").onclick = GUI_STATE.prev;



        document.getElementById("cp_layers").onclick = () => {
            if (document.getElementById("cp3").style.display == "none") {
                document.getElementById("state0").setAttribute("style", "display: none;");
                document.getElementById("cp3").setAttribute("style", "display: default;");
            } else {
                document.getElementById("state0").setAttribute("style", "display: default;");
                document.getElementById("cp3").setAttribute("style", "display: none;");
            }
        };


        for (const [i, id] of ["T0", "T1", "T2", "T3"].entries()) {
            document.getElementById("cb_" + id).onchange = (e) => {
                DIST[id] = e.target.checked;
                STEP.recalculate();
                PRJ.record(PRJ.current_idx);
            }
        }
        document.getElementById("apply_tt").onclick = (e) => {
            STEP.recalculate();
            PRJ.record(PRJ.current_idx);
        }
        GUI_STATE.setup_range_options(
            ["p0", "p1", "p2", "clip", "rotate"],
            ["p0", "p1", "p2", "clip", "rotate"],
            [0, 0.5, 0, 0, 0.5],
            [DIST, DIST, DIST, SEG, STEP],
            [STEP.update_dist, STEP.update_dist, STEP.update_dist, STEP.redraw, STEP.redraw]
        );
    },
    setup_range_options: (ids, props, init, modules, dispatches) => {
        for (const [i, id] of ids.entries()) {
            document.getElementById(id).oninput = (e) => {
                const val = e.target.value
                modules[i][props[i]] = val

                dispatches[i]();
            }
            document.getElementById(id + "_reset").onclick = (e) => {
                document.getElementById(id).value = init[i]
                modules[i][props[i]] = init[i]
                dispatches[i]();
            }
        }
    },

    set_svg: (id) => {
        const [b, s] = [SVG.MARGIN, SVG.SCALE];
        const main = document.getElementById(id);

        for (const [i, ch] of [].entries.call(main.children)) {
            const id = ch.id
            const svg = document.getElementById(id);
            for (const [k, v] of Object.entries({
                xmlns: SVG.NS,
                height: s,
                width: s,
                viewBox: [-b, -b, s + 2 * b, s + 2 * b].join(" "),
            })) {
                svg.setAttribute(k, v);
            }
        }
    },

    prev: () => {
        if (PRJ.current_idx == 0) {
            return;
        }
        const i = PRJ.current_idx;
        PRJ.record(i);
        PRJ.restore(i - 1);
        STEP.redraw();
    },
    next: () => {
        if (PRJ.steps.length - 1 < PRJ.current_idx + 1) {
            return;
        }
        else {
            const i = PRJ.current_idx;
            PRJ.record(i);
            PRJ.restore(i + 1);
            STEP.redraw();
        }
    },
    jump: (e) => {
        const j = e.target.value;
        GUI_STATE.jump_to(j - 1);
    },
    jump_to: (idx) => {
        PRJ.record(PRJ.current_idx);
        PRJ.restore(idx);
        STEP.redraw();
    },

}