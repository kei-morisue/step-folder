import { Y } from "./y.js"
import { SEG } from "./segment.js";
import { DRAW } from "./draw.js";
import { N } from "./nath.js";
import { SVG3 } from "./svg.js";


import { M } from "../flatfolder/math.js";

import { SVG } from "../flatfolder/svg.js";


export const DRAW_LIN = {
    color: {
        edge: {
            F: "black",
            B: "black",
            V: "black",
            M: "black",
            VV: "red",
            MM: "blue",
            RV: "red",
            RM: "blue",
            UF: "magenta",
        },
    },



    draw_state: (svg, FOLD, S, T, id = 0) => {
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
        for (const [i, top_f] of S_.entries()) {
            const g = SVG.append("g", gg, { id: "face_" + top_f })
            const face = faces[top_f];
            const is_Ff = Ff[top_f];
            SVG.draw_polygons(g, [face], {
                id: true,
                fill: is_Ff ^ is_flip ? DRAW.color.face.top : DRAW.color.face.bottom,
                stroke: DRAW.color.edge["B"],
                stroke_width: DRAW.width.edge["B"]
            });
            const segs = FE[top_f].map((e) => M.expand(EV[e], V_))
            const is_pair = is_Ff ^ is_flip;
            SVG.draw_segments(g, segs, {
                filter: (e) => EA[e] != "B",
                stroke: FE[top_f].map((e) => {
                    if (is_pair) {
                        return DRAW_LIN.color.edge[DRAW.pair(EA[e])];
                    }
                    return DRAW_LIN.color.edge[EA[e]];
                }),
                stroke_width: FE[top_f].map((e) => {
                    const w = DRAW.width.edge[EA[e]]
                    return w ? w : DRAW.width.edge["B"];
                })
            });

            const a = FU[top_f].map((ui) => UA[ui]);
            const lines_clipped = SEG.clip_edges(FU[top_f], UV, V_, Vc, SEG.clip);
            DRAW_LIN.draw_creases(g, lines_clipped, a, is_pair);
        }
    },


    draw_creases: (svg, lines, as, is_pair) => {
        SVG.draw_segments(svg, lines, {
            stroke: as.map((a) => {
                if (is_pair) {
                    return DRAW_LIN.color.edge[DRAW.pair(a)];
                }
                return DRAW_LIN.color.edge[a];
            }),
            stroke_width: as.map((a) => {
                const w = DRAW.width.edge[a]
                return w ? w : DRAW.width.edge["B"];
            })
        });
    },


}