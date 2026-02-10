import { M } from "../flatfolder/math.js";
import { SVG } from "../flatfolder/svg.js";
import { DRAW } from "./draw.js";

export const SVG3 = {   // DRAWING
    INI_SCALE: 1000,

    reset: () => {
        SVG.SCALE = SVG3.INI_SCALE;
    },

    draw_clip_path: (svg, gg, id) => {
        const cp = SVG.append("clipPath", gg);
        cp.setAttribute("id", "cpath_" + svg.id + "_" + id);
        const r = .5 * SVG.SCALE;
        const b = 1;
        SVG.append("circle", cp, {
            cx: r, cy: r, r: r * b,
        });

        gg.setAttribute("clip-path", "url(#cpath_" + svg.id + "_" + id + ")");
        return SVG.append("circle", svg, {
            cx: r, cy: r, r: r * b,
            "fill": "none",
            "stroke": "black",
            "stroke-width": DRAW.width.clip_path.body,
        });
    },
};
