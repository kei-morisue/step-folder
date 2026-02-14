import { SVG } from "../flatfolder/svg.js"
import { M } from "../flatfolder/math.js";

import { N } from "../defox/nath.js";
import { SEG } from "../defox/segment.js";
import { DRAW_LIN } from "../defox/draw_lin.js";
import { SVG3 } from "../defox/svg.js";
import { DRAW as D } from "../defox/draw.js";
import { SYM } from "../defox/symbol.js";

import { Z } from "../cyborg/z.js";

import { PAINT } from "./paint.js";


export const TMP = {

    mv: (c_idx, depth, type) => {
        const is_clockwise = false;
        const is_m = type == 1 ? true : type == 3 ? true : false;
        const is_rev = false;
        const pa = { crease_index: c_idx, is_rev, is_clockwise, is_m };
        return { depth, type, params: pa };
    },

    sink: (c_idx, depth, is_closed, type) => {
        const is_rev = false;
        const pa = { crease_index: c_idx, is_closed, is_rev };
        return { depth, type, params: pa };
    },

    fold_unfold: (crease_index, depth, type) => {
        const is_clockwise = false;
        const is_rev = false;
        const pa = { crease_index, is_rev, is_clockwise };
        return { depth, type, params: pa };
    },

    flip: (cx, cy, depth, type) => {
        const is_rev = false;
        const pa = { cx, cy, is_rev };
        return { depth, type, params: pa };

    },
    reference_point: ([cx, cy], depth, type) => {
        const pa = { cx, cy };
        return { depth, type, params: pa };

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