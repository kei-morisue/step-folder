import { SVG } from "../flatfolder/svg.js"
import { STEP } from "../defox/step.js"
import { DRAW as D } from "../defox/draw.js"
import { SEG } from "../defox/segment.js"
import { PRJ } from "../defox/project.js"
import { SYM } from "../defox/symbol.js"

import { PAINT } from "./paint.js"
import { CTRL } from "./control.js"
import { TMP } from "./template.js"


export const GUI = {
    startup: () => {
        const axa = document.getElementById("axanael")
        axa.style.background = D.color.background;
        fetch('./resources/axanael.xml')
            .then(response => response.text())
            .then(html => {
                axa.innerHTML = html;

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

    open: () => {
        const svg = document.getElementById("axanael_paint");
        document.getElementById("axanael").showModal();
        const i = PRJ.current_idx;
        PRJ.record(i);
        const FOLD = PRJ.steps[i].fold_d;
        const S = STEP.LIN.S;
        const T = STEP.get_transform();

        const syms = PRJ.steps[i].symbols;
        PAINT.initialize(svg, FOLD, S, T, syms);
        GUI.set_templates();
        GUI.set_controls(S.length);

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
        const [b, s] = [SVG.MARGIN, SVG.SCALE];
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
        const p2 = document.createElement("p");
        const p3 = document.createElement("p");

        body.appendChild(p1);
        body.appendChild(p2);
        body.appendChild(p3);

        TMP.set_template(p1, 0, SYM.create_mv([0.55, 0.55], [.45, .45], false, true));
        TMP.set_template(p1, 1, SYM.create_mv([0.55, 0.55], [.45, .45], true, true));
        TMP.set_template(p1, 2, SYM.create_mv([0.55, 0.55], [.45, .45], false, true, true));
        TMP.set_template(p1, 3, SYM.create_mv([0.55, 0.55], [.45, .45], true, true, true));
        TMP.set_template(p2, 4, SYM.create_sink([0.505, 0.505], [.495, .495], false));
        TMP.set_template(p2, 5, SYM.create_sink([0.505, 0.505], [.495, .495], true));
        TMP.set_template(p2, 6, SYM.create_fold_unfold([0.55, 0.55], [.45, .45], false, false));
        TMP.set_template(p2, 7, SYM.create_fold_unfold([0.55, 0.55], [.45, .45], false, true));
        TMP.set_template(p3, 8, SYM.create_flip([.5, .5], false, 100));
        TMP.set_template(p3, 9, SYM.create_reference_point([.5, .5], SYM.radius.reference_point));
        TMP.set_template(p3, 10, SYM.create_pleat([0.55, 0.55], [.45, .45], true));
        TMP.set_template(p3, 11, SYM.create_inside_reverse([0.55, 0.55], [.45, .45], true, false));
        TMP.set_template(p3, 12, SYM.create_inside_reverse([0.55, 0.55], [.45, .45], true, true));

    },

}