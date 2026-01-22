import { Y } from "./y.js";
import { N } from "./nath.js";
import { SEG } from "./segment.js";
import { STEP } from "./step.js";
import { SVG3 } from "./svg.js";

import { M } from "../flatfolder/math.js";
import { X } from "../flatfolder/conversion.js";
import { IO } from "../flatfolder/io.js";
import { SVG } from "../flatfolder/svg.js";


export const DRAW = {
    color: {
        background: "#0F0",
        face: {
            top: "#888",
            bottom: "#FFF",
        },
        edge: {
            U: "black",
            F: "black",
            B: "black",
            V: "red",
            M: "blue",
            VV: "red",
            MM: "blue",
            RV: "red",
            RM: "blue",
            UF: "magenta",
        },

        segment: {
            F: "gray",
            B: "black",
            V: "red",
            M: "blue",
            VV: "magenta",
            MM: "cyan",
            RV: "red",
            RM: "blue",
            UF: "green",
        },
        rand: [
            "lightpink", "lightgreen", "lightskyblue", "gold",
            "lightsalmon", "powderblue", "lavender", "sandybrown"
        ],
    },

    width: {
        edge: {
            F: 1,
            B: 3,
            VV: 6,
            MM: 6,
            RV: 3,
            RM: 3,
            UF: 3,
        },
        segment: {
            F: 1,
            B: 1,
            V: 1,
            M: 1,
            VV: 3,
            MM: 3,
            RV: 3,
            RM: 3,
            UF: 3,
        },
        clip_path: {
            body: 8,
        }
    },
    pair: (d) => {
        switch (d) {
            case "V":
                return "M";
            case "M":
                return "V";
            case "VV":
                return "MM";
            case "MM":
                return "VV";
            case "RV":
                return "RM";
            case "RM":
                return "RV";
            default:
                return d;
        }
    },
    draw_cp: (FOLD, svg_cp, text = false) => {

        const { V, FV, EV, EA } = FOLD;

        const faces = FV.map(F => M.expand(F, V));
        const lines = EV.map(E => M.expand(E, V));
        const colors = EA.map(a => DRAW.color.segment[a]);
        const widths = EA.map(a => DRAW.width.segment[a]);
        const g1 = SVG.append("g", svg_cp, { id: "flat_f" });
        SVG.draw_polygons(g1, faces, { fill: "white", id: true });
        const g2 = SVG.append("g", svg_cp, { id: "flat_e" });
        SVG.draw_segments(g2, lines, { stroke_width: widths, stroke: colors, id: true });


        if (text) {
            const cp_text = SVG.append("g", svg_cp, { id: "cp_text" });
            DRAW.draw_text(FOLD, cp_text)
        }

    },
    draw_state: (svg, FOLD, CELL, STATE, T, id = 0) => {
        const det = N.det(T[0]);
        const is_flip = det < 0
        if (STATE == undefined) {
            DRAW.draw_xray(FOLD, is_flip, svg)
            return
        }
        const { Ff, EF, FE, EA } = FOLD;
        const { P, PP, CP, CF, SP, SC, SE } = CELL;
        const { Q, Ctop, Cbottom, L, Ccolor, Ccolor_bottom } = STATE;
        const color = is_flip ? Ccolor_bottom : Ccolor;
        const SD = Y.Ctop_SC_SE_EF_Ff_EA_FE_2_SD(is_flip ? Cbottom : Ctop, SC, SE, EF, Ff, EA, FE);
        const Q_ = M.normalize_points(Q).map((v) => N.transform(T, v));
        const cells = CP.map(V => M.expand(V, Q_));

        const gg = SVG.append("g", svg)

        if (Math.abs(det) > 1) {
            SVG3.draw_clip_path(svg, gg, id);
        }

        const fold_c = SVG.append("g", gg, { id: "fold_c" });
        const fold_s_crease = SVG.append("g", gg, { id: "fold_s_crease" });
        const fold_s_edge = SVG.append("g", gg, { id: "fold_s_edge" });

        SVG.draw_polygons(fold_c, cells, {
            id: true,
            fill: color.map(b => b ^ is_flip ? DRAW.color.face.top : DRAW.color.face.bottom),
            stroke: color.map(b => b ^ is_flip ? DRAW.color.face.top : DRAW.color.face.bottom),
            stroke_width: 3
        });
        const lines = SP.map((ps) => M.expand(ps, Q_));
        SVG.draw_segments(fold_s_crease, lines, {
            id: true, stroke: SD.map((d, i) => {
                const [c0, c1] = SC[i];

                if (color[c0] && color[c1]) {
                    return DRAW.color.edge[DRAW.pair(d)];
                }
                return DRAW.color.edge[d];
            }),
            filter: (i) => SD[i] == "MM" || SD[i] == "VV" || SD[i] == "U" || SD[i] == "RM" || SD[i] == "RV",
            stroke_width: SD.map((d, i) => {
                return DRAW.width.edge[d];
            }),
        });
        if (SEG.clip == 0) {
            DRAW.draw_creases(fold_s_crease, lines, SC, SD, Ccolor);
        } else {
            const lines_clipped = SEG.clip_lines(lines, CELL, SD, Q_);
            DRAW.draw_creases(fold_s_crease, lines_clipped, SC, SD, Ccolor);
        }

        SVG.draw_segments(fold_s_edge, lines, {
            id: true, stroke: DRAW.color.edge.B,
            filter: (i) => SD[i][0] == "B",
            stroke_width: DRAW.width.edge.B,
        });

    },

    draw_creases: (svg, lines, SC, SD, Ccolor) => {
        SVG.draw_segments(svg, lines, {
            id: true, stroke: SD.map((d, i) => {
                const [c0, c1] = SC[i];

                if (Ccolor[c0] && Ccolor[c1]) {
                    return DRAW.color.edge[DRAW.pair(d)];
                }
                return DRAW.color.edge[d];
            }),
            filter: (i) => SD[i] == "F",
            stroke_width: DRAW.width.edge.F,
        });
    },

    draw_text: (FOLD, group) => {
        const G = {};
        for (const id of ["f", "e", "v"]) {
            G[id] = SVG.append("g", group, { id: `text_${id}` });
        }
        const { Vf, EV, EA, FV } = FOLD;
        const F = FV.map(f => M.expand(f, Vf));
        const shrunk = F.map(f => {
            const c = M.centroid(f);
            return f.map(p => M.add(M.mul(M.sub(p, c), 0.5), c));
        });
        SVG.draw_polygons(G.f, shrunk, { text: true, opacity: 0.2 });
        const line_centers = EV.map(l => M.centroid(M.expand(l, Vf)));
        const colors = "red";
        SVG.draw_points(G.e, line_centers, { text: true, fill: colors });
    },

    draw_group_text: (FOLD, CELL, svg, T) => {
        const { Vf, FV } = FOLD;
        const { GB, BF, BI } = CELL
        const m = [0.5, 0.5];
        const Q = Vf.map((v) => N.transform(T, v));

        const P = GB.map((bs, Gi) => {
            if (Gi == 0) {
                return [2, 2]
            }
            const Fs = bs.map((b) => {
                return M.decode(BF[b])
            })
            const centroids = Fs.map(Fi => {

                return M.centroid(M.expand(FV[Fi[0]].concat(FV[Fi[1]]), Q));
            });
            return M.centroid(centroids);
        })
        const g = SVG.append("g", svg, { id: `group_text_` });
        const colors = "green";

        SVG.draw_points(g, P, {
            id: true,
            text: true,
            fill: colors,
            r: 60,
            opacity: 0.5,
            text_size: 40,
        });
        P.map((p, g) => {
            const el = document.getElementById("group_text_" + g);
            el.onclick = (e) => {
                const { GB, BF, GA, GI } = STEP.CELL0
                const { Ff } = STEP.FOLD0
                const a = (GI[g] + 1) % GA[g].length;
                STEP.CELL0.GI[g] = a
                STEP.FOLD0.FO = Y.BF_GB_GA_GI_Ff_2_FO(BF, GB, GA, GI, Ff)
                STEP.update_states()
                STEP.update_dist();
            };
        });
    },

    draw_xray: (FOLD, is_flip, svg) => {
        const { FV, V } = FOLD
        const P = DRAW.transform_points(V, is_flip, 0, true)
        const F = FV.map(f => M.expand(f, P));
        SVG.draw_polygons(svg, F, { opacity: 0.05 });
    },

    transform_points: (P, is_flip, rot, norm = true) => {
        if (norm) { P = M.normalize_points(P); }
        const ri = rot / 90;
        const [cos, sin] = [[1, 0], [0, -1], [-1, 0], [0, 1]][ri];
        const m = [0.5, 0.5];
        return P.map(p => M.add(M.rotate_cos_sin(M.sub(p, m), cos, sin), m))
            .map(p => (is_flip ? M.add(M.refX(M.sub(p, m)), m) : p));
    },
}