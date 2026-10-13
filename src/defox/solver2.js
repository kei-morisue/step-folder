import { M } from "../flatfolder/math.js";

import { N } from "./nath.js";

export const SOL2 = {

    additional_assignment: (HF, BA, BF, BI, FC, CF, Ff) => {
        for (const F of HF) {
            SOL2.align_assignment(F, BA, BF, BI, FC, CF, Ff);
        }
        return BA;
    },

    get_assign: (key, o, F, Ff) => {
        if (o == 0) return undefined;
        const [f1, f2] = M.decode(key);
        if (f1 == F) return o;
        return ((o == 1)) ? 2 : 1;
    },

    align_assignment: (F, BA, BF, BI, FC, CF, Ff) => {
        const cells = FC[F];
        let o_ = undefined;
        const bis = [];
        for (const cell of cells) {
            const faces = CF[cell];
            for (const face of faces) {
                if (face == F) continue;
                const key = M.encode_order_pair([F, face]);
                const bi = BI.get(key);
                if (BA[bi] == 0) {
                    bis.push(bi);
                    continue;
                }
                const o = SOL2.get_assign(key, BA[bi], F, Ff);
                if (o_ == undefined) {
                    o_ = o;
                    continue;
                };
                if (o != o_) {
                    return;
                };
                continue;
            }
        }
        for (const bi of bis) {
            const key = BF[bi];
            BA[bi] = SOL2.get_assign(key, o_, F, Ff);
        }

    },
}