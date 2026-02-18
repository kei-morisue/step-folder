import { Y } from "./y.js"
import { SYM } from "./symbol.js"
import { SEG } from "./segment.js";
import { DRAW } from "./draw.js";
import { N } from "./nath.js";
import { SVG3 } from "./svg.js";


import { M } from "../flatfolder/math.js";

import { SVG } from "../flatfolder/svg.js";


export const DRAW_LIN = {
    draw_creases: (svg, creases, assigns, is_pair) => {
        SVG.draw_segments(svg, creases, {
            stroke: assigns.map((a) => {
                if (is_pair) {
                    return DRAW.color.edge[DRAW.pair(a)];
                }
                return DRAW.color.edge[a];
            }),
            stroke_width: assigns.map((a) => {
                const w = DRAW.width.edge[a]
                return w ? w : DRAW.width.edge["B"];
            }),
        });
    },

    draw_face: (svg, face, edges, assigns, is_pair) => {
        SVG.draw_polygons(svg, [face], {
            id: true,
            fill: is_pair ? DRAW.color.face.top : DRAW.color.face.bottom,
            stroke: DRAW.color.edge["B"],
            stroke_width: DRAW.width.edge["B"]
        });
        SVG.draw_segments(svg, edges, {
            filter: (e) => assigns[e] == "UF" || assigns[e] == "RM" || assigns[e] == "RV",
            stroke: assigns.map((a) => {
                if (is_pair) {
                    return DRAW.color.edge[DRAW.pair(a)];
                }
                return DRAW.color.edge[a];
            }),
            stroke_width: assigns.map((a) => {
                const w = DRAW.width.edge[a]
                return w;
            }),
            filter: (i) => {
                if (DRAW.uncreases) {
                    return true;
                }
                const a = assigns[i];
                return a != "RM" && a != "RV" && a != "UF";
            }
        });
    },



    draw_state: (svg, FOLD, S, T, clip_c, depth, id = 0, symbols = []) => {
        const det = N.det(T[0]);
        const is_flip = det < 0;
        if (!S) {
            DRAW.draw_xray(FOLD, flip, svg);
            return
        }
        const { Vf, Ff, FE, EA, FV, EV, Vc, UV, FU, UA } = FOLD;
        const V_ = M.normalize_points(Vf).map((v) => N.transform(T, v));
        const faces = FV.map(v => M.expand(v, V_));
        const S_ = is_flip ? S.toReversed() : S

        const g_step = SVG.append("g", svg, { id: `${svg.id}_${id}` });
        const g_clip = SVG.append("g", g_step);
        if (Math.abs(det) > 1) {
            SVG3.draw_clip_path(g_step, g_clip, .5 * SVG.SCALE, id);

        }
        const g_mask = SVG.append("g", g_step)
        if (depth > 0) {
            SVG3.draw_mask(g_step, g_mask, .2 * SVG.SCALE, Math.abs(det) > 1, id);
        }


        const F_sym = FV.map((_) => { return []; });
        for (const [si, s] of symbols.entries()) {
            const fi = S_.length - s.depth - 1;
            F_sym[fi].push(s);
        }
        for (let i = 0; i < S_.length; i++) {
            const face_idx = S_[i];
            const par = i > S_.length - depth - 1 ? g_mask : g_clip;
            const g = SVG.append("g", par, { id: "face_" + face_idx })
            const face = faces[face_idx];
            const is_pair = Ff[face_idx] ^ is_flip;
            const edges = FE[face_idx].map((e) => M.expand(EV[e], V_));
            const assigns = FE[face_idx].map((e) => EA[e]);

            DRAW_LIN.draw_face(g, face, edges, assigns, is_pair);

            const a = FU[face_idx].map((ui) => UA[ui]);
            const creases = SEG.clip_edges(FU[face_idx], UV, V_, Vc, clip_c);
            DRAW_LIN.draw_creases(g, creases, a, is_pair);

            const ss = F_sym[i];
            if (ss) {
                for (const s of ss) {
                    DRAW.draw_symbol(g, s, FOLD, T);
                }
            }

        }

    },




}