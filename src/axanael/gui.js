import { SVG } from "../flatfolder/svg.js"
import { STEP } from "../defox/step.js"
import { DRAW as D } from "../defox/draw.js"
import { SEG } from "../defox/segment.js"
import { PRJ } from "../defox/project.js"

import { DRAW } from "./draw.js"
import { PAINT } from "./paint.js"


export const GUI = {
    startup: () => {
        const svg = document.getElementById("axanael_paint");
        const defs = document.getElementById("defs");
        GUI.fetch(defs, './resources/defs.xml');

        document.getElementById("axanael").style.background = D.color.background;
        document.getElementById("axanael_open").onclick = GUI.open;
        document.getElementById("axanael_close").onclick = GUI.close;
        document.getElementById("axanael_discard").onclick = GUI.discard;
        document.getElementById("axanael_depth").oninput = (e) => {
            PAINT.depth = e.target.value;
            PAINT.redraw(svg);
        };


        GUI.set_svg(svg);
        for (let i = 0; i < 3; i++) {
            for (const k of ["body"]) {
                const id = (i + "").padStart(2, "0");
                const tmp = document.getElementById(`template_${id}_${k}`);
                GUI.set_template(tmp);
            }
        }

    },

    open: () => {
        const svg = document.getElementById("axanael_paint");
        document.getElementById("axanael").showModal();
        const S = STEP.LIN.S;
        document.getElementById("axanael_depth").max = S.length;
        PAINT.redraw(svg);

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

    fetch: (par, url) => {
        fetch(url)
            .then(response => response.text())
            .then(svgText => {
                par.innerHTML = svgText;
            });
    },
    set_template: (svg) => {
        for (const [k, v] of Object.entries({
            xmlns: SVG.NS,
            width: 100,
            height: 40,
            viewBox: "0 30 100 70",
        })) {
            svg.setAttribute(k, v);
        }
        svg.style.background = D.color.background;
    }

}