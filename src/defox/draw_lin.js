import { Y } from "./y.js"
import { SEG } from "./segment.js";
import { DRAW } from "./draw.js";
import { N } from "./nath.js";


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



    draw_state: (svg, FOLD, L, T) => {
        const is_flip = N.det(T[0]) < 0;
        if (!L) {
            DRAW.draw_xray(FOLD, flip, svg)
            return
        }
        const { V, Ff, EF, FE, EA, FV, EV, VV } = FOLD;
        const V_ = M.normalize_points(V).map((v) => N.transform(T, v));

        const faces = FV.map(v => M.expand(v, V_));

        const gg = SVG.append("g", svg)
        const L_ = is_flip ? L.toReversed() : L
        for (const [i, top_fs] of L_.entries()) {
            for (const [j, top_f] of top_fs.entries()) {
                const g = SVG.append("g", gg, { id: "face_" + top_f })
                const face = faces[top_f];
                const is_Ff = Ff[top_f];
                SVG.draw_polygons(g, [face], {
                    id: true,
                    fill: is_Ff ^ is_flip ? DRAW.color.face.top : DRAW.color.face.bottom,
                    stroke: is_Ff ^ is_flip ? DRAW.color.face.top : DRAW.color.face.bottom,
                    stroke_width: 3
                });
                const segs = FE[top_f].map((e) => M.expand(EV[e], V_))
                const is_pair = is_Ff ^ is_flip;
                SVG.draw_segments(g, segs, {
                    id: true,
                    filter: (i) => EA[FE[top_f][i]] != "F",
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
                if (SEG.clip == 0) {
                    DRAW_LIN.draw_creases(g, segs, EA, FE[top_f]);
                } else {
                    const lines_clipped = SEG.clip_edges(FE[top_f], VV, EA, EV, V_);
                    DRAW_LIN.draw_creases(g, lines_clipped, EA, FE[top_f]);
                }
            }
        }
    },


    draw_creases: (svg, lines, EA, Es) => {
        SVG.draw_segments(svg, lines, {
            id: true,
            stroke: DRAW.color.edge["F"],
            filter: (i) => EA[Es[i]] == "F",
            stroke_width: DRAW.width.edge.F,
        });
    },


}