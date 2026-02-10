import { Y } from "./y.js"
import { SEG } from "./segment.js";
import { DRAW } from "./draw.js";
import { N } from "./nath.js";
import { SVG3 } from "./svg.js";


import { M } from "../flatfolder/math.js";

import { SVG } from "../flatfolder/svg.js";


export const DRAW_LIN = {


    draw_state: (svg, FOLD, S, T, clip_c, depth, id = 0) => {
        const det = N.det(T[0]);
        const is_flip = det < 0;
        if (!S) {
            DRAW.draw_xray(FOLD, flip, svg)
            return
        }
        const { Vf, Ff, EF, FE, EA, FV, EV, Vc, UV, FU, UA } = FOLD;
        const V_ = M.normalize_points(Vf).map((v) => N.transform(T, v));

        const faces = FV.map(v => M.expand(v, V_));

        const gg = SVG.append("g", svg)

        if (Math.abs(det) > 1) {
            SVG3.draw_clip_path(svg, gg, id);

        }

        const S_ = is_flip ? S.toReversed() : S
        const opa = 3 / (depth + 1);
        for (const [i, face_idx] of S_.entries()) {
            const g = SVG.append("g", gg, { id: "face_" + face_idx })
            const face = faces[face_idx];
            const is_Ff = Ff[face_idx];
            if (i + depth > S_.length) {
                SVG.draw_polygons(g, [face], {
                    id: true,
                    fill: `rgba(0, 0, 0, ${opa})`,
                });
                continue;
            }
            SVG.draw_polygons(g, [face], {
                id: true,
                fill: is_Ff ^ is_flip ? DRAW.color.face.top : DRAW.color.face.bottom,
                stroke: DRAW.color.edge["B"],
                stroke_width: DRAW.width.edge["B"]
            });
            const segs = FE[face_idx].map((e) => M.expand(EV[e], V_));
            const assigns = FE[face_idx].map((e) => EA[e]);
            const is_pair = is_Ff ^ is_flip;
            SVG.draw_segments(g, segs, {
                filter: (e) => assigns[e] == "UF" || assigns[e] == "RM" || assigns[e] == "RV",
                stroke: FE[face_idx].map((e) => {
                    if (is_pair) {
                        return DRAW.color.edge[DRAW.pair(EA[e])];
                    }
                    return DRAW.color.edge[EA[e]];
                }),
                stroke_width: FE[face_idx].map((e) => {
                    const w = DRAW.width.edge[EA[e]]
                    return w;
                })
            });

            const a = FU[face_idx].map((ui) => UA[ui]);
            const lines_clipped = SEG.clip_edges(FU[face_idx], UV, V_, Vc, clip_c);
            DRAW_LIN.draw_creases(g, lines_clipped, a, is_pair);
        }
    },


    draw_creases: (svg, lines, as, is_pair) => {
        SVG.draw_segments(svg, lines, {
            stroke: as.map((a) => {
                if (is_pair) {
                    return DRAW.color.edge[DRAW.pair(a)];
                }
                return DRAW.color.edge[a];
            }),
            stroke_width: as.map((a) => {
                const w = DRAW.width.edge[a]
                return w ? w : DRAW.width.edge["B"];
            })
        });
    },


}