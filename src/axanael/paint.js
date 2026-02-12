import { SVG } from "../flatfolder/svg.js"
import { M } from "../flatfolder/math.js"


import { SEG } from "../defox/segment.js"
import { PRJ } from "../defox/project.js"
import { STEP } from "../defox/step.js"
import { N } from "../defox/nath.js"
import { DRAW_LIN } from "../defox/draw_lin.js"
import { SYM } from "../defox/symbol.js"

import { L } from "../cyborg/lath.js"
import { PAINT as P } from "../cyborg/paint.js"

import { GUI } from "./gui.js"

export const PAINT = {
    symbols: [],
    FOLD: undefined,
    S: undefined,
    svg: undefined,
    segs: [],

    svg_selection: undefined,
    mode: 0,
    segment: -1,
    vertex: undefined,

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

    onmove: (e) => {
        const FOLD = PAINT.FOLD;
        const pt = PAINT.get_pointer_loc(e);
        PAINT.segment = L.find_seg(
            pt,
            PAINT.segs,
            FOLD.UA,
            (i) => { return FOLD.UA[i] != "F"; }
        )
        PAINT.hilight_segment();
    },
    onclick: (e) => {
        if (PAINT.segment[0] < 0) { return; }

        const [p_, q_] = PAINT.segs[PAINT.segment[0]];
        const [x, y] = M.sub(q_, p_);
        const q = M.add([x / 2, y / 2], M.add([-y / 2, x / 2], p_));
        const p = M.add(q, [y, -x]);

        const is_clockwise = true;
        const is_m = false;

        const pa = { s: p, e: q, is_clockwise, is_m };
        PAINT.symbols.push({ depth: 0, type: 0, params: pa });
        GUI.set_depths(PAINT.S);
        PAINT.redraw();
    },
    hilight_segment: () => {
        if (PAINT.segment[0] < 0) { return; }
        const s = SVG.SCALE;
        const T = P.get_T();
        const [v1_, v2_] = PAINT.segs[PAINT.segment[0]];
        const v1 = N.transform(T, v1_);
        const v2 = N.transform(T, v2_);
        SVG.clear("axanael_selection");
        const seg_svg = SVG.append(
            "line",
            PAINT.svg_selection,
            {
                x1: v1[0] * s,
                x2: v2[0] * s,
                y1: v1[1] * s,
                y2: v2[1] * s
            });
        const color = "magenta";
        seg_svg.setAttribute("stroke", color);
        seg_svg.setAttribute("stroke-width", 6);
    },

    initialize: (svg, FOLD, S, symbols) => {
        PAINT.svg = svg;
        PAINT.symbols = symbols;
        PAINT.FOLD = FOLD;
        PAINT.S = S;
        PAINT.mode = 0;
        PAINT.segment = -1;
        PAINT.vertex = undefined;
        PAINT.segs = FOLD.UV.map((vs) => M.expand(vs, FOLD.Vf));
    },

    redraw: () => {
        const svg = SVG.clear(PAINT.svg.id);
        const T = STEP.get_transform();
        const c = SEG.clip;
        const d = STEP.depth;
        const symbols = PAINT.symbols
        const FOLD = PAINT.FOLD;
        const S = PAINT.S;
        const i = PRJ.current_idx;
        DRAW_LIN.draw_state(svg, FOLD, S, T, c, d, i, symbols);
        PAINT.svg_selection = SVG.append("g", PAINT.svg, { id: "axanael_selection" });
    }

}