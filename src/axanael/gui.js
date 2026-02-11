import { SVG } from "../flatfolder/svg.js"
import { STEP } from "../defox/step.js"
import { DRAW as D } from "../defox/draw.js"
import { SEG } from "../defox/segment.js"
import { PRJ } from "../defox/project.js"

import { DRAW } from "./draw.js"
import { PAINT } from "./paint.js"


export const GUI = {
    startup: () => {
        document.getElementById("axanael").style.background = D.color.background;
        document.getElementById("axanael_open").onclick = GUI.open;
        document.getElementById("axanael_close").onclick = GUI.close;
        document.getElementById("axanael_discard").onclick = GUI.discard;
        const svg = document.getElementById("axanael_paint");
        GUI.set_svg(svg.id);


    },

    open: () => {
        const svg = document.getElementById("axanael_paint");
        document.getElementById("axanael").showModal();
        const i = PRJ.current_idx
        const FOLD = PRJ.steps[i].fold_d;
        const S = STEP.LIN.S;
        document.getElementById("axanael_depth").max = S.length;

        const T = STEP.get_transform();
        const c = SEG.clip;
        const d = PAINT.depth;
        DRAW.draw_state(svg, FOLD, S, T, c, d, i);

    },
    close: () => {
        document.getElementById("axanael").close();

    },
    discard: () => {
        document.getElementById("axanael").close();

    },

    set_svg: (id) => {
        const [b, s] = [SVG.MARGIN, SVG.SCALE];

        const svg = document.getElementById(id);
        for (const [k, v] of Object.entries({
            xmlns: SVG.NS,
            height: s,
            width: s,
            viewBox: [-b, -b, s + 2 * b, s + 2 * b].join(" "),
        })) {
            svg.setAttribute(k, v);
        }
    },

}