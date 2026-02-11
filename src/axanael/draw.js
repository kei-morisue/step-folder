import { SVG } from "../flatfolder/svg.js"
import { M } from "../flatfolder/math.js";

import { N } from "../defox/nath.js";
import { SEG } from "../defox/segment.js";
import { DRAW_LIN } from "../defox/draw_lin.js";
import { DRAW as D } from "../defox/draw.js";

import { Z } from "../cyborg/z.js";

export const DRAW = {
    color: {
        segment: {
            F: "gray",
            B: "black",
            V: "red",
            M: "blue",
            // F: "rgb(6, 200, 200)",
            // B: "rgb(210, 210, 210)",
            // V: "rgb(229, 115, 115)",
            // M: "rgb(33, 150, 243)",
        },
        kawasaki: "rgb(6,200,200)",
    },

    draw_state: (svg, FOLD, S, T, clip_c, depth, id = 0) => {
        DRAW_LIN.draw_state(SVG.clear(svg.id), FOLD, S, T, clip_c, depth, id);
    },




}