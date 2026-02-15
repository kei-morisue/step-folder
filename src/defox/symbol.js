import { SVG } from "../flatfolder/svg.js"
import { M } from "../flatfolder/math.js";

import { N } from "../defox/nath.js";

export const SYM = {
    width: {
        arrow: 4,
        reference_point: 4,
    },
    color: {
        arrow: "black",
        reference_point: "magenta",
    },
    radius: {
        reference_point: 20,
        flip: 100,
    },
    get_cross: (p, q, l, alpha) => {
        const d = M.sub(q, p);
        const [x, y] = d;
        const dm = M.mul(d, (alpha + .5));
        const n = M.mul([-y, x], l * .5);
        const e = M.add(dm, M.add(n, p));
        const s = M.add(e, M.mul([y, -x], l));
        return [s, e];
    },

    create: (type, params, FOLD, T) => {
        const i = params.crease_index;
        const { Vf, UV, EV } = FOLD;
        const V_ = M.normalize_points(Vf).map((v) => N.transform(T, v));

        let s, e, v, v1;
        if (i >= 0) {
            const creases = UV.concat(EV);
            const [p, q] = M.expand(creases[i], V_);

            [s, e] = SYM.get_cross(p, q, params.length, params.offset);
            if (params.is_rev) {
                [s, e] = [e, s];
            }
        }

        const j = params.vertex_index;
        if (j >= 0) {
            v = V_[j];
        }

        const j1 = params.vertex_index_1;
        if (j1 >= 0) {
            const v1_ = V_[j1];
            const d = M.sub(v1_, v);
            v1 = M.add(v, M.mul(d, params.length));
        }

        switch (type) {
            case 0:
                return SYM.create_mv(s, e, false, params.is_clockwise, false);
            case 1:
                return SYM.create_mv(s, e, true, params.is_clockwise, false);
            case 2:
                return SYM.create_mv(s, e, false, params.is_clockwise, true);
            case 3:
                return SYM.create_mv(s, e, true, params.is_clockwise, true);
            case 4:
                return SYM.create_sink(s, e, false);
            case 5:
                return SYM.create_sink(s, e, true);
            case 6:
                return SYM.create_fold_unfold(s, e, params.is_clockwise, false);
            case 7:
                return SYM.create_fold_unfold(s, e, params.is_clockwise, true);
            case 8:
                const c = [params.cx * (params.offset + 1), params.cy];
                return SYM.create_flip(c, params.is_rev, SYM.radius.flip * params.length);
            case 9:
                const l = params.length;
                return SYM.create_reference_point(v, l * SYM.radius.reference_point);
            case 10:
                return SYM.create_pleat(s, e, params.is_clockwise);
            case 11:
                return SYM.create_inside_reverse(v, v1, params.is_clockwise, params.offset, false);
            case 12:
                return SYM.create_inside_reverse(v, v1, params.is_clockwise, params.offset, true);
            default:
                return undefined;
        }
    },

    create_mv: (s, e, is_m, is_clockwese, is_sqeezed) => {
        const k = SVG.SCALE;
        const [x0, y0] = M.mul(s, k);
        const [x1, y1] = M.mul(e, k);
        const d = M.sub([x1, y1], [x0, y0]);
        const [dx, dy] = d;
        const n = is_clockwese ? [dy, -dx] : [-dy, dx];
        const [x, y] = M.add(M.add([x0, y0], M.mul(d, is_sqeezed ? -.5 : .5)), M.mul(n, 0.3));

        const sym = document.createElementNS(SVG.NS, "path");
        sym.setAttribute("d", `M ${x0} ${y0} S ${x} ${y}, ${x1} ${y1}`);
        sym.setAttribute("stroke", SYM.color.arrow);
        sym.setAttribute("stroke-width", SYM.width.arrow);
        sym.setAttribute("stroke-linecap", "butt");
        const end = is_m ? "url(#arrow_head_m)" : "url(#arrow_head_v)";
        sym.setAttribute("marker-end", end);
        sym.setAttribute("fill", "transparent");
        return sym;
    },

    create_inside_reverse: (s, e, is_clockwese, offset, is_sqeezed) => {
        const k = SVG.SCALE;
        const [x0, y0] = M.mul(s, k);
        const [x1, y1] = M.mul(e, k);
        const d = M.sub([x1, y1], [x0, y0]);
        const [dx, dy] = d;
        const n = is_clockwese ? [dy, -dx] : [-dy, dx];
        const [x, y] = M.add(M.add([x0, y0], d), M.mul(n, .2));

        const [px, py] = M.add(M.add([x0, y0], M.mul(d, is_sqeezed ? -.5 : .5)), M.mul(n, offset / 5 + 1));
        const [qx, qy] = M.add(M.add([x, y], M.mul(d, is_sqeezed ? .5 : -.5)), M.mul(n, -1.5 * offset / 5 - 1.5));

        const sym = document.createElementNS(SVG.NS, "path");
        sym.setAttribute("d", `M ${x0} ${y0} C ${px} ${py}, ${qx} ${qy}, ${x} ${y}`);

        sym.setAttribute("stroke", SYM.color.arrow);
        sym.setAttribute("stroke-width", SYM.width.arrow);
        sym.setAttribute("stroke-linecap", "butt");
        const end = "url(#arrow_head_inside_reverse)";
        sym.setAttribute("marker-end", end);
        sym.setAttribute("fill", "transparent");
        return sym;
    },

    create_sink: (s, e, is_closed) => {
        const k = SVG.SCALE;
        const [x1, y1] = M.mul(e, k);
        const d = M.sub([x1, y1], M.mul(s, k));
        const u = M.unit(d);
        const [x, y] = M.add([x1, y1], u);

        const sym = document.createElementNS(SVG.NS, "path");
        sym.setAttribute("d", `M ${x} ${y} L ${x1} ${y1}`);
        sym.setAttribute("stroke", SYM.color.arrow);
        sym.setAttribute("stroke-width", SYM.width.arrow);
        sym.setAttribute("stroke-linecap", "butt");

        const end = is_closed ? "url(#arrow_head_closed_sink)" : "url(#arrow_head_open_sink)";
        sym.setAttribute("marker-end", end);
        sym.setAttribute("fill", "transparent");
        return sym;
    },

    create_fold_unfold: (s, e, is_clockwese, is_sqeezed) => {
        const k = SVG.SCALE;
        const [x0, y0] = M.mul(s, k);
        const [x1, y1] = M.mul(e, k);
        const d = M.sub([x1, y1], [x0, y0]);
        const [dx, dy] = d;
        const n = is_clockwese ? [dy, -dx] : [-dy, dx];
        const [x, y] = M.add(M.add([x0, y0], M.mul(d, is_sqeezed ? -.3 : .5)), M.mul(n, 0.3));


        const [x2, y2] = M.add([x0, y0], M.mul(n, 0.3));
        const dd = M.sub([x2, y2], [x1, y1]);
        const [dxx, dyy] = dd;
        const nn = is_clockwese ? [dyy, -dxx] : [-dyy, dxx];
        const [xx, yy] = M.add(M.add([x1, y1], M.mul(dd, .5)), M.mul(nn, -0.3));


        const sym = document.createElementNS(SVG.NS, "path");
        sym.setAttribute("d", `M ${x0} ${y0} S ${x} ${y}, ${x1} ${y1} L ${x1} ${y1} S ${xx} ${yy}, ${x2} ${y2}`);
        sym.setAttribute("stroke", SYM.color.arrow);
        sym.setAttribute("stroke-width", SYM.width.arrow);
        sym.setAttribute("stroke-linecap", "butt");
        const end = "url(#arrow_head_fold_unfold)";
        sym.setAttribute("marker-end", end);
        sym.setAttribute("fill", "transparent");
        return sym;

    },

    create_pleat: (s, e, is_clockwese) => {
        const k = SVG.SCALE;
        const [x0, y0] = M.mul(s, k);
        const [x1, y1] = M.mul(e, k);
        const d = M.sub([x1, y1], [x0, y0]);
        const [dx, dy] = d;
        const n = is_clockwese ? [dy, -dx] : [-dy, dx];
        const [x2, y2] = M.add(M.add([x0, y0], M.mul(d, .5)), M.mul(n, 0.2));


        const [x3, y3] = M.sub([x2, y2], d);


        const sym = document.createElementNS(SVG.NS, "path");
        sym.setAttribute("d", `M ${x3} ${y3} L ${x2} ${y2} L ${x0} ${y0} L ${x1} ${y1}`);
        sym.setAttribute("stroke", SYM.color.arrow);
        sym.setAttribute("stroke-width", SYM.width.arrow);
        sym.setAttribute("stroke-linecap", "butt");
        const end = "url(#arrow_head_pleat)";
        sym.setAttribute("marker-end", end);
        sym.setAttribute("fill", "transparent");
        return sym;

    },

    create_flip: (center, is_rev, size = 100) => {
        const k = SVG.SCALE;
        const [cx, cy] = center;
        const [x, y] = [cx * k, cy * k];
        const kk = size / 2;
        const [x0, y0] = [x - kk * Math.sqrt(3), y + size / 2];
        const [x1, y1] = [x + kk * Math.sqrt(3), y + size / 2];
        const [mx, my] = [x, y + size];
        const [nx, ny] = [x, y];


        const sym = document.createElementNS(SVG.NS, "path");
        sym.setAttribute("d", `M ${x0} ${y0} A ${size} ${size} 0 0 0 ${mx} ${my} A ${size / 2} ${size / 2} 0 0 1 ${nx} ${ny} A ${size / 2} ${size / 2} 0 1 1 ${mx} ${my} A ${size} ${size} 0 0 0 ${x1} ${y1}`);
        sym.setAttribute("stroke", SYM.color.arrow);
        sym.setAttribute("stroke-width", SYM.width.arrow);
        sym.setAttribute("stroke-linecap", "butt");
        const end = "url(#arrow_head_flip)";
        if (is_rev) {
            sym.setAttribute("marker-start", end);
        }
        else {
            sym.setAttribute("marker-end", end);
        }
        sym.setAttribute("fill", "transparent");
        return sym;
    },

    create_reference_point: ([cx, cy], r) => {
        const [x, y] = M.mul([cx, cy], SVG.SCALE);
        const sym = document.createElementNS(SVG.NS, "circle");
        sym.setAttribute("cx", x);
        sym.setAttribute("cy", y);
        sym.setAttribute("r", r);
        sym.setAttribute("stroke", SYM.color.reference_point);
        sym.setAttribute("stroke-width", SYM.width.reference_point);
        sym.setAttribute("fill", "transparent");
        return sym;
    },

}