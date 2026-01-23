import { Y } from "./y.js"
import { M } from "../flatfolder/math.js";
import { X } from "../flatfolder/conversion.js";
import { IO } from "../flatfolder/io.js";
import { SVG } from "../flatfolder/svg.js";

import { NOTE } from "../flatfolder/note.js";
import { LIN } from "../linefolder/linear.js";

export const SEG = {
    clip: .0,

    refresh: () => { SEG.clip = .0 },
    clip_lines: (lines, CELL, SD, Q_) => {
        const { P, PP, CP, CF, SP, SC, SE } = CELL;
        const PPA_map = new Map();
        for (const [i, [v1, v2]] of SP.entries()) {
            const a = SD[i];
            PPA_map.set(M.encode([v1, v2]), a);
            PPA_map.set(M.encode([v2, v1]), a);
        }
        return SP.map((ps) => {
            const [p1, p2] = ps;
            let c1 = false;
            let c2 = false;
            for (const [_, p3] of PP[p1].entries()) {
                const a = PPA_map.get(M.encode([p1, p3]))
                if (a != undefined) {
                    if (a[0] == "B") {
                        c1 = true;
                    }
                }
            }
            for (const [_, p3] of PP[p2].entries()) {
                const a = PPA_map.get(M.encode([p2, p3]))
                if (a != undefined) {
                    if (a[0] == "B") {
                        c2 = true;
                    }
                }
            }
            const [q1, q2] = M.expand(ps, Q_);
            const c = M.centroid([q1, q2]);
            const s1 = c1 ? 1.0 - SEG.clip : 1;
            const s2 = c2 ? 1.0 - SEG.clip : 1;

            const r1 = M.add(c, M.mul(M.sub(q1, c), s1));
            const r2 = M.add(c, M.mul(M.sub(q2, c), s2));
            return [r1, r2];

        });
    },
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