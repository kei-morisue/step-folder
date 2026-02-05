import { SVG } from "../flatfolder/svg.js";
import { M } from "../flatfolder/math.js";


import { PRJ } from "../defox/project.js";
import { DRAW as DD } from "../defox/draw.js";


import { L } from "./lath.js";
import { DRAW } from "./draw.js";
import { STEP } from "../defox/step.js";


export const PAINT = {
    FOLD: undefined,
    segs: [],
    assigns: [],
    svg: undefined,

    initialize: (FOLD, svg) => {
        const { V, EV, EA, UA, UV } = FOLD;
        PAINT.FOLD = FOLD;
        PAINT.segs = EV.map((vs) => {
            return M.expand(vs, V);
        });
        PAINT.segs = PAINT.segs.concat(UV.map((vs) => {
            return M.expand(vs, V);
        }));

        PAINT.assigns = EA.concat(UA);
        PAINT.svg = svg;
    },

    draw: (svg) => {
        DRAW.draw_cp(PAINT.FOLD, svg);
    },

    onmove: (e) => {
        const svg = document.getElementById("cpedit");
        var pt = svg.createSVGPoint();
        pt.x = e.clientX;
        pt.y = e.clientY;
        const p = pt.matrixTransform(svg.getScreenCTM().inverse());
        const w = SVG.SCALE + 2 * SVG.MARGIN;
        const b = SVG.MARGIN / SVG.SCALE;
        const x0 = (p.x / w + b);
        const y0 = (p.y / w + b);

        const p0 = [x0, y0];
        const label = document.getElementById("pt_loc");
        label.innerHTML = "[" + x0 + ", " + y0 + "]";


        let min_l = Infinity;
        let idx = -1;
        for (const [i, seg] of PAINT.segs.entries()) {
            const seg_svg = document.getElementById(`${svg.id}${i}`);
            seg_svg.setAttribute("stroke-width", DD.width.segment.F);
            const l = L.dist(p0, seg);
            if (min_l > l) {
                min_l = l;
                idx = i;
            }
        }

        if (min_l < 0.1) {
            const seg_svg = document.getElementById(`${svg.id}${idx}`);
            seg_svg.setAttribute("stroke-width", 3);
        }
        return [p.x, p.y];
    },

    onclick: (e) => {
        const label = document.getElementById("pt_loc");
        const bb = M.bounding_box(FOLD.V);
        label.innerHTML = "[" + bb[0][0] + ", " + bb[0][1] + "]"
            + "[" + bb[1][0] + ", " + bb[1][1] + "]";
    },
}