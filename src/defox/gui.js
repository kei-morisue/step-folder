import { M } from "../flatfolder/math.js";
import { NOTE } from "../flatfolder/note.js";
import { SVG } from "../flatfolder/svg.js";
import { IO } from "../flatfolder/io.js";
import { X } from "../flatfolder/conversion.js";
import { SOLVER } from "../flatfolder/solver.js";
import { CON } from "../flatfolder/constraints.js";

import { DIST } from "../distortionfolder/distortion.js";

import { STEP } from "./step.js";
import { DRAW } from "./draw.js";
import { Y } from "./y.js";
import { SEG } from "./segment.js";
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
        GUI.set_svg("cps")




        document.getElementById("flip").onclick = (e) => {
            STEP.flip0 = !STEP.flip0;
            STEP.update_states();
            STEP.update_dist();
        }
        GUI.setup_number_options(
            ["width_crease", "width_boundary", "width_MMVV"],
            ["F", "B", ["MM", "VV"]],
            [1, 3, 3],
            DRAW.width.edge
        )


        for (const [i, id] of ["T0", "T1", "T2", "T3"].entries()) {
            document.getElementById("cb_" + id).onchange = (e) => {
                DIST[id] = e.target.checked
                STEP.update_states()
                STEP.update_dist()
            }
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
        GUI.open_close("cps", "flex");
        GUI.open_close("option_color", "inline");
        GUI.open_close("option_width", "inline")


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

        document.getElementById("selectG").onchange = (e) => {
            const { GA, GI } = STEP.CELL0
            const g = e.target.value
            document.getElementById("assign").max = GA[g].length
            document.getElementById("assign").value = GI[g] + 1
            document.getElementById("assigns").innerHTML = "/" + GA[g].length
        }


        GUI.setup_range_options(
            ["k0", "t0", "s0", "clip", "k1", "t1"],
            ["scale", "direction", "strength", "clip", "scale_skew", "direction_skew"],
            [0.0, 0.5, 0.5, 0, 0.5, 0.5],
            [DIST, DIST, DIST, SEG, DIST, DIST]
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
    setup_number_options: (ids, edge_props, init, module) => {
        for (const [i, id] of ids.entries()) {
            const props = edge_props[i]
            document.getElementById(id).onchange = (e) => {
                if (Array.isArray(props)) {
                    props.map(p => module[p] = e.target.value)
                } else {
                    module[props] = e.target.value
                }
                STEP.redraw()
            }
            document.getElementById(id + "_reset").onclick = (e) => {
                if (Array.isArray(props)) {
                    props.map(p => module[p] = init[i])
                } else {
                    module[props] = init[i]
                }
                document.getElementById(id).value = init[i]
                STEP.redraw()
            }
        }
    },

    setup_range_options: (ids, props, init, modules) => {
        for (const [i, id] of ids.entries()) {
            document.getElementById(id).onchange = (e) => {
                const val = e.target.value
                modules[i][props[i]] = val

                STEP.update_dist();
            }
            document.getElementById(id + "_reset").onclick = (e) => {
                document.getElementById(id).value = init[i]
                modules[i][props[i]] = init[i]
                STEP.update_dist();
            }
        }

    },

    set_svg: (id) => {
        const [b, s] = [50, SVG.SCALE];
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
    refresh: () => {
    },


    show_linear_slider: (L, svg, FOLD, CELL, STATE, FS, LINE) => {
        const slider = document.getElementById("slider");
        const cycle = document.getElementById("cycle");
        if (L == undefined) {
            slider.style.display = "none";
            cycle.style.display = "inline";
        } else {
            cycle.style.display = "none";
            slider.style.display = "inline";
            slider.oninput = () => {
                SVG.clear(svg.id);
                STEP.draw_state(svg, FOLD, CELL, STATE, FS, LINE);
            };
            const val = +slider.value;
            const n = FOLD.FV.length;
            const F_set = new Set();
            for (let i = 0; i < n; ++i) {
                F_set.add(i);
            }
            if (flip) { L.reverse(); }
            for (let i = L.length - 1; i >= val; --i) {
                const layer = L[i];
                for (const fi of layer) {
                    F_set.delete(fi);
                }
            }
            if (flip) { L.reverse(); }
            for (let i = 0; i < STATE.CD.length; ++i) {
                const S = STATE.CD[i];
                const D = S.map(a => a);
                if (flip) {
                    D.reverse();
                }
                STATE.Ctop[i] = undefined;
                while (D.length > 0) {
                    const fi = D.pop();
                    if (!F_set.has(fi)) {
                        STATE.Ctop[i] = fi;
                        break;
                    }
                }
            }
            for (let i = 0; i < STATE.Ccolor.length; ++i) {
                const d = STATE.Ctop[i];
                let out = undefined;
                if (d == undefined) { out = undefined; }
                else if (FOLD.Ff[d] != flip) { out = GUI.color.face.top; }
                else { out = GUI.color.face.bottom; }
                STATE.Ccolor[i] = out;
            }
        }

    },
}