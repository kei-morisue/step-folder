import { M } from "../flatfolder/math.js"
export const N = {
    FLOAT_EPS: 10 ** (-6),
    near_zero: (a) => Math.abs(a) < N.FLOAT_EPS,
    cross: ([x1, y1], [x2, y2]) => x1 * y2 - x2 * y1,
    is_inside: (c, vs) => {
        let wind = 0
        let d0 = M.sub(vs[vs.length - 1], c)
        for (let i = 0; i < vs.length; ++i) {
            const d1 = M.sub(vs[i], c)
            const dot = M.dot(d1, d0);
            const cross = N.cross(d1, d0);


            const m0 = M.mag(d0);
            const m1 = M.mag(d1);

            const cos = dot / m1 / m0
            const sign = cross

            const theta = Math.acos(cos);
            const ang = sign < 0 ? -theta : theta;

            wind = wind + ang
            d0 = d1
        }
        return N.near_zero(wind + 2 * Math.PI)
    },
}