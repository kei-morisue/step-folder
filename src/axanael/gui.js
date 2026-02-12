import { SVG } from "../flatfolder/svg.js"
import { STEP } from "../defox/step.js"
import { DRAW as D } from "../defox/draw.js"
import { SEG } from "../defox/segment.js"
import { PRJ } from "../defox/project.js"

import { DRAW } from "./draw.js"
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
                document.getElementById("axanael_open").click();
            });

    },

    open: () => {
        const svg = document.getElementById("axanael_paint");
        document.getElementById("axanael").showModal();
        const i = PRJ.current_idx
        const FOLD = PRJ.steps[i].fold_d;
        const S = STEP.LIN.S;

        const syms = [];
        PAINT.initialize(svg, FOLD, S, syms);
        GUI.set_depths(S);
        GUI.set_templates();

        PAINT.redraw();

    },

    set_depths: (S) => {
        const body = SVG.clear(document.getElementById("axanael_control_b"));
        const l = S.length;
        for (const [i, s] of PAINT.symbols.entries()) {
            const num = (i + "").padStart(2, "0");
            const range = document.createElement("input");
            range.type = "range";
            range.min = 0;
            range.max = l;
            range.step = 1;
            range.value = S.depth;
            range.id = `axanael_depth_${num}`;
            body.appendChild(range);

            range.oninput = (e) => {
                s.depth = e.target.value;
                PAINT.redraw();
            };

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

        GUI.set_template(body, 0, DRAW.create_arrow_mv([0, 0], [500, 500], false, true));
        GUI.set_template(body, 1, DRAW.create_arrow_mv([0, 0], [500, 500], true, true));
        GUI.set_template(body, 2, DRAW.create_arrow_sink([0, 0], [500, 500], false));

    },
    set_template: (body, i, sym) => {
        const p = document.createElement("p");
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
        const b = SVG.MARGIN / 2;
        svg.setAttribute("viewBox", `-${b} -${b} ${2 * b + s} ${2 * b + s}`);
        svg.style.background = D.color.background
        svg.style.width = "20%";
        svg.style.height = "20%";

        svg.appendChild(sym);
        p.appendChild(input);
        p.appendChild(svg);

    },

}