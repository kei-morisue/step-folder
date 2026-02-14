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
import { K } from "./kath.js"

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

    radius: {
        bound: 10,
    },
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
            case 9:
                PAINT.vertex = K.find_v(pt, PAINT.vertices, PAINT.radius.bound);
                PAINT.hilight_vertex();
                break;
            default:
                PAINT.segment = L.find_seg(
                    pt,
                    PAINT.creases,
                    FOLD.UA,
                    (i) => { return FOLD.UA[i] != "F"; }
                )
                PAINT.hilight_segment();
                break;
        }
    },
    onclick: (e) => {
        const c_idx = PAINT.segment[0];
        const v_idx = PAINT.vertex;

        let sym = undefined;
        switch (PAINT.type) {
            case 0:
            case 1:
            case 2:
            case 3:
                if (c_idx < 0) { return; }
                sym = TMP.mv(c_idx, 0, PAINT.type);
                break;
            case 4:
                if (c_idx < 0) { return; }
                sym = TMP.sink(c_idx, 0, false, PAINT.type);
            case 5:
                if (c_idx < 0) { return; }
                sym = TMP.sink(c_idx, 0, true, PAINT.type);
            case 6:
            case 7:
                if (c_idx < 0) { return; }
                sym = TMP.fold_unfold(c_idx, 0, PAINT.type);
                break;
            case 8:
                sym = TMP.flip(.95, .5, 0, PAINT.type);
                break;
            case 9:
                sym = TMP.reference_point(v_idx, 0, PAINT.type);
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
    hilight_vertex: () => {
        if (PAINT.vertex < 0) { return; }
        const s = SVG.SCALE;
        const T = P.get_T();
        const v = N.transform(T, PAINT.vertices[PAINT.vertex]);
        SVG.clear("axanael_selection");
        const seg_svg = SVG.append(
            "circle",
            PAINT.svg_selection,
            {
                cx: v[0] * s,
                cy: v[1] * s,
                r: 10,
                fill: "transparent",
            });
        const color = "magenta";
        seg_svg.setAttribute("stroke", color);
        seg_svg.setAttribute("stroke-width", 4);
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
        if (STEP.CELL_D) {
            const CELL = STEP.CELL_D;
            const STATE = Y.FOLD_CELL_2_STATE(FOLD, CELL);
            DRAW.draw_state(svg, FOLD, CELL, STATE, T, SEG.clip, STEP.id, symbols ?? []);
            return;
        }
        DRAW_LIN.draw_state(svg, FOLD, S, T, c, d, i, symbols);
        PAINT.svg_selection = SVG.append("g", PAINT.svg, { id: "axanael_selection" });
    }

}