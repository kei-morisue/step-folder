import { SVG } from "../flatfolder/svg.js"
import { M } from "../flatfolder/math.js";

import { N } from "../defox/nath.js";
import { SEG } from "../defox/segment.js";
import { DRAW_LIN } from "../defox/draw_lin.js";
import { SVG3 } from "../defox/svg.js";

import { DRAW as D } from "../defox/draw.js";

import { Z } from "../cyborg/z.js";

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
}