import { M } from "../flatfolder/math.js";

import { N } from "../defox/nath.js";

import { SVG } from "../flatfolder/svg.js";
import { Z } from "./z.js";

export const DRAW = {
    color: {
        segment: {
            F: "gray",
            B: "black",
            V: "red",
            M: "blue",
            VV: "red",
            MM: "blue",
            RV: "red",
            RM: "blue",
            UF: "green",
            FF: "magenta",
        },
    },

    width: {
        segment: {
            F: 1,
            B: 1,
            V: 1,
            M: 1,
            VV: 6,
            MM: 6,
            RV: 6,
            RM: 6,
            UF: 6,
            FF: 6,
        },
    },
    radius: {
        invalid: 10,
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
    draw_cp: (lines, assigns, svg_cp, T) => {

        const segs = lines.map(([p, q]) => {
            return [N.transform(T, p), N.transform(T, q)];
        });
        let colors = assigns.map(a => DRAW.color.segment[a]);
        let widths = assigns.map(a => DRAW.width.segment[a]);
        SVG.draw_segments(svg_cp, segs, {
            stroke_width: widths,
            stroke: colors,
            id: true,
        });

    },


    draw_xray: (FOLD, is_flip, svg) => {
        const { FV, Vf } = FOLD
        const P = DRAW.transform_points(Vf, is_flip, 0, true)
        const F = FV.map(f => M.expand(f, P));
        SVG.draw_polygons(svg, F, { opacity: 0.05 });
    },

    draw_local_isses: (V, EA, EV, svg) => {
        const VK = Z.get_VK(EV, EA, V);
        let is_invalid = false;
        for (const [i, vk] of VK.entries()) {
            if (Math.abs(vk) > 1e-6) {
                const [cx, cy] = M.mul(V[i], SVG.SCALE);
                const r = DRAW.radius.invalid;
                const c = SVG.append("circle", svg, { cx, cy, r, "fill": "green" });
                is_invalid = true;
            }
        }
        return [VK, is_invalid];
    },

}