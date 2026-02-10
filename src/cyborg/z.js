import { M } from "../flatfolder/math.js";
import { X } from "../flatfolder/conversion.js";
import { Y } from "../defox/y.js";
import { N } from "../defox/nath.js";


import { IO } from "../flatfolder/io.js";


export const Z = {

    segs_assings_2_FOLD_CELL: (segs, assigns, FOLD_infer = undefined) => {
        const doc = Y.segs_EA_2_CP(segs, assigns, 1.0);
        return Y.CP_2_FOLD_CELL(doc, FOLD_infer);
    },

    segs_2_CP: (segs, assigns) => {
        const doc = Y.segs_EA_2_CP(segs, assigns, 1.0);
        const L = IO.CP_2_L(doc);
        const [V, EV, EL,] = X.L_2_V_EV_EL(L);
        const EA = EL.map((ls) => {
            let a = "F";
            for (const l_i of ls) {
                const b = L[l_i][2];
                if (b != "F") {
                    a = b;
                    break;
                }
            }
            return (a == "M") ? "V" : ((a == "V") ? "M" : a);
        });
        const W = M.normalize_points(V);
        const segs_ = EV.map((ps) => M.expand(ps, W));
        return { V: W, EV, EA, segs: segs_ };
    },

    trim_a_vertex: (VE, EA, EV, V) => {
        for (const [v_i, es] of VE.entries()) {
            if (es.length != 2) {
                continue;
            }
            const [e1, e2] = [es[0], es[1]];
            const a1 = EA[e1];
            const a2 = EA[e2];
            if (a1 != a2) {
                continue;
            }
            const [p1, q1] = EV[e1];
            const [p2, q2] = EV[e2];
            const d1 = M.unit(M.sub(V[p1], V[q1]));
            const d2 = M.unit(M.sub(V[p2], V[q2]));
            if (Math.abs(N.cross(d1, d2)) > 1e-8) {
                continue;
            }
            const EA_ = EA.toSpliced(e2, 1);
            const EV_ = EV.map((vs) => vs);
            EV_[e1] = p1 == p2 ? [q2, q1]
                : p1 == q2 ? [p2, q1]
                    : p2 == q1 ? [p1, q2]
                        : [p1, q1];
            return { EA_, EV_: EV_.toSpliced(e2, 1) };
        }
        return undefined;

    },

    sweep_vertices: (V_, EV) => {
        const V_map = V_.map(() => undefined);
        const V = [];
        for (const [e_i, vs] of EV.entries()) {
            const [v1, v2] = vs;
            const v_idx_1 = V_map[v1]
            if (v_idx_1 == undefined) {
                V.push(V_[v1]);
                V_map[v1] = V.length - 1;
            }
            const v_idx_2 = V_map[v2]
            if (v_idx_2 == undefined) {
                V.push(V_[v2]);
                V_map[v2] = V.length - 1;
            }
        }
        return { V, V_map };
    },

    add_segment: (segs, EA, seg_add, assign) => {
        segs.push(seg_add);
        EA.push(assign);
        return Z.segs_2_CP(segs, EA);
    },
    remove_segment: (segs, EA, seg_idx) => {
        const segs_ = segs.toSpliced(seg_idx, 1);
        const EA_ = EA.toSpliced(seg_idx, 1);
        return Z.segs_2_CP(segs_, EA_);
    },
    get_VK: (EV, EA, V) => {
        const [VV, FV] = X.V_EV_2_VV_FV(V, EV);
        return X.V_VV_EV_EA_2_VK(V, VV, EV, EA);
    },
}