import { SVG } from "../flatfolder/svg.js"
import { DRAW as D } from "../defox/draw.js";

import { PAINT } from "./paint.js";
import { PRJ } from "../defox/project.js";


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
        const offset = 0;
        const pa = { length: 1, cx, cy, is_rev, offset };
        return { depth, type, params: pa };

    },
    reference_point: (vertex_index, depth, type) => {
        const pa = { length: 1, vertex_index };
        return { depth, type, params: pa };

    },

    pleat: (crease_index, depth, type) => {
        const is_clockwise = false;
        const is_rev = false;
        const pa = { length: 1, offset: 0, crease_index, is_rev, is_clockwise };
        return { depth, type, params: pa };
    },

    inside_reverse: (vertex_index, vertex_index_1, depth, type) => {
        const is_clockwise = false;
        const offset = 0;
        const pa = { length: 1, vertex_index, vertex_index_1, offset, is_clockwise };
        return { depth, type, params: pa };
    },

    angle_bisector: (vertex_index, vertex_index_1, vertex_index_2, depth, type) => {
        const offset = 0;
        const pa = { length: 1, vertex_index, vertex_index_1, vertex_index_2, offset };
        return { depth, type, params: pa };
    },
    right_angle: (vertex_index, vertex_index_1, vertex_index_2, depth, type) => {
        const offset = 0;
        const length = 1;
        const params = { length, vertex_index, vertex_index_1, vertex_index_2, offset };
        return { depth, type, params };
    },

    repeat: (crease_index, depth, type) => {
        const offset = 0;
        const length = 1;
        const is_rev = false;
        const cp0 = PRJ.steps[0].fold_cp;
        const cp1 = PRJ.steps[0].fold_cp;
        const params = { is_rev, length, crease_index, offset, cp0, cp1 };
        return { depth, type, params };
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
            PAINT.reset();
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