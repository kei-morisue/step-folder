import { M } from "../flatfolder/math.js";
import { X } from "../flatfolder/conversion.js";
import { SOLVER } from "../flatfolder/solver.js";

import { LIN } from "../linefolder/linear.js";
import { IO3 } from "./io.js"
import { N } from "./nath.js";


export const Y = {     // CONVERSION
    FO_Ff_BF_2_BA0: (FO, Ff, BF) => {
        const BA_map = new Map();
        for (let i = 0; i < FO.length; ++i) {
            const [f, g, o] = FO[i];
            const a1 = (Ff[g]
                ? ((o > 0) ? 1 : 2)
                : ((o > 0) ? 2 : 1)
            );
            const a2 = ((f < g)
                ? a1
                : ((a1 == 1) ? 2 : 1)
            );
            const s = M.encode_order_pair([f, g]);
            BA_map.set(s, a2);
        }
        return BF.map(s => {
            const out = BA_map.get(s);
            return (out == undefined) ? 0 : out;
        });
    },
    V_FV_EV_EA_FU_UV_2_Vf_Ff: (V, FV, EV, EA, FU, UV) => {
        const EA_map = new Map();
        for (const [i, vs] of EV.entries()) {
            EA_map.set(M.encode_order_pair(vs), EA[i]);
        }
        const EF_map = new Map();
        for (const [i, F] of FV.entries()) {
            for (const [j, v1] of F.entries()) {
                const v2 = F[(j + 1) % F.length];
                EF_map.set(M.encode([v2, v1]), i);
            }
        }
        const Vf = V.map((p) => undefined);
        const Id = [[1, 0], [0, 1]];
        const R = [[0, -1], [1, 0]];
        const seen = new Set();
        seen.add(0);                    // start search at face 0
        const [v1, v2,] = FV[0];        // first edge of first face
        for (const i of [v1, v2]) {
            Vf[i] = V[i];
        }            // [face, edge, len, parity]
        const Ff = new Array(FV.length);

        const d0 = M.sub(V[v1], V[v2]);
        const A0 = N.matadd(Id, N.matmul(N.proj(N.apply(R, d0)), -2));
        const b0 = N.apply(N.matsub(Id, A0), V[v2]);
        const queue = [[0, v1, v2, Infinity, true, A0, b0]];
        let next = 0;
        while (next < queue.length) {                   // Prim's algorithm to
            const [fi, i1, i2, l, s, Ai, bi] = queue[next];     // traverse face graph
            Ff[fi] = !s;                                // over spanning tree
            next += 1;                                  // crossing edges of
            const F = FV[fi];                           // maximum length
            const d = M.sub(V[i2], V[i1]);
            const A_ = N.matadd(Id, N.matmul(N.proj(N.apply(R, d)), -2));
            const A = N.matprod(Ai, A_);
            const b = M.add(bi, N.apply(N.matsub(Ai, A), V[i2]));
            for (const ui of FU[fi]) {
                for (const w of UV[ui]) {
                    if (Vf[w] == undefined) {
                        Vf[w] = M.add(b, N.apply(A, V[w]));
                    }
                }
            }
            let vi = F[F.length - 1];
            for (const vj of F) {
                if (Vf[vj] == undefined) {
                    Vf[vj] = M.add(b, N.apply(A, V[vj]));
                }
                const len = M.distsq(V[vi], V[vj]);
                const f = EF_map.get(M.encode([vi, vj]));
                const a = EA_map.get(M.encode_order_pair([vi, vj]));
                const new_s = (a == "M" || a == "V" || a == "U" || a == "RV" || a == "RM" || a == "UF") ? !s : s;
                if ((f != undefined) && !seen.has(f)) {
                    queue.push([f, vj, vi, len, new_s, A, b]);
                    seen.add(f);
                    let prev = len;
                    for (let i = queue.length - 1; i > next; --i) {
                        const curr = queue[i - 1][3];   // O(n^2) but could be
                        if (curr < prev) {              // O(n log n)
                            [queue[i], queue[i - 1]] = [queue[i - 1], queue[i]];
                        } else {
                            break;
                        }
                        prev = curr;
                    }
                }
                vi = vj;
            }
        }
        for (const p of Vf) { if (p == undefined) { debugger; } }
        return [Vf, Ff];
    },

    CP_2_FOLD_CELL: (doc) => {
        const [V, VV, EV, EA, EF, FV, FE, UV, FU, Vc, UA] =
            IO3.cp_2_V_VV_EV_EA_EF_FV_FE(doc);
        if (V == undefined) { return; }
        const [W, Ff] = Y.V_FV_EV_EA_FU_UV_2_Vf_Ff(V, FV, EV, EA, FU, UV);
        const Vf = M.normalize_points(W);

        const FOLD = { V, Vf, FV, EV, EF, FE, Ff, EA, VV, FU, UV, Vc, UA };
        const { P, CP, SP, PP, SC, CS, SE, BF, FC, CF } = Y.FOLD_2_CELL(FOLD);

        const ExE = X.SE_2_ExE(SE);
        const ExF = X.SE_CF_SC_2_ExF(SE, CF, SC);

        const BI = new Map();
        for (const [i, F] of BF.entries()) { BI.set(F, i); }

        const BA0 = SOLVER.EF_EA_Ff_BF_BI_2_BA0(EF, EA, Ff, BF, BI);
        const [BT0, BT1, BT2] = X.BF_BI_EF_ExE_ExF_2_BT0_BT1_BT2(BF, BI, EF, ExE, ExF);
        const BT3x = X.FC_BF_BI_BT0_BT1_2_BT3x(FC, BF, BI, BT0, BT1);
        const [BT3,] = X.EF_SP_SE_CP_FC_CF_BF_BT3x_2_BT3(EF, SP, SE, CP, FC, CF, BF, BT3x);
        const BT = BF.map((F, i) => [BT0[i], BT1[i], BT2[i], BT3[i]]);

        const BA = SOLVER.initial_assignment(BA0, BF, BT, BI)
        const GB = SOLVER.get_components(BI, BF, BT, BA);
        const GA = SOLVER.solve(BI, BF, BT, BA, GB, Infinity);
        const n = (!Array.isArray(GA)) ? 0 : GA.reduce((s, A) => {
            return s * BigInt(A.length);
        }, BigInt(1));

        const GI = GB.map(() => 0);
        if (n > 0) {
            FOLD.FO = Y.BF_GB_GA_GI_Ff_2_FO(BF, GB, GA, GI, Ff);
        }
        else { return [undefined, undefined]; }

        const CELL = { P, SP, SE, PP, CP, CS, SC, CF, FC, BF, BI, GB, GA, GI };
        return [FOLD, CELL];
    },
    FOLD_2_CELL: (FOLD) => {
        const { Vf, EV, EF, FV } = FOLD
        const L = EV.map((P) => M.expand(P, Vf));
        const [P, SP, SE, eps_i] = X.L_2_V_EV_EL(L);
        const [PP, CP] = X.V_EV_2_VV_FV(P, SP);
        const [SC, CS] = X.EV_FV_2_EF_FE(SP, CP);
        const [CF, FC] = X.EF_FV_SP_SE_CP_SC_2_CF_FC(EF, FV, SP, SE, CP, SC);
        const BF = X.CF_2_BF(CF);

        return { P, CP, SP, PP, SC, CS, SE, BF, FC, CF }
    },

    FOLD_2_PAPER: (FOLD) => {
        //TODO stub
        const EV = []
        for (const [i, a] of FOLD.EA.entries()) {
            if (a == "B") {
                const [v0, v1] = FOLD.EV[i];
                EV.push([v0, v1]);
            }
        }
        const L = EV.map((P) => M.expand(P, FOLD.V));
        let doc = ""
        for (const [_, [p, q]] of L.entries()) {
            doc = doc + "1 " + p[0] + " " + p[1] + " " + q[0] + " " + q[1] + "\r\n"
        }
        return Y.CP_2_FOLD_CELL(doc)
    },

    BF_GB_GA_GI_Ff_2_FO: (BF, GB, GA, GI, Ff) => {

        const edges = X.BF_GB_GA_GI_2_edges(BF, GB, GA, GI);
        return X.edges_Ff_2_FO(edges, Ff);
    },


    FV_V_2_Ff: (FV, V) => FV.map(fV => (M.polygon_area2(fV.map(i => V[i])) < 0)),


    FOLD_CELL_2_STATE: (FOLD, CELL) => {
        const { Ff, FO } = FOLD;
        if (FO == undefined) { return undefined }
        const { P, CF } = CELL;
        const Q = P;
        const edges = FO.map(([f1, f2, o]) => {
            return M.encode(((Ff[f2] ? 1 : -1) * o >= 0) ? [f1, f2] : [f2, f1]);
        });
        const L = LIN.serialize(edges, Ff.length);
        L.S.reverse();

        const CD = X.CF_edges_2_CD(CF, edges);
        const Ctop = CD.map(S => S[S.length - 1]);
        const Cbottom = CD.map(S => S[0]);

        const Ccolor = Ctop.map(d => {
            if (d == undefined) { return undefined; }
            if (Ff[d]) { return true; }
            else { return false; }
        });
        const Ccolor_bottom = Cbottom.map(d => {
            if (d == undefined) { return undefined; }
            if (Ff[d]) { return true; }
            else { return false; }
        });

        return { Q, CD, Ctop, Cbottom, Ccolor, Ccolor_bottom, L, edges };
    },

    Ctop_SC_SE_EF_Ff_EA_FE_2_SD: (Ctop, SC, SE, EF, Ff, EA, FE) => {

        const SD = SC.map((C, si) => {
            const F = C.map(ci => Ctop[ci]);
            if (F[0] == F[1]) { return "N"; }
            // borders of a state
            if ((F[0] != undefined)) {
                for (const e0 of FE[F[0]]) {
                    if (SE[si].indexOf(e0) >= 0) {
                        const a = EA[e0]
                        if (a == "RM" || a == "RV" || a == "UF") {
                            return a;
                        };
                    }
                }
            }
            if ((F[1] != undefined)) {
                for (const e1 of FE[F[1]]) {
                    if (SE[si].indexOf(e1) >= 0) {
                        const a = EA[e1]
                        if (a == "RM" || a == "RV" || a == "UF") {
                            return a;
                        };
                    }
                }
            }
            return "B";
        });
        return SD;
    },
}