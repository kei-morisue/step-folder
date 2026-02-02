import { M } from "../flatfolder/math.js";
import { NOTE } from "../flatfolder/note.js";
import { SVG } from "../flatfolder/svg.js";

import { CON } from "../flatfolder/constraints.js";

import { DIST } from "../distortionfolder/distortion.js";

import { STEP } from "./step.js";
import { N } from "./nath.js";

import { DRAW } from "./draw.js";
import { Y } from "./y.js";
import { SEG } from "./segment.js";
import { PAGE } from "./page.js";

export const GUI = {

    opacity: {
        normal: 0.01,
        hover: 1,
    },
    radius: {
        normal: 10,
        hover: 20,
    },
    startup: () => {
        CON.build();
        NOTE.clear_log();
        NOTE.start("*** Starting Flat-Folder ***");
        NOTE.time("Initializing interface");

        GUI.set_svg("states")




        document.getElementById("flip").onclick = (e) => {
            STEP.flip0 = !STEP.flip0;
            STEP.redraw();
        }
        document.getElementById("render_reset").onclick = (e) => {
            STEP.refresh();
            STEP.redraw();
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
            const w = SVG.SCALE + 2 * SVG.MARGIN;
            const b = SVG.MARGIN / SVG.SCALE;
            const z = STEP.get_zoom(STEP.scale);
            const th = (2 * STEP.rotate - 1) * Math.PI * (2 * STEP.flip0 - 1);
            const Ainv = N.mat(STEP.flip0, 1 / z, th);
            const x0 = (cursorpt.x / w - .5 + b);
            const y0 = (cursorpt.y / w - .5 + b);
            [STEP.cx, STEP.cy] = M.add([STEP.cx, STEP.cy], N.apply(Ainv, [x0, y0]));
            STEP.redraw();
        }



        document.getElementById("topcolor").onchange = (e) => {
            DRAW.color.face.top = e.target.value
            STEP.redraw()
        }

        document.getElementById("bottomcolor").onchange = (e) => {
            DRAW.color.face.bottom = e.target.value
            STEP.redraw()
        }

        document.getElementById("bgcolor").onchange = (e) => {
            DRAW.color.background = e.target.value
            STEP.update_dist()
        }
        GUI.open_close("option_color", "inline");
        GUI.open_close("option_width", "inline");
        GUI.open_close("option_layers", "inline");
        GUI.open_close("option_text", "inline");
        GUI.open_close("option_layout", "inline");
        GUI.open_close("option_dim", "inline");

        GUI.open_close("edit_dist", "inline");
        GUI.open_close("edit_symbol", "inline");
        GUI.open_close("edit_render", "inline");
        GUI.open_close("edit_symbol", "inline");



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
            STEP.update_states()
        }

        document.getElementById("selectG").onchange = (e) => {
            const { GA, GI } = STEP.CELL0
            const g = e.target.value
            document.getElementById("assign").max = GA[g].length
            document.getElementById("assign").value = GI[g] + 1
            document.getElementById("assigns").innerHTML = "/" + GA[g].length
        }


        GUI.setup_range_options(
            ["p0", "p1", "p2", "clip", "rotate"],
            ["p0", "p1", "p2", "clip", "rotate"],
            [0, 0.5, 0, 0, 0.5],
            [DIST, DIST, DIST, SEG, STEP],
            [STEP.update_dist, STEP.update_dist, STEP.update_dist, STEP.redraw, STEP.redraw]
        );


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




}