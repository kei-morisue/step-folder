import { SVG } from "../flatfolder/svg.js"
import { M } from "../flatfolder/math.js";

import { N } from "../defox/nath.js";
import { SEG } from "../defox/segment.js";
import { DRAW_LIN } from "../defox/draw_lin.js";
import { SVG3 } from "../defox/svg.js";

import { DRAW as D } from "../defox/draw.js";

import { Z } from "../cyborg/z.js";

export const DRAW = {
    width: {
        arrow: 6,
    },
    color: {
        arrow: "black",
    },


    create_arrow_mv: (s, e, is_m, is_clockwese) => {
        const sym = document.createElementNS(SVG.NS, "path");
        const [x0, y0] = s;
        const [x1, y1] = e;
        const d = M.sub(e, s);
        const [dx, dy] = d;
        const n = is_clockwese ? [dy, -dx] : [-dy, dx];
        const [x, y] = M.add(M.add(s, M.mul(d, .5)), M.mul(n, 0.3));

        sym.setAttribute("d", `M ${x0} ${y0} S ${x} ${y}, ${x1} ${y1}`);
        sym.setAttribute("stroke", DRAW.color.arrow);
        sym.setAttribute("stroke-width", DRAW.width.arrow);
        sym.setAttribute("stroke-linecap", "butt");
        const end = is_m ? "url(#arrow_head_m)" : "url(#arrow_head_v)";
        sym.setAttribute("marker-end", end);
        sym.setAttribute("fill", "transparent");
        return sym;
    },


    create_arrow_sink: (s, e, is_closed) => {
        const sym = document.createElementNS(SVG.NS, "path");
        const [x1, y1] = e;
        const d = M.sub(e, s);
        const u = M.unit(d);
        const [x, y] = M.sub(e, u);

        sym.setAttribute("d", `M ${x} ${y} L ${x1} ${y1}`);
        sym.setAttribute("stroke", DRAW.color.arrow);
        sym.setAttribute("stroke-width", DRAW.width.arrow);
        sym.setAttribute("stroke-linecap", "butt");

        const end = is_closed ? "url(#arrow_head_closed_sink)" : "url(#arrow_head_open_sink)";
        sym.setAttribute("marker-end", end);
        sym.setAttribute("fill", "transparent");
        return sym;
    },

}