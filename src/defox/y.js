import { M } from "../flatfolder/math.js";
import { X } from "../flatfolder/conversion.js";
import { SOLVER } from "../flatfolder/solver.js";

import { LIN } from "../linefolder/linear.js";
import { IO3 } from "./io.js"
import { SOL2 } from "./solver2.js"
import { N } from "./nath.js";
import { DIFF } from "./diff.js";
import { PRJ } from "./project.js";

import { LOAD } from "./gui/load.js";


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



    CP_2_FOLD: (doc, FOLD_infer, hs) => {
        const L_add = FOLD_infer ? Y.FOLD_2_L(FOLD_infer) : undefined;
        const [V, VV, EV, EA, EF, FV, FE, UV, FU, Vc, UA] =
            IO3.cp_2_V_VV_EV_EA_EF_FV_FE(doc, L_add);
        if (V == undefined) { return; }
        const H = [];
        for (const h of hs ?? []) {
            for (const [i, vs] of EV.entries()) {
                const c = M.centroid(M.expand(vs, V));
                if (M.distsq(h, c) < 1e-8) {
                    H.push(i);
                    break;
                }
            }
        }
        const [Vf, Ff] = Y.V_FV_EV_EA_FU_UV_2_Vf_Ff(V, FV, EV, EA, FU, UV);


        return { V, Vf, FV, EV, EF, FE, Ff, EA, VV, FU, UV, Vc, UA, H };
    },

    CP_2_FOLD_CELL: async (doc, limit, FOLD_infer, hs, step_infer) => {
        await LOAD.status("folding the Crease Pattern");
        const FOLD = Y.CP_2_FOLD(doc, FOLD_infer, hs);
        await LOAD.status("Building the Cell Graph");
        const CELL_ = Y.FOLD_2_CELL(FOLD);
        const B = await Y.FOLD_CELL_2_BF_BI_GB_GA(FOLD, CELL_, limit, step_infer);
        if (B == undefined) { return [undefined, undefined]; }
        const { BF, BI, GB, GA } = B;
        const GI = GB.map(() => 0);
        const { P, CP, SP, PP, SC, CS, SE, FC, CF } = CELL_;
        const CELL = { P, SP, SE, PP, CP, CS, SC, CF, FC, BF, BI, GB, GA, GI };
        await LOAD.status();
        return [FOLD, CELL];
    },
    FOLD_CELL_2_BF_BI: (FOLD, CELL) => {
        const { EF } = FOLD;
        const { CP, SP, SE, CF } = CELL;
        const BF = X.EF_SP_SE_CP_CF_2_BF(EF, SP, SE, CP, CF);
        const BI = new Map();
        for (const [i, F] of BF.entries()) { BI.set(F, i); }
        return { BF, BI };
    },

    FOLD_CELL_2_BF_BI_GB_GA: async (FOLD, CELL, limit, step_infer) => {
        const { EF, Ff, EA } = FOLD;
        const { SC, CS, SE, FC, CF } = CELL;
        await LOAD.status("building the Graph");
        const { BF, BI } = Y.FOLD_CELL_2_BF_BI(FOLD, CELL);
        const BT = X.BF_BI_EF_SE_CF_SC_2_BT(BF, BI, EF, SE, CF, SC);
        const CC = X.FC_BF_BI_BT_2_CC(FC, BF, BI, BT);
        await LOAD.status("building the Initial Assignments");
        const BA0 = SOLVER.EF_EA_Ff_BF_BI_2_BA0(EF, EA, Ff, BF, BI);
        const trans_count = { all: 0, reduced: 0 };
        const BA1 = SOLVER.initial_assignment(BA0, BF, BT, BI, FC, CF, CC, trans_count);



        const H = FOLD.H ?? [];
        const BA = SOL2.additional_assignment(H, EF, BA1, BF, BI, SE, CS, FC, CF, Ff);
        if (step_infer != undefined) {
            await LOAD.status("inferring the Assignments");
            const FOLD_from = step_infer.fold_cp;
            const CELL_from = step_infer.cell_cp;
            DIFF.infer_BA(FOLD_from, FOLD, CELL_from, BI, BA);
        }


        await LOAD.status("building the Components");
        const GB = SOLVER.get_components(BI, BF, BT, BA, FC, CF, CC, trans_count);
        await LOAD.status("Solving the Graph");
        const GA = SOLVER.solve(BI, BF, BT, BA.map(a => a), GB, FC, CF, CC, limit);
        const n = (!Array.isArray(GA)) ? 0 : GA.reduce((s, A) => {
            return s * BigInt(A.length);
        }, BigInt(1));
        if (n == 0) { return { BF, BI, GB, GA: undefined }; }

        return { BF, BI, GB, GA };
    },

    FOLD_2_CELL: (FOLD) => {
        const { Vf, EV, EF, FV } = FOLD;
        const L = EV.map((vs) => M.expand(vs, Vf));
        const [P, SP, SE, eps_i] = X.L_2_V_EV_EL(L);
        const [PP, CP] = X.V_EV_2_VV_FV(P, SP);
        const [SC, CS] = X.EV_FV_2_EF_FE(SP, CP);
        let [CF, FC] = X.EF_FV_P_SP_SE_CP_SC_2_CF_FC(EF, FV, P, SP, SE, CP, SC);

        return { P, CP, SP, PP, SC, CS, SE, FC, CF }
    },

    FOLD_2_CELL_D: async (FOLD, div = 1) => {
        const { Vf, EV, EF, FV } = FOLD;
        const L = EV.map((vs) => M.expand(vs, Vf));
        await LOAD.status("Building the Distorted Cell");
        const [P, SP, SE, eps_i] = Y.L_2_V_EV_EL(L, div);
        if (P.length == 0) { return; }
        const [PP, CP] = X.V_EV_2_VV_FV(P, SP);
        const [SC, CS] = X.EV_FV_2_EF_FE(SP, CP);
        await LOAD.status("Building Cell Topology");
        let [CF, FC] = X.EF_FV_P_SP_SE_CP_SC_2_CF_FC(EF, FV, P, SP, SE, CP, SC);

        return { P, CP, SP, PP, SC, CS, SE, FC, CF }
    },

    L_2_V_EV_EL: (L, div) => {
        const d = M.min_line_length(L) / div;
        const k = 3;
        const min_i = 3;
        const max_i = 28; // 3 + 25

        const evaluate = (i) => {
            const eps = d / (2 ** i);
            if (eps < M.FLOAT_EPS) return null;
            const [V, EV, EL] = X.L_eps_2_V_EV_EL(L, eps);
            return { V, EV, EL, vLen: V.length, eLen: EV.length };
        };

        //1st Phase
        let best_i = min_i;
        let prevV = -1, prevE = -1, count = 0;
        let coarse_candidates = [];

        for (let i = min_i; i <= max_i; i += 2) {
            const res = evaluate(i);
            if (!res || res.vLen === 0) continue;

            if (res.vLen === prevV && res.eLen === prevE) {
                count++;
            } else {
                count = 1;
                prevV = res.vLen;
                prevE = res.eLen;
            }

            coarse_candidates.push({ i, vLen: res.vLen, eLen: res.eLen });

            if (count >= k) {
                best_i = i;
                break;
            }
        }

        const start_i = Math.max(min_i, best_i - 4);
        const end_i = Math.min(max_i, best_i + 2);

        let k_ = 0, i_ = min_i, nV = 0, nE = 0;
        count = 0;

        //2nd phase
        for (let i = start_i; i <= end_i; ++i) {
            const res = evaluate(i);
            if (!res || res.vLen === 0) { nV = nE = count = 0; continue; }

            count = ((res.vLen == nV) && (res.eLen == nE)) ? (count + 1) : 1;
            nV = res.vLen;
            nE = res.eLen;

            if (count > k_) {
                k_ = count;
                i_ = i;
            }
            if (k_ >= k) break;
        }

        //fallbacks
        if (k_ === 0) { i_ = best_i; k_ = 1; }

        const eps_i = i_ - k_ + 1;
        const eps = d / (2 ** eps_i);
        const [V, EV, EL] = X.L_eps_2_V_EV_EL(L, eps);
        return [V, EV, EL, eps_i];
    },

    FOLD_2_CP: (FOLD, size = 400) => {
        const L_ = FOLD.UV.map((P) => M.expand(P, FOLD.V));
        const L = FOLD.EV.map((P) => M.expand(P, FOLD.V));
        return Y.segs_EA_2_CP(L.concat(L_), FOLD.EA, size);
    },

    segs_EA_2_CP: (L, EA, size) => {
        let doc = ""
        const a_map = { "B": 1, "F": 4, "M": 3, "V": 2, undefined: 4 };
        for (const [i, [p, q]] of L.entries()) {
            const x0 = p[0] * size - size * .5;
            const y0 = p[1] * size - size * .5;
            const x1 = q[0] * size - size * .5;
            const y1 = q[1] * size - size * .5;
            const a = a_map[EA[i]];
            doc = doc + a + " " + x0 + " " + y0 + " " + x1 + " " + y1 + "\r\n"
        }
        return doc;
    },

    FOLD_2_L: (FOLD) => {
        const L_ = FOLD.UV.map((P) => {
            const l = M.expand(P, FOLD.V)
            l.push("F");
            return l
        });
        const L = FOLD.EV.map((P) => {
            const l = M.expand(P, FOLD.V)
            l.push("F");
            return l
        });
        return L.concat(L_);
    },

    FOLD_2_PAPER: async (FOLD) => {
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
        return await Y.CP_2_FOLD_CELL(doc, 1)
    },

    FOLD_CELL_2_FO: (FOLD, CELL) => {
        const { Ff } = FOLD;
        const { BF, GB, GA, GI } = CELL;
        return Y.BF_GB_GA_GI_Ff_2_FO(BF, GB, GA, GI, Ff);
    },

    BF_GB_GA_GI_Ff_2_FO: (BF, GB, GA, GI, Ff) => {

        const edges = X.BF_GB_GA_GI_2_edges(BF, GB, GA, GI);
        return X.edges_Ff_2_FO(edges, Ff);
    },


    FV_V_2_Ff: (FV, V) => FV.map(fV => (M.polygon_area2(fV.map(i => V[i])) < 0)),

    CF_FO_Ff_2_CD: (CF, FC, FO, Ff) => {
        const Fids = Array(Ff.length).fill(0).map(() => new Map());
        for (let cId = 0; cId < CF.length; ++cId) {
            const Fs = CF[cId];
            for (let i = 0; i < Fs.length; ++i) {
                const fId = Fs[i];
                Fids[fId].set(cId, i);
            }
        }
        const Adj = CF.map((Fs) => Fs.map(() => []));

        for (const [f1, f2, o] of FO) {
            const cs1 = FC[f1];
            const cs2 = FC[f2];
            if (!cs1 || !cs2) continue;

            const [small, large] = cs1.length < cs2.length ? [cs1, cs2] : [cs2, cs1];
            const largeSet = new Set(large);

            const edge = ((Ff[f2] ? 1 : -1) * o >= 0) ? [f1, f2] : [f2, f1];
            const targetMap0 = Fids[edge[0]];
            const targetMap1 = Fids[edge[1]];

            for (const cId of small) {
                if (largeSet.has(cId)) {
                    const i = targetMap0.get(cId);
                    const j = targetMap1.get(cId);
                    if (i !== undefined && j !== undefined) {
                        Adj[cId][i].push(j);
                    }
                }
            }
        }
        return CF.map((F, cId) => {
            const S = [];
            const seen = F.map(() => false);
            const dfs = (i) => {
                if (seen[i]) { return; }
                seen[i] = true;
                for (const j of Adj[cId][i]) {
                    dfs(j);
                }
                S.push(F[i]);
            };
            for (let i = 0; i < F.length; ++i) {
                dfs(i);
            }
            console.assert(S.length == F.length);
            return S;
        });
    },


    FOLD_Stack_2_Fvisible: (FOLD, Stack) => {
        const { CF } = Y.FOLD_2_CELL(FOLD);
        const Ctop = CF.map((fis) => {
            const fis_ = fis.toSorted((fi, gi) => {
                const si = Stack.indexOf(fi);
                const ti = Stack.indexOf(gi);
                return si - ti;
            });
            return fis_[fis_.length - 1];
        });
        const Fvisible = FOLD.Ff.map(() => { false });
        for (const fi of Ctop) {
            Fvisible[fi] = true;
        }
        return Fvisible;
    },

    FOLD_CELL_2_STATE: async (FOLD, CELL) => {
        const { Ff } = FOLD;
        const { CF, FC, BF, GB, GA, GI } = CELL;
        if (GA == undefined) { return { Ctop: undefined, Cbottom: undefined, L: undefined }; }
        await LOAD.status("calc FO");
        const FO = Y.BF_GB_GA_GI_Ff_2_FO(BF, GB, GA, GI, Ff);
        const edges = FO.map(([f1, f2, o]) => {
            return M.encode(((Ff[f2] ? 1 : -1) * o >= 0) ? [f1, f2] : [f2, f1]);
        });
        await LOAD.status("serializing the Faces");
        const L = LIN.serialize(edges, Ff.length);
        L.S.reverse();
        await LOAD.status("Calculating Cells to Display");
        const CD = Y.CF_FO_Ff_2_CD(CF, FC, FO, Ff);
        const Ctop = CD.map(S => S[S.length - 1]);
        const Cbottom = CD.map(S => S[0]);

        return { Ctop, Cbottom, L };
    },

    Ctop_SC_SE_EF_Ff_EA_FE_2_SD: (Ctop, SC, SE, EF, Ff, EA, FE) => {

        const SD = SC.map((C, si) => {
            const F = C.map(ci => Ctop[ci]);
            if (F[0] == F[1]) { return "N"; }
            // borders of a state
            for (const fi of [F[0], F[1]]) {
                if ((fi != undefined)) {
                    for (const e0 of FE[fi]) {
                        if (SE[si].indexOf(e0) >= 0) {
                            const a = EA[e0]
                            if (a == "RM" || a == "RV" || a == "UF") {
                                return a;
                            };
                        }
                    }
                }
            }
            return "B";
        });
        return SD;
    },

    Ctop_CP_SC_SD_P_2_RP_RF: (Ctop, CP, SC, SD, P) => {
        const cn = Ctop.length;
        const CC = Array(cn).fill(0).map(() => []);
        for (let si = 0; si < SC.length; ++si) {
            const C = SC[si];
            if (C.length != 2) { continue; }
            const d = SD[si];
            if (SD[si][0] == "B") { continue; }
            if (SD[si] == "RM") { continue; }
            if (SD[si] == "RV") { continue; }
            if (SD[si] == "UF") { continue; }
            const [ci, cj] = C;
            CC[ci].push(cj);
            CC[cj].push(ci);
        }
        const RP = [];
        const RF = [];
        let ri = 0;
        const seen = Array(cn).fill(false);
        for (let ci = 0; ci < cn; ++ci) {
            const fi = Ctop[ci];
            if ((fi == undefined) || seen[ci]) { continue; }
            seen[ci] = true;
            const C = [ci];
            let i = 0;
            while (i < C.length) {
                for (const cj of CC[C[i]]) {
                    if (!seen[cj]) {
                        seen[cj] = true;
                        C.push(cj);
                    }
                }
                ++i;
            }
            const Adj = P.map(() => new Set());
            for (const ci of C) {
                const P_ = CP[ci];
                let pi = P_[P_.length - 1];
                for (const pj of P_) {
                    const A = Adj[pj];
                    if (A.has(pi)) {
                        A.delete(pi);
                    } else {
                        Adj[pi].add(pj);
                    }
                    pi = pj;
                }
            }
            let start;
            for (let i = 0; i < Adj.length; ++i) {
                if (Adj[i].size == 1) { start = i; break; }
            }
            const Q = [];
            let u = start;
            do {
                Q.push(u);
                let v;
                for (v of Adj[u]) { break; }
                u = v;
            } while (u != start);
            RP.push(Q);
            RF.push(fi);
        }
        return [RP, RF];
    },

}