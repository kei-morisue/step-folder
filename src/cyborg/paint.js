import { SVG } from "../flatfolder/svg.js";
import { M } from "../flatfolder/math.js";
import { N } from "../defox/nath.js";


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
    vs: [],
    selection: undefined,

    initialize: (FOLD, svg) => {
        const { V, EV, EA, UA, UV } = FOLD;
        PAINT.FOLD = FOLD;
        PAINT.segs = EV.map((vs) => {
            return M.expand(vs, V);
        });
        PAINT.segs = PAINT.segs.concat(UV.map((vs) => {
            return M.expand(vs, V);
        }));

        PAINT.vs = V;
        PAINT.assigns = EA.concat(UA);
        PAINT.svg = svg;
    },

    redraw: () => {
        DRAW.draw_cp(PAINT.FOLD, SVG.clear(PAINT.svg.id));
        PAINT.selection = SVG.append("g", PAINT.svg, { id: "selection" });
    },

    onmove: (e) => {
        const svg = document.getElementById("cpedit");
        var pt = svg.createSVGPoint();
        pt.x = e.clientX;
        pt.y = e.clientY;
        const p = pt.matrixTransform(svg.getScreenCTM().inverse());
        const b = SVG.MARGIN;
        const w = SVG.SCALE;
        const x0 = ((p.x) / w);
        const y0 = ((p.y) / w);

        const p0 = [x0, y0];
        const label = document.getElementById("pt_loc");
        label.innerHTML = "[" + (x0.toFixed(8)) + ", " + (y0.toFixed(8)) + "]";

        PAINT.hilight(PAINT.find_seg(p0), PAINT.find_v(p0));


        return [p.x, p.y];
    },

    hilight: ([idx, min_l], [idx_v, min_l_v]) => {
        SVG.clear("selection");
        if (min_l < 0.1) {
            const [[x1, y1], [x2, y2]] = N.matmul(PAINT.segs[idx], SVG.SCALE);
            const seg_svg = SVG.append("line", PAINT.selection, { x1, x2, y1, y2 });
            seg_svg.setAttribute("stroke", "magenta");
            seg_svg.setAttribute("stroke-width", 3);
        }

        if (min_l_v < 0.1) {
            const [cx, cy] = M.mul(PAINT.vs[idx_v], SVG.SCALE);
            const c = SVG.append("circle", PAINT.selection, { cx, cy, r: 5, "fill": "magenta" });
        }

    },

    find_seg: (p0) => {
        let min_l = Infinity;
        let idx = -1;
        for (const [i, seg] of PAINT.segs.entries()) {
            const l = L.dist(p0, seg);
            if (min_l > l) {
                min_l = l;
                idx = i;
            }
        }
        return [idx, min_l];
    },

    find_v: (p0) => {
        let min_l = Infinity;
        let idx = -1;
        for (const [i, v] of PAINT.vs.entries()) {
            const l = M.mag(M.sub(p0, v));
            if (min_l > l) {
                min_l = l;
                idx = i;
            }
        }
        return [idx, min_l];
    },

    onclick: (e) => {
        const label = document.getElementById("pt_loc");
        const bb = M.bounding_box(PAINT.FOLD.V);
        label.innerHTML = "[" + bb[0][0] + ", " + bb[0][1] + "]"
            + "[" + bb[1][0] + ", " + bb[1][1] + "]";
    },
}