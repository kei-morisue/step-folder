import { M } from "../flatfolder/math.js"
import { N } from "../defox/nath.js"


export const L = {

    foot: (p, seg) => {
        const [p1, p2] = seg;
        const d = M.sub(p2, p1);
        const [dx, dy] = d;
        const n = [-dy, dx];

        const pp1_n = M.dot(M.sub(p, p1), d);
        const d_d = M.dot(d, d);
        const a = pp1_n / d_d;
        if (a > 1 || a < 0) {
            return { foot: undefined, len: a, dir: n };
        }

        const p1p_d = M.dot(M.sub(p1, p), n);
        const b = p1p_d / d_d;

        return { foot: M.add(p, M.mul(n, b)), len: b, dir: n };
    },

    dist: (p, seg) => {
        const { foot, len, dir } = L.foot(p, seg);
        if (foot) {
            return Math.abs(len) * M.mag(dir);
        }
        const [p1, p2] = seg;
        return Math.min(M.dist(p, p1), M.dist(p, p2));
    },

    binded_angle: (p0, p, rad) => {
        const dir0 = M.sub(p, p0);
        const theta0 = M.angle(dir0);
        const mod = theta0 % rad;
        let n = (theta0 - mod) / rad;
        if (mod > rad / 2) {
            n = n + 1;
        }
        return n * rad;
    },

    is_eq_dir: (d1, d2) => {
        const a = d2[0] * d1[1];
        const b = d2[1] * d1[0];
        return Math.abs(a - b) < 1e-8;
    },

    find_binded_v: (p0, r, theta, pts, bound_radius) => {
        const dir = [r * Math.cos(theta), r * Math.sin(theta)];
        const p = M.add(p0, dir);
        const p_ = L.find_v(p, pts, (v) => {
            if (M.near_zero(M.mag(M.sub(v, p0)))) {
                return false;
            }
            const dir_ = M.sub(v, p0);
            return L.is_eq_dir(dir, dir_);
        })
        if (!p_) {
            return p;
        }
        const dist = M.mag(M.sub(p, p_));
        if (dist < bound_radius) {
            return p_;
        }
        return p;
    },

    find_v: (p0, candiadtes, cond = (e) => true) => {
        let min_l = Infinity;
        let idx = -1;
        for (const [i, v] of candiadtes.entries()) {
            if (!cond(v)) {
                continue;
            }
            const l = M.mag(M.sub(p0, v));
            if (min_l > l) {
                min_l = l;
                idx = i;
            }
        }
        if (min_l < 0.1) {
            return candiadtes[idx];
        }
        return undefined;
    },
    find_seg: (p0, candidates) => {
        let min_l = Infinity;
        let idx = -1;
        for (const [i, seg] of candidates.entries()) {
            const l = L.dist(p0, seg);
            if (min_l > l) {
                min_l = l;
                idx = i;
            }
        }
        return [idx, min_l];
    },


}