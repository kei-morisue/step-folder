import { Y } from "./y.js"
import { M } from "../flatfolder/math.js";

export const SEG = {
    clip: .0,

    refresh: () => { SEG.clip = .0 },

    clip_edges: (Es, EV, V_, Vc, clip) => {
        return Es.map((E) => {
            const [v1, v2] = EV[E];
            let c1 = Vc[v1];
            let c2 = Vc[v2];


            const [q1, q2] = M.expand(EV[E], V_);
            const c = M.centroid([q1, q2]);
            const s1 = c1 ? 1.0 - clip : 1;
            const s2 = c2 ? 1.0 - clip : 1;

            const r1 = M.add(c, M.mul(M.sub(q1, c), s1));
            const r2 = M.add(c, M.mul(M.sub(q2, c), s2));
            return [r1, r2];
        });
    },

}