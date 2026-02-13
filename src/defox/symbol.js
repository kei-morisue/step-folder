import { SVG } from "../flatfolder/svg.js"
import { M } from "../flatfolder/math.js";

import { N } from "../defox/nath.js";
import { SEG } from "../defox/segment.js";
import { DRAW_LIN } from "../defox/draw_lin.js";
import { SVG3 } from "../defox/svg.js";

import { DRAW as D } from "../defox/draw.js";

import { Z } from "../cyborg/z.js";
import { STEP } from "./step.js";

export const SYM = {
    width: {
        arrow: 3,
    },
    color: {
        arrow: "black",
    },
    get_cross: (p, q) => {
        const [x, y] = M.sub(q, p);
        const e = M.add([x / 2, y / 2], M.add([-y / 2, x / 2], p));
        const s = M.add(e, [y, -x]);
        return [s, e];
    },

    create: (type, params, FOLD, T) => {
        const i = params.crease_index;

        const { Vf, UV } = FOLD;
        const V_ = M.normalize_points(Vf).map((v) => N.transform(T, v));

        const [p, q] = M.expand(UV[i], V_);
        let [s, e] = SYM.get_cross(p, q);
        if (params.is_rev) {
            [s, e] = [e, s];
        }
        switch (type) {
            case 0:
                return SYM.create_arrow_mv(s, e, false, params.is_clockwise, false);
            case 1:
                return SYM.create_arrow_mv(s, e, true, params.is_clockwise, false);
            case 2:
                return SYM.create_arrow_mv(s, e, false, params.is_clockwise, true);
            case 3:
                return SYM.create_arrow_mv(s, e, true, params.is_clockwise, true);
            case 4:
                return SYM.create_arrow_sink(s, e, false);
            case 5:
                return SYM.create_arrow_sink(s, e, true);
            default:
                return undefined;
        }
    },

    create_arrow_mv: (s, e, is_m, is_clockwese, is_sqeezed) => {
        const k = SVG.SCALE;
        const sym = document.createElementNS(SVG.NS, "path");
        const [x0, y0] = M.mul(s, k);
        const [x1, y1] = M.mul(e, k);
        const d = M.sub([x1, y1], [x0, y0]);
        const [dx, dy] = d;
        const n = is_clockwese ? [dy, -dx] : [-dy, dx];
        const [x, y] = M.add(M.add([x0, y0], M.mul(d, is_sqeezed ? -.5 : .5)), M.mul(n, 0.5));

        sym.setAttribute("d", `M ${x0} ${y0} S ${x} ${y}, ${x1} ${y1}`);
        sym.setAttribute("stroke", SYM.color.arrow);
        sym.setAttribute("stroke-width", SYM.width.arrow);
        sym.setAttribute("stroke-linecap", "butt");
        const end = is_m ? "url(#arrow_head_m)" : "url(#arrow_head_v)";
        sym.setAttribute("marker-end", end);
        sym.setAttribute("fill", "transparent");
        return sym;
    },


    create_arrow_sink: (s, e, is_closed) => {
        const sym = document.createElementNS(SVG.NS, "path");
        const k = SVG.SCALE;
        const [x1, y1] = M.mul(e, k);
        const d = M.sub([x1, y1], M.mul(s, k));
        const u = M.unit(d);
        const [x, y] = M.add([x1, y1], u);

        sym.setAttribute("d", `M ${x} ${y} L ${x1} ${y1}`);
        sym.setAttribute("stroke", SYM.color.arrow);
        sym.setAttribute("stroke-width", SYM.width.arrow);
        sym.setAttribute("stroke-linecap", "butt");

        const end = is_closed ? "url(#arrow_head_closed_sink)" : "url(#arrow_head_open_sink)";
        sym.setAttribute("marker-end", end);
        sym.setAttribute("fill", "transparent");
        return sym;
    },

}