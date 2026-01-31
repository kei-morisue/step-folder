import { M } from "../flatfolder/math.js"
export const N = {
    FLOAT_EPS: 10 ** (-8),
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
    inv: (A) => {
        const [a, b] = A[0];
        const [c, d] = A[1];
        const det = N.det(A);
        return [[d / det, -b / det], [-c / det, a / det]];
    },
    mat: (flip, scale, rotate) => {
        const s = scale * Math.sin(rotate);
        const c = scale * Math.cos(rotate);
        return [flip ? [-c, s] : [c, -s], [s, c]];
    },
    det: (A) => {
        const [a, b] = A[0];
        const [c, d] = A[1];
        return a * d - b * c;
    },
    apply: (A, v) => {
        return [M.dot(A[0], v), M.dot(A[1], v)];
    },
    transform: (T, v) => {
        const A = T[0];
        const b = T[1];
        return M.add(N.apply(A, v), b);
    },
    transpose: (A) => {
        const [[a, b], [c, d]] = A;
        return [[a, c], [b, d]];
    },
    matprod: (A, B) => {
        const [[a, b], [c, d]] = B;
        return N.transpose([N.apply(A, [a, c]), N.apply(A, [b, d])]);
    },
    matadd: (A, B) => {
        const [a, b] = A;
        const [c, d] = B;
        return [M.add(a, c), M.add(b, d)];
    },
    matsub: (A, B) => {
        const [a, b] = A;
        const [c, d] = B;
        return [M.sub(a, c), M.sub(b, d)];
    },
    matmul: (A, k) => {
        const [[a, b], [c, d]] = A;
        return [[k * a, k * b], [k * c, k * d]];
    },
    proj: (v) => {
        const [a, b] = v;
        return N.matmul([[a * a, a * b], [a * b, b * b]], 1 / M.magsq(v));
    },
}