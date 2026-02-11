import { SVG } from "../flatfolder/svg.js"
import { SEG } from "../defox/segment.js"
import { PRJ } from "../defox/project.js"
import { STEP } from "../defox/step.js"

import { DRAW } from "./draw.js"

export const PAINT = {
    depth: 0,
    svg: undefined,

    get_pointer_loc: (e) => {
        const svg = PAINT.svg;
        var pt = svg.createSVGPoint();
        pt.x = e.clientX;
        pt.y = e.clientY;
        const p = pt.matrixTransform(svg.getScreenCTM().inverse());
        const w = SVG.SCALE;
        const x0 = ((p.x) / w);
        const y0 = ((p.y) / w);
        return [x0, y0];
    },

    initialize: (FOLD, S) => {

    },

    redraw: (svg) => {
        const i = PRJ.current_idx
        const FOLD = PRJ.steps[i].fold_d;
        const S = STEP.LIN.S;

        const T = STEP.get_transform();
        const c = SEG.clip;
        const d = PAINT.depth;
        DRAW.draw_state(svg, FOLD, S, T, c, d, i);
    }

}