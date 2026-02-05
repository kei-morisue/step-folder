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
    }

}