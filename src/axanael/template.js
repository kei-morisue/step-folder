import { SVG } from "../flatfolder/svg.js"
import { DRAW as D } from "../defox/draw.js";

import { PAINT } from "./paint.js";


export const TMP = {

    mv: (c_idx, depth, type) => {
        const is_clockwise = false;
        const is_m = type == 1 ? true : type == 3 ? true : false;
        const is_rev = false;
        const pa = { length: 1, offset: 0, crease_index: c_idx, is_rev, is_clockwise, is_m };
        return { depth, type, params: pa };
    },

    sink: (c_idx, depth, is_closed, type) => {
        const is_rev = false;
        const pa = { length: 1, offset: 0, crease_index: c_idx, is_closed, is_rev };
        return { depth, type, params: pa };
    },

    fold_unfold: (crease_index, depth, type) => {
        const is_clockwise = false;
        const is_rev = false;
        const pa = { length: 1, offset: 0, crease_index, is_rev, is_clockwise };
        return { depth, type, params: pa };
    },

    flip: (cx, cy, depth, type) => {
        const is_rev = false;
        const pa = { length: 1, cx, cy, is_rev };
        return { depth, type, params: pa };

    },
    reference_point: (vertex_index, depth, type) => {
        const pa = { length: 1, vertex_index };
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
        svg.id = `template_${type}`;
        svg.onclick = () => { input.click(); };
        svg.appendChild(sym);
        span.appendChild(input);
        span.appendChild(svg);

    },


}