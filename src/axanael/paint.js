import { SVG } from "../flatfolder/svg.js"
import { M } from "../flatfolder/math.js"


import { SEG } from "../defox/segment.js"
import { PRJ } from "../defox/project.js"
import { STEP } from "../defox/step.js"
import { N } from "../defox/nath.js"
import { DRAW_LIN } from "../defox/draw_lin.js"

import { L } from "../cyborg/lath.js"
import { PAINT as P } from "../cyborg/paint.js"

import { GUI } from "./gui.js"
import { TMP } from "./template.js"

export const PAINT = {
    symbols: [],
    FOLD: undefined,
    S: undefined,
    svg: undefined,
    creases: [],
    vertices: [],
    edges: [],


    svg_selection: undefined,
    type: 0,
    segment: -1,
    vertex: undefined,
    onout: () => {
        PAINT.segment = -1;
        PAINT.vertex = undefined;
        PAINT.redraw();
    },

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

        switch (PAINT.type) {
            default:
                PAINT.segment = L.find_seg(
                    pt,
                    PAINT.creases,
                    FOLD.UA,
                    (i) => { return FOLD.UA[i] != "F"; }
                )
                break;
        }
        PAINT.hilight_segment();
    },
    onclick: (e) => {
        const c_idx = PAINT.segment[0];
        if (c_idx < 0) { return; }

        let sym = undefined;
        switch (PAINT.type) {
            case 0:
            case 1:
            case 2:
            case 3:
                sym = TMP.mv(c_idx, 0, PAINT.type);
                break;
            case 4:
                sym = TMP.sink(c_idx, 0, false, PAINT.type);
            case 5:
                sym = TMP.sink(c_idx, 0, true, PAINT.type);
            case 6:
            case 7:
                sym = TMP.fold_unfold(c_idx, 0, PAINT.type);
                break;
            default:
                break;
        }
        PAINT.symbols.push(sym);
        GUI.set_controls(PAINT.S.length);
        PAINT.redraw();
    },
    hilight_segment: () => {
        if (PAINT.segment[0] < 0) { return; }
        const s = SVG.SCALE;
        const T = P.get_T();
        const [v1_, v2_] = PAINT.creases[PAINT.segment[0]];
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

    initialize: (svg, FOLD, S, T, symbols) => {
        PAINT.svg = svg;
        PAINT.symbols = symbols;
        PAINT.FOLD = FOLD;
        PAINT.S = S;
        PAINT.type = 0;
        PAINT.segment = -1;
        PAINT.vertex = undefined;
        const V_ = M.normalize_points(FOLD.Vf).map((v) => N.transform(T, v));

        PAINT.creases = FOLD.UV.map((vs) => M.expand(vs, V_));
        PAINT.edges = FOLD.EV.map((vs) => M.expand(vs, V_));
        PAINT.vertices = V_;
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