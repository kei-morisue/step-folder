import { SVG } from "../flatfolder/svg.js"
import { STEP } from "../defox/step.js"
import { DRAW as D } from "../defox/draw.js"
import { SEG } from "../defox/segment.js"
import { PRJ } from "../defox/project.js"
import { SYM } from "../defox/symbol.js"
import { SVG3 } from "../defox/svg.js"

import { PAINT } from "./paint.js"
import { CTRL } from "./control.js"
import { TMP } from "./template.js"


export const GUI = {
    startup: () => {
        const axa = document.getElementById("axanael")
        fetch('./resources/axanael.xml')
            .then(response => response.text())
            .then(html => {
                axa.innerHTML = html;
                document.getElementById("axanael_range_steps").oninput = GUI.jump;
                document.getElementById("axanael_next").onclick = GUI.next;
                document.getElementById("axanael_prev").onclick = GUI.prev;
                const svg = document.getElementById("axanael_paint");

                document.getElementById("axanael_open").onclick = GUI.open;
                document.getElementById("axanael_close").onclick = GUI.close;
                document.getElementById("axanael_discard").onclick = GUI.discard;
                GUI.set_svg(svg);
                svg.onmousemove = PAINT.onmove;
                svg.onclick = PAINT.onclick;
                svg.onmouseout = PAINT.onout;
            });

    },
    prev: () => {
        if (PRJ.current_idx == 0) {
            return;
        }
        STEP.SYMBOLS = PAINT.symbols;
        const i = PRJ.current_idx;
        GUI.jump_to(i - 1);
    },
    next: () => {
        if (PRJ.steps.length - 1 < PRJ.current_idx + 1) {
            return;
        }
        STEP.SYMBOLS = PAINT.symbols;
        const i = PRJ.current_idx;
        GUI.jump_to(i + 1);
    },
    jump: (e) => {
        const j = e.target.value;
        GUI.jump_to(j - 1);
    },
    jump_to: (idx) => {
        STEP.SYMBOLS = PAINT.symbols;
        PRJ.record(PRJ.current_idx);
        PRJ.restore(idx);
        STEP.redraw();
        GUI.initialize();
        PAINT.redraw();
    },

    initialize: () => {
        const i = PRJ.current_idx;
        PRJ.record(i);
        const FOLD = PRJ.steps[i].fold_d;
        const S = STEP.LIN.S;
        const T = STEP.get_transform();

        const syms = PRJ.steps[i].symbols;
        const svg = document.getElementById("axanael_paint");
        svg.style.background = D.color.background;

        PAINT.initialize(svg, FOLD, S, T, syms);
        GUI.set_controls(S.length);
        document.getElementById("axanael_step").innerHTML = i + 1;
    },

    open: () => {
        document.getElementById("axanael").showModal();
        GUI.initialize();
        document.getElementById("axanael_range_steps").max = PRJ.steps.length;
        document.getElementById("axanael_range_steps").value = PRJ.current_idx + 1;
        document.getElementById("axanael_steps").innerHTML = PRJ.steps.length;
        GUI.set_templates();
        PAINT.type = -1;
        PAINT.redraw();

    },

    set_controls: (length) => {
        const body = SVG.clear("axanael_control_b");
        for (const [i, symbol] of PAINT.symbols.entries()) {
            CTRL.set(body, i, symbol, length);
        }
    },

    close: () => {
        document.getElementById("axanael").close();
        STEP.SYMBOLS = PAINT.symbols;
        STEP.redraw();
    },
    discard: () => {
        document.getElementById("axanael").close();

    },

    set_svg: (svg) => {
        const [b, s] = [SVG3.MARGIN, SVG.SCALE];
        for (const [k, v] of Object.entries({
            xmlns: SVG.NS,
            height: s,
            width: s,
            viewBox: [-b, -b, s + 2 * b, s + 2 * b].join(" "),
        })) {
            svg.setAttribute(k, v);
        }
    },

    set_templates: () => {
        const body = SVG.clear("axanael_lib");
        const p1 = document.createElement("p");
        // const p2 = document.createElement("p");
        const p3 = document.createElement("p");
        // const p4 = document.createElement("p");

        body.appendChild(p1);
        // body.appendChild(p2);
        body.appendChild(p3);
        // body.appendChild(p4);

        TMP.set_template(p1, 0, SYM.create_mv([0.55, 0.55], [.45, .45], false, true));
        TMP.set_template(p1, 1, SYM.create_mv([0.55, 0.55], [.45, .45], true, true));
        TMP.set_template(p1, 2, SYM.create_mv([0.55, 0.55], [.45, .45], false, true, true));
        TMP.set_template(p1, 3, SYM.create_mv([0.55, 0.55], [.45, .45], true, true, true));
        TMP.set_template(p1, 4, SYM.create_sink([0.505, 0.505], [.495, .495], false));
        TMP.set_template(p1, 5, SYM.create_sink([0.505, 0.505], [.495, .495], true));
        TMP.set_template(p1, 6, SYM.create_fold_unfold([0.55, 0.55], [.45, .45], false, false));
        TMP.set_template(p1, 7, SYM.create_fold_unfold([0.55, 0.55], [.45, .45], false, true));
        TMP.set_template(p3, 8, SYM.create_flip([.5, .5], false, 100));
        TMP.set_template(p3, 10, SYM.create_pleat([0.55, 0.55], [.45, .45], true));
        TMP.set_template(p3, 11, SYM.create_inside_reverse([0.55, 0.55], [.45, .45], true, false));
        TMP.set_template(p3, 12, SYM.create_inside_reverse([0.55, 0.55], [.45, .45], true, true));
        TMP.set_template(p3, 9, SYM.create_reference_point([.5, .5], SYM.radius.reference_point));
        TMP.set_template(p3, 13, SYM.create_right_angle([.5, .5], [0.50, 0.505], [.505, .5]));
        TMP.set_template(p3, 14, SYM.create_angle_bisector([.5, .5], [0.50, 0.505], [.505, .495]));
        TMP.set_template(p3, 15, SYM.create_repeat([.5, .5], [.8, .3], PRJ.steps[0].fold_cp, PRJ.steps[0].fold_cp, .5));

    },

}