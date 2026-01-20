import { M } from "../flatfolder/math.js";
import { SVG } from "../flatfolder/svg.js";
import { DRAW } from "./draw.js";

export const SVG3 = {   // DRAWING
    SCALE: 1000,
    get_val: (val, i, def) => {
        if (val == undefined) { return def; }
        if (Array.isArray(val)) { return val[i]; }
        return val;
    },
    draw_point: (svg, [x, y], color, r) => {
        return SVG.append("circle", svg, { cx: x, cy: y, r: r, "fill": color });
    },
    draw_label: (svg, [x, y], color, i, size = 15) => {
        const t = SVG.append("text", svg, {
            x: x, y: y, "fill": color, "font-size": size + "pt"
        });
        t.innerHTML = i;
        return t;
    },
    draw_segments: (svg, L, options) => {
        for (const [i, l] of L.entries()) {
            if (options.filter && !options.filter(i)) { continue; }
            const [[x1, y1], [x2, y2]] = l.map(p => M.mul(p, SVG.SCALE));
            const el = SVG.append("line", svg, { x1, x2, y1, y2 });
            const color = SVG.get_val(options.stroke, i, "black");
            const width = SVG.get_val(options.stroke_width, i, 1);
            el.setAttribute("stroke", color);
            el.setAttribute("stroke-width", width);
            el.setAttribute("stroke-linecap", "round");
            if (options.id) { el.setAttribute("id", `${svg.id}${i}`); }
            if (options.text) {
                const [x, y] = M.div(M.add([x1, y1], [x2, y2]), 2);
                SVG.draw_point(svg, [x, y], color, SVG.get_val(options.r, i, 2));
                SVG.draw_label(svg, [x, y], color, i);
            }
        }
    },
    draw_polygons: (svg, P, options) => {
        for (const [i, ps] of P.entries()) {
            if (options.filter && !options.filter(i)) { continue; }
            const F = ps.map(p => M.mul(p, SVG.SCALE));
            const color = SVG.get_val(options.fill, i, "black");
            if (color == undefined) { continue; }
            const V = F.map(v => v.join(",")).join(" ");
            const el = SVG.append("polygon", svg, { points: V, fill: color });
            if (options.stroke != undefined) {
                const stroke = SVG.get_val(options.stroke, i);
                const width = SVG.get_val(options.stroke_width, i, 1);
                el.setAttribute("stroke", stroke);
                el.setAttribute("stroke-width", width);
                el.setAttribute("stroke-linejoin", "round");
            }
            if ((options.opacity != undefined) && (options.opacity != 1)) {
                el.setAttribute("opacity", SVG.get_val(options.opacity, i));
            }
            if (options.id) { el.setAttribute("id", `${svg.id}${i}`); }
            if (options.text) {
                const [x, y] = M.interior_point(F);
                SVG.draw_point(svg, [x, y], color, SVG.get_val(options.r, i, 2));
                SVG.draw_label(svg, [x, y], color, i);
            }
        }
    },
    draw_clip_path: (svg, gg, id) => {
        const cp = SVG.append("clipPath", svg);
        cp.setAttribute("id", "cp_" + id);
        const r = .5 * SVG.SCALE;
        const b = 1 + 2 * SVG.MARGIN / SVG.SCALE
        SVG.append("circle", cp, {
            cx: r, cy: r, r: r * b,
        });

        gg.setAttribute("clip-path", "url(#cp_" + id + ")");
        return SVG.append("circle", svg, {
            cx: r, cy: r, r: r * b,
            "fill": "none",
            "stroke": "black",
            "stroke-width": DRAW.width.clip_path.body,
        });
    },
};
