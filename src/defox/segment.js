import { Y } from "./y.js"
import { M } from "../flatfolder/math.js";

export const SEG = {
    clip: .0,

    refresh: () => { SEG.clip = .0 },

    clip_edge: (E, EV, V_, Vc, clip) => {
        const [v1, v2] = EV[E];
        let c1 = Vc[v1];
        let c2 = Vc[v2];


        const [q1, q2] = M.expand(EV[E], V_);
        const c = M.centroid([q1, q2]);
        const l = M.dist(q1, q2);
        let s1 = c1 ? 1.0 - clip * .1 / l : 1;
        let s2 = c2 ? 1.0 - clip * .1 / l : 1;
        if (s1 + s2 <= 0.0) { // segment would flip
            s1 = 0.0;
            s2 = 0.0;
        }

        const r1 = M.add(c, M.mul(M.sub(q1, c), s1));
        const r2 = M.add(c, M.mul(M.sub(q2, c), s2));
        return [r1, r2];
    },

    clip_edges: (Es, EV, V_, Vc, clip) => {
        return Es.map((E) => SEG.clip_edge(E, EV, V_, Vc, clip));
    },

}