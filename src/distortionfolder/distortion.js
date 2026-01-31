import { M } from "../flatfolder/math.js";
import { X } from "../flatfolder/conversion.js";
import { SOLVER } from "../flatfolder/solver.js";

import { N } from "../defox/nath.js";

export const DIST = {    // STATE DISTORTER
    p0: .0,
    p1: .5,
    p2: .5,

    T0: true,
    T1: true,
    T2: true,
    T3: true,
    refresh: () => {
        DIST.p0 = 0.0;
        DIST.p1 = 0.5;
        DIST.p2 = 0.0;
        DIST.T0 = true;
        DIST.T1 = true;
        DIST.T2 = true;
        DIST.T3 = true;
    },

    matprod: (A, x) => {
        return [M.dot(A[0], x), M.dot(A[1], x)];
    },
    tilt: () => {
        return DIST.p0
    },
    twist: () => { return (2 * DIST.p1 - 1) * Math.PI },
    tilt_d: () => {
        return DIST.p2
    },
    FOLD_2_VD: (Vf, V) => {
        const p = Math.exp(- 1 / (DIST.tilt()));
        const q = DIST.tilt_d();

        const r1 = p * (1 - q);
        const r2 = p * q;

        const t2 = DIST.twist();

        const cy = Math.cos(t2)
        const sy = Math.sin(t2)

        const A = [[r1 + r2 * cy, r2 * sy], [r2 * sy, r1 - r2 * cy]];
        const V_ = V.map((v, i) => { return M.add(Vf[i], DIST.matprod(A, v)) });
        const B = N.inv(N.matadd([[1, 0], [0, 1]], A));
        return V_.map((v) => N.apply(B, v));
    },

    infer_FO: (FOLD, CELL_D) => {
        const { EF, FO, Ff } = FOLD
        const { BF, SE, CF, SC, SP, FC, CP } = CELL_D
        const BI_map = new Map();
        for (const [i, k] of BF.entries()) {
            BI_map.set(k, i);
        }

        const BA0 = BF.map(() => 0);
        for (const [i, [f1, f2, o]] of FO.entries()) {
            const k = M.encode_order_pair([f1, f2]);
            const [f1_0, f2_0] = M.decode(k);
            const o_0 = f1_0 == f1 ? 1 : 2;
            const bi = BI_map.get(k)
            BA0[bi] = o_0;
        }

        const BI = new Map();
        const ExE = X.SE_2_ExE(SE);
        const ExF = X.SE_CF_SC_2_ExF(SE, CF, SC);
        for (const [i, F] of BF.entries()) { BI.set(F, i); }
        const [BT0, BT1, BT2] = X.BF_BI_EF_ExE_ExF_2_BT0_BT1_BT2(BF, BI, EF, ExE, ExF);
        const BT3x = X.FC_BF_BI_BT0_BT1_2_BT3x(FC, BF, BI, BT0, BT1);
        const [BT3,] = X.EF_SP_SE_CP_FC_CF_BF_BT3x_2_BT3(EF, SP, SE, CP, FC, CF, BF, BT3x);
        const BT = BF.map((F, i) => [DIST.T0 ? BT0[i] : [], DIST.T1 ? BT1[i] : [], DIST.T2 ? BT2[i] : [], DIST.T3 ? BT3[i] : []]);

        const GB = SOLVER.get_components(BI, BF, BT, BA0);
        const GA = SOLVER.solve(BI, BF, BT, BA0, GB, 1);
        const n = (!Array.isArray(GA)) ? 0 : GA.reduce((s, A) => {
            return s * BigInt(A.length);
        }, BigInt(1));
        if (n > 0) {
            const GI = GB.map(() => 0);// take the first solution
            //Inferring FO
            const edges = X.BF_GB_GA_GI_2_edges(BF, GB, GA, GI);
            return X.edges_Ff_2_FO(edges, Ff)
        }
        return
    },

}