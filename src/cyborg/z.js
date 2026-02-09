import { M } from "../flatfolder/math.js";
import { X } from "../flatfolder/conversion.js";
import { Y } from "../defox/y.js";
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