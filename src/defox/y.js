import { M } from "../flatfolder/math.js";
import { X } from "../flatfolder/conversion.js";
import { IO } from "../flatfolder/io.js";
import { SOLVER } from "../flatfolder/solver.js";

import { NOTE } from "../flatfolder/note.js";
import { LIN } from "../linefolder/linear.js";

// import { PAR } from "./parallel.js";

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


    FOLD_2_CELL: (FOLD) => {
        const { V, EV, EF, FV } = FOLD
        const L = EV.map((P) => M.expand(P, V));
        const [P, SP, SE, eps_i] = X.L_2_V_EV_EL(L);
        const [PP, CP] = X.V_EV_2_VV_FV(P, SP);
        const [SC, CS] = X.EV_FV_2_EF_FE(SP, CP);
        const [CF, FC] = X.EF_FV_SP_SE_CP_SC_2_CF_FC(EF, FV, SP, SE, CP, SC);
        const BF = X.CF_2_BF(CF);

        return { P, CP, SP, SC, SE, BF, FC, CF }
    },

    CP_2_FOLD_CELL: (doc, is_flip) => {
        const [Vf, VV, EV, EA, EF, FV, FE] =
            IO.doc_type_side_2_V_VV_EV_EA_EF_FV_FE(doc, "cp", is_flip);
        if (Vf == undefined) { return; }
        const [W, Ff] = X.V_FV_EV_EA_2_Vf_Ff(Vf, FV, EV, EA);
        const V = M.normalize_points(W);

        const L = EV.map((P) => M.expand(P, V));
        const [P, SP, SE, eps_i] = X.L_2_V_EV_EL(L);
        const eps = M.min_line_length(L) / (2 ** eps_i);
        const FOLD = { V, Vf, FV, EV, EF, FE, Ff, eps, EA };
        const [PP, CP] = X.V_EV_2_VV_FV(P, SP);
        const [SC, CS] = X.EV_FV_2_EF_FE(SP, CP);
        const [CF, FC] = X.EF_FV_SP_SE_CP_SC_2_CF_FC(EF, FV, SP, SE, CP, SC);
        const ExE = X.SE_2_ExE(SE);
        const ExF = X.SE_CF_SC_2_ExF(SE, CF, SC);
        const BF = X.CF_2_BF(CF);

        const BI = new Map();
        for (const [i, F] of BF.entries()) { BI.set(F, i); }
        NOTE.annotate(BF, "variables_faces");
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
        NOTE.count(n, "folded states");
        const GI = GB.map(() => 0);
        if (n > 0) {
            FOLD.FO = Y.BF_GB_GA_GI_Ff_2_FO(BF, GB, GA, GI, Ff);
        }

        const CELL = { P, SP, SE, PP, CP, CS, SC, CF, FC, BF, BI, GB, GA, GI };
        return [FOLD, CELL];
    },

    BF_GB_GA_GI_Ff_2_FO: (BF, GB, GA, GI, Ff) => {
        NOTE.time("Computing state");
        const edges = X.BF_GB_GA_GI_2_edges(BF, GB, GA, GI);
        return X.edges_Ff_2_FO(edges, Ff);
    },

    JSON_2_FOLD_CELL: (doc) => {
        const ex = JSON.parse(doc);
        const properties = [
            "vertices_coords", "faces_vertices",
            "faceOrders"
        ];
        const [V_org, FV, FO] = properties.map(property => {
            const val = ex[property];
            if (val == undefined) {
                NOTE.time(`FOLD file must contain ${property}, but not found`);
                return undefined;
            }
            return val;
        });
        const V = M.normalize_points(V_org);
        const [FOLD, CELL] = Y.V_FV_2_FOLD_CELL(V, FV);
        FOLD.FO = FO;
        const { Ff, EF, EV } = FOLD
        const edges = FO.map(([f1, f2, o]) => {
            return M.encode(((Ff[f2] ? 1 : -1) * o >= 0) ? [f1, f2] : [f2, f1]);
        });
        const edge_map = new Set(edges);
        const EA = EF.map(F => {
            if (F.length != 2) { return "B"; }
            const [i, j] = F;
            if (edge_map.has(M.encode([i, j]))) { return Ff[i] ? "M" : "V"; }
            if (edge_map.has(M.encode([j, i]))) { return Ff[i] ? "V" : "M"; }
            return "F";
        });
        FOLD.EA = EA;
        FOLD.Vf = X.V_FV_EV_EA_2_Vf_Ff(V, FV, EV, EA)[0];
        if (M.polygon_area2(M.expand(FOLD.FV[0], FOLD.Vf)) < 0) {
            FOLD.Vf = FOLD.Vf.map(v => M.add(M.refY(v), [0, 1]));
        }
        const v0 = FOLD.Vf[0];
        FOLD.Vf = FOLD.Vf.map(p => M.sub(p, v0));
        const [c1, s1] = FOLD.Vf[1];
        FOLD.Vf = FOLD.Vf.map(p => M.rotate_cos_sin(p, c1, -s1));
        FOLD.Vf = FOLD.Vf.map(p => M.rotate_cos_sin(p, 0, 1));
        FOLD.Vf = M.normalize_points(FOLD.Vf);
        return [FOLD, CELL];
    },
    FV_V_2_Ff: (FV, V) => FV.map(fV => (M.polygon_area2(fV.map(i => V[i])) < 0)),

    V_FV_2_FOLD_CELL: (V, FV) => {
        const Ff = Y.FV_V_2_Ff(FV, V);
        const EV_set = new Set();
        for (const fV of FV) {
            let i = fV.length - 1;
            for (let j = 0; j < fV.length; ++j) {
                EV_set.add(M.encode_order_pair([fV[i], fV[j]]));
                i = j;
            }
        }
        const EV = Array.from(EV_set).sort().map(k => M.decode(k));
        const [EF, FE] = X.EV_FV_2_EF_FE(EV, FV);
        const L = EV.map(vs => vs.map(i => V[i]));
        NOTE.time("Constructing points and segments from edges");
        const [P, SP, SE, eps_i] = X.L_2_V_EV_EL(L);
        const eps = M.min_line_length(L) / (2 ** eps_i);
        NOTE.annotate(P, "points_coords");
        NOTE.annotate(SP, "segments_points");
        NOTE.annotate(SE, "segments_edges");
        NOTE.lap();
        NOTE.time("Constructing cells from segments");
        const [PP, CP] = X.V_EV_2_VV_FV(P, SP);
        NOTE.annotate(CP, "cells_points");
        NOTE.lap();
        NOTE.time("Computing segments_cells");
        const [SC, CS] = X.EV_FV_2_EF_FE(SP, CP);
        NOTE.annotate(SC, "segments_cells");
        NOTE.annotate(CS, "cells_segments");
        NOTE.lap();
        NOTE.time("Making face-cell maps");
        const [CF, FC] = X.EF_FV_SP_SE_CP_SC_2_CF_FC(EF, FV, SP, SE, CP, SC);
        const BF = X.EF_SP_SE_CP_CF_2_BF(EF, SP, SE, CP, CF);
        const BI = new Map();
        for (const [i, F] of BF.entries()) { BI.set(F, i); }
        NOTE.annotate(BF, "variables_faces");
        NOTE.lap();
        const FOLD = { V, FV, EV, EF, FE, Ff, eps };
        const CELL = { P, SP, SE, PP, CP, CS, SC, CF, FC, BF, BI };
        return [FOLD, CELL];
    },
    FOLD_CELL_2_STATE: (FOLD, CELL, flip) => {
        const { Ff, FO } = FOLD;
        if (FO == undefined) { return undefined }
        const { P, SE, PP, CP, SC, CF } = CELL;
        const m = [0.5, 0.5];
        const Q = P.map(p => (flip ? M.add(M.refX(M.sub(p, m)), m) : p));
        const edges = FO.map(([f1, f2, o]) => {
            return M.encode(((Ff[f2] ? 1 : -1) * o >= 0) ? [f1, f2] : [f2, f1]);
        });
        const L = LIN.linearize(edges, Ff.length);
        const slider = document.getElementById("slider");

        const CD = X.CF_edges_2_CD(CF, edges);
        const Ctop = CD.map(S => flip ? S[0] : S[S.length - 1]);
        const Ccolor = Ctop.map(d => {
            if (d == undefined) { return undefined; }
            if (Ff[d] != flip) { return true; }
            else { return false; }
        });
        return { Q, CD, Ctop, Ccolor, L, edges };
    },

    PP_Ctop_CP_SC_2_Pvisible: (P, PP, Ctop, CP, SC) => {
        // computes boolean whether each vertex isvisible from top
        const SC_map = new Map();
        for (const [i, C] of CP.entries()) {
            for (const [j, p1] of C.entries()) {
                const p2 = C[(j + 1) % C.length];
                SC_map.set(M.encode([p2, p1]), i);
            }
        }
        return PP.map((V, i) => {
            const F = [];
            const A = V.map(j => M.angle(M.sub(P[j], P[i])));
            for (const j of V) {
                const c = SC_map.get(M.encode([i, j]));
                F.push((c == undefined) ? -1 : Ctop[c]);
            }
            const F_set = new Map();
            for (let i = 0; i < F.length; ++i) {
                const f = F[i];
                let ang = F_set.get(f);
                if (ang == undefined) { ang = 0; }
                ang += A[i] - A[(i - 1) % A.length];
                F_set.set(f, ang);
            }
            if (F_set.size > 2) {
                return true;
            }
            for (const [f, ang] of F_set.entries()) {
                if (Math.abs(Math.abs(ang) - Math.PI) > 0.001) {
                    return true;
                }
            }
            return false;
        });
    },

    Ctop_SC_SE_EF_Ff_EA_2_SD: (Ctop, SC, SE, EF, Ff, EA) => {
        const EF_set = new Set(
            EF.filter(F => F.length == 2).map(F => M.encode_order_pair(F)));
        const FE_map = new Map()
        for (const [ei, F] of EF.entries()) {
            FE_map.set(M.encode_order_pair(F), ei)
        }

        const SD = SC.map((C, si) => {
            const F = C.map(ci => Ctop[ci]);
            if (F[0] == F[1]) { return "N"; }
            // borders of a state
            if ((F[0] == undefined) || (F[1] == undefined)) { return "B"; }
            const flips = F.map(fi => Ff[fi]);
            const pair = M.encode_order_pair(F);
            //creases inside the state
            if ((flips[0] == flips[1]) &&
                EF_set.has(pair)) {
                const ei = FE_map.get(pair);

                const a = EA[ei]
                if (a != undefined) {
                    return a;
                }
            }
            let left = false, right = false;
            // edges in the state
            for (const ei of SE[si]) {
                const [fi, fj] = EF[ei];
                if (Ff[fi] == Ff[fj]) { continue; }
                if ((fi == F[0]) || (fj == F[0])) { left = true; }
                if ((fi == F[1]) || (fj == F[1])) { right = true; }
            }
            if (left == right) { return "B"; }
            return left ? "BL" : "BR";
        });
        return SD;
    },
}