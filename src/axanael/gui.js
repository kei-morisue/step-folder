import { SVG } from "../flatfolder/svg.js"
import { STEP } from "../defox/step.js"
import { DRAW as D } from "../defox/draw.js"
import { SEG } from "../defox/segment.js"
import { PRJ } from "../defox/project.js"

import { SYM } from "../defox/symbol.js"
import { PAINT } from "./paint.js"


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
        const i = PRJ.current_idx
        PRJ.record(i);
        const FOLD = PRJ.steps[i].fold_d;
        const S = STEP.LIN.S;
        const T = STEP.get_transform();

        const syms = STEP.SYMBOLS ?? [];
        PAINT.initialize(svg, FOLD, S, T, syms);
        GUI.set_controls(S);
        GUI.set_templates();

        PAINT.redraw();

    },

    set_controls: (S) => {
        const body = SVG.clear("axanael_control_b");
        const l = S.length;
        for (const [i, symbol] of PAINT.symbols.entries()) {
            const num = (i + "").padStart(2, "0");
            const range_d = document.createElement("input");
            range_d.type = "range";
            range_d.min = 0;
            range_d.max = l - 1;
            range_d.step = 1;
            range_d.value = symbol.depth;
            range_d.id = `axanael_depth_${num}`;

            range_d.oninput = (e) => {
                symbol.depth = parseInt(e.target.value);
                PAINT.redraw();
            };
            const rem = document.createElement("button");
            rem.innerHTML = "remove";
            rem.onclick = () => {
                PAINT.symbols.splice(i, 1);
                GUI.set_controls(S);
                PAINT.redraw();
            }
            const flip = document.createElement("button");
            flip.innerHTML = "flip";
            flip.onclick = () => {
                symbol.params.is_clockwise = !symbol.params.is_clockwise;
                PAINT.redraw();
            }

            const rev = document.createElement("button");
            rev.innerHTML = "reverse";
            rev.onclick = () => {
                symbol.params.is_rev = !symbol.params.is_rev;
                PAINT.redraw();
            }
            const span = document.createElement("span");
            body.appendChild(span);
            span.appendChild(range_d);
            span.appendChild(flip);
            span.appendChild(rev);
            span.appendChild(rem);

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
        body.appendChild(p1);
        body.appendChild(p2);
        GUI.set_template(p1, 0, SYM.create_arrow_mv([0.55, 0.55], [.45, .45], false, true));
        GUI.set_template(p1, 1, SYM.create_arrow_mv([0.55, 0.55], [.45, .45], true, true));
        GUI.set_template(p1, 2, SYM.create_arrow_mv([0.55, 0.55], [.45, .45], false, true, true));
        GUI.set_template(p1, 3, SYM.create_arrow_mv([0.55, 0.55], [.45, .45], true, true, true));
        GUI.set_template(p2, 4, SYM.create_arrow_sink([0.505, 0.505], [.495, .495], false));
        GUI.set_template(p2, 5, SYM.create_arrow_sink([0.505, 0.505], [.495, .495], true));

    },
    set_template: (body, type, sym) => {
        const span = document.createElement("span");
        body.appendChild(span);
        const input = document.createElement("input");
        input.type = "radio";
        input.name = "templates";
        const svg = document.createElementNS(SVG.NS, "svg");
        input.onclick = () => {
            PAINT.type = type;
        }
        const s = SVG.SCALE;
        svg.setAttribute("width", s * 0.15);
        svg.setAttribute("height", s * 0.15);
        const b = SVG.MARGIN;
        svg.setAttribute("viewBox", `${s * 0.4} ${s * 0.40} ${s * 0.2} ${s * 0.2}`);
        svg.style.background = D.color.background


        svg.appendChild(sym);
        span.appendChild(input);
        span.appendChild(svg);

    },

}