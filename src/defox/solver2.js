import { M } from "../flatfolder/math.js";

import { N } from "./nath.js";

export const SOL2 = {

    additional_assignment: (H, EF, BA, BF, BI, SE, CS, FC, CF, Ff) => {
        for (const E of H) {
            SOL2.align_edge(E, EF, BA, BF, BI, SE, CS, FC, CF, Ff);
        }

        return BA;
    },

    get_assign: (key, o, F, Ff) => {
        if (o == 0) return undefined;
        const [f1, f2] = M.decode(key);
        if (f1 == F) return o;
        return ((o == 1)) ? 2 : 1;
    },

    align_face: (F, cells, BA, BF, BI, CF, Ff) => {
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

    align_edge: (E, EF, BA, BF, BI, SE, CS, FC, CF, Ff) => {
        const [f1, f2] = EF[E];
        const cells_f1 = FC[f1];
        const cells_e = [];
        for (const c of cells_f1) {
            const segs = CS[c];
            for (const seg of segs) {
                const edges = SE[seg];
                const i = edges.indexOf(E);
                if (i >= 0) {
                    cells_e.push(c);
                    break;
                }
            }
        }
        if (f2 == undefined) {
            SOL2.align_face(f1, cells_e, BA, BF, BI, CF, Ff);
            return;
        }
        const cells_f2 = FC[f2];

        const cells = [];
        for (const c of cells_f2) {
            if (cells_e.indexOf(c) >= 0) {
                cells.push(c);
            }
        }
        SOL2.align_face(f1, cells, BA, BF, BI, CF, Ff);
        SOL2.align_face(f2, cells, BA, BF, BI, CF, Ff);
        return;
    },
}