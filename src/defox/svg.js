import { M } from "../flatfolder/math.js";
import { SVG } from "../flatfolder/svg.js";
import { DRAW } from "./draw.js";

export const SVG3 = {   // DRAWING
    INI_SCALE: 1000,

    reset: () => {
        SVG.SCALE = SVG3.INI_SCALE;
    },

    draw_clip_path: (svg, gg, r, id) => {
        const cp = SVG.append("clipPath", gg);
        cp.setAttribute("id", "cpath_" + svg.id + "_" + id);
        SVG.append("circle", cp, {
            cx: .5 * SVG.SCALE, cy: .5 * SVG.SCALE, r,
        });

        gg.setAttribute("clip-path", "url(#cpath_" + svg.id + "_" + id + ")");
        return SVG.append("circle", svg, {
            cx: .5 * SVG.SCALE, cy: .5 * SVG.SCALE, r,
            "fill": "none",
            "stroke": "black",
            "stroke-width": DRAW.width.clip_path.body,
        });
    },

    draw_mask: (svg, svg_masked, r, is_clipped, id) => {
        const m = SVG.append("mask", svg_masked);
        m.setAttribute("id", "mask_" + svg.id + "_" + id);
        if (is_clipped) {
            SVG.append("circle", m, {
                cx: .5 * SVG.SCALE, cy: .5 * SVG.SCALE, r: .5 * SVG.SCALE, fill: "white"
            });
        } else {
            SVG.append("rect", m, {
                x: 0, y: 0, width: SVG.SCALE, height: SVG.SCALE, fill: "white"
            });
        }
        SVG.append("circle", m, {
            cx: .5 * SVG.SCALE, cy: .5 * SVG.SCALE, r, fill: "black"
        });

        svg_masked.setAttribute("mask", "url(#mask_" + svg.id + "_" + id + ")");
        if (is_clipped) {
            SVG.append("circle", svg, {
                cx: .5 * SVG.SCALE, cy: .5 * SVG.SCALE, r: .5 * SVG.SCALE,
                "fill": "none",
                "stroke": "black",
                "stroke-width": DRAW.width.clip_path.body,
            });
        }
        SVG.append("circle", svg, {
            cx: .5 * SVG.SCALE, cy: .5 * SVG.SCALE, r,
            "fill": "none",
            "stroke": "black",
            "stroke-width": DRAW.width.clip_path.body,
        });
    },
};
