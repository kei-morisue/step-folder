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
                // document.getElementById("prev").click();
                // document.getElementById("prev").click();
                // document.getElementById("axanael_open").click();
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

        const syms = [];
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
            const range = document.createElement("input");
            range.type = "range";
            range.min = 0;
            range.max = l - 1;
            range.step = 1;
            range.value = symbol.depth;
            range.id = `axanael_depth_${num}`;

            range.oninput = (e) => {
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
                const s = symbol.params.s;
                const e = symbol.params.e;
                symbol.params.e = s;
                symbol.params.s = e;
                PAINT.redraw();
            }
            const span = document.createElement("span");
            body.appendChild(span);
            span.appendChild(range);
            span.appendChild(flip);
            span.appendChild(rev);
            span.appendChild(rem);

        }
    },

    close: () => {
        document.getElementById("axanael").close();

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

        GUI.set_template(body, 0, SYM.create_arrow_mv([0, 0], [.5, .5], false, true));
        GUI.set_template(body, 0, SYM.create_arrow_mv([0, 0], [.5, .5], true, true));
        GUI.set_template(body, 0, SYM.create_arrow_mv([0, 0], [.5, .5], false, true, true));
        GUI.set_template(body, 0, SYM.create_arrow_mv([0, 0], [.5, .5], true, true, true));
        GUI.set_template(body, 2, SYM.create_arrow_sink([0, 0], [.5, .5], false));

    },
    set_template: (body, i, sym) => {
        const p = document.createElement("span");
        body.appendChild(p);
        const input = document.createElement("input");
        input.type = "radio";
        input.name = "templates";
        const num = (i + "").padStart(2, "0");
        input.id = `template_${num}_select`;
        const svg = document.createElementNS(SVG.NS, "svg");
        input.click = () => {
            PAINT.mode = i;
        }
        const s = SVG.SCALE / 2;
        svg.setAttribute("width", s);
        svg.setAttribute("height", s);
        const b = SVG.MARGIN;
        svg.setAttribute("viewBox", `-${b} -${b} ${b + s} ${b + s}`);
        svg.style.background = D.color.background
        svg.style.width = "10%";
        svg.style.height = "10%";

        svg.appendChild(sym);
        p.appendChild(input);
        p.appendChild(svg);

    },

}