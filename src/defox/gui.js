import { M } from "../flatfolder/math.js";
import { NOTE } from "../flatfolder/note.js";
import { SVG } from "../flatfolder/svg.js";
import { IO } from "../flatfolder/io.js";
import { X } from "../flatfolder/conversion.js";
import { SOLVER } from "../flatfolder/solver.js";
import { CON } from "../flatfolder/constraints.js";
import { MAIN } from "../main.js";

export const GUI = {

    opacity: {
        normal: 0.01,
        hover: 1,
    },
    radius: {
        normal: 10,
        hover: 20,
    },
    startup: (FOLD0, CELL0, FOLD1, CELL1) => {

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
                MAIN.update_states()
            }
            document.getElementById(id + "_reset").onclick = (e) => {
                if (Array.isArray(props)) {
                    props.map(p => module[p] = init[i])
                } else {
                    module[props] = init[i]
                }
                document.getElementById(id).value = init[i]
                MAIN.update_states()
            }
        }
    },

    setup_range_options: (ids, props, affines, init, module) => {
        for (const [i, id] of ids.entries()) {
            document.getElementById(id).onchange = (e) => {
                const val = e.target.value
                module[props[i]] = affines[i](val)

                MAIN.update_dist();
            }
            document.getElementById(id + "_reset").onclick = (e) => {
                document.getElementById(id).value = init[i]
                module[props[i]] = affines[i](init[i])
                MAIN.update_dist();
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

    flip: (FS, STATE) => {
        NOTE.start("Flipping model");
        MAIN.draw_state(SVG.clear("input"), FS, STATE);
        NOTE.end();
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
                MAIN.draw_state(svg, FOLD, CELL, STATE, FS, LINE);
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