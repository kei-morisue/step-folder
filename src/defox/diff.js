import { M } from "../flatfolder/math.js";
import { X } from "../flatfolder/conversion.js";


import { N } from "./nath.js"
import { Y } from "./y.js"

export const DIFF = {
    diff_a: (ls, L0, EA0, EA1) => {
        const i = ls[0]
        if (ls.length == 1) {
            if (i < L0.length) {
                return EA0[i] == "F" ? "F" : "UF";
            }
            const a1 = EA1[i - L0.length]
            switch (a1) {
                case "F":
                    return "FF";
                case "B":
                    return "B";
                case "M":
                    return "MM";
                case "V":
                    return "VV";
            }
        }
        if (ls.length > 2) { debugger; }
        const j = ls[1]
        const [i0, i1] = i < j ? [i, j - L0.length] : [j, i - L0.length]
        const [a0, a1] = [EA0[i0], EA1[i1]]
        switch (a0) {
            case "F":
                return a1 == "F" ? "F" : a1 == "M" ? "MM" : "VV";
            case "B":
                return "B"
            case "M":
                return a1 == "F" ? "UF" : a1 == "V" ? "RV" : a1
            case "V":
                return a1 == "F" ? "UF" : a1 == "M" ? "RM" : a1
        }

    },
    diff: (F0, F1, LIN0) => {
        const U0 = F0.UV.map(vs => vs.map(i => F0.V[i]));
        const U1 = F1.UV.map(vs => vs.map(i => F1.V[i]));
        const L0 = F0.EV.map(vs => vs.map(i => F0.V[i])).concat(U0);
        const L1 = F1.EV.map(vs => vs.map(i => F1.V[i])).concat(U1);
        let L = L0.concat(L1)

        const [V_, UV_, UL,] = X.L_2_V_EV_EL(L);

        const UA_ = UL.map(ls => DIFF.diff_a(
            ls, L0, F0.EA.concat(F0.UA), F1.EA.concat(F1.UA)))

        let [V, EV, EA] = DIFF.trim(V_, UV_, UA_, ["UF", "B", "RM", "RV", "M", "V"]);

        let [VV, FV] = X.V_EV_2_VV_FV(V, EV)
        let [EF, FE] = X.EV_FV_2_EF_FE(EV, FV);
        if (FV.length > 1) {
            FV = FV.filter((F, i) => !FE[i].every(e => (EA[e] == "B")));
        }
        if (FV.length != FE.length) {           // recompute face maps
            [EF, FE] = X.EV_FV_2_EF_FE(EV, FV);
        }
        for (const [i, F] of EF.entries()) {    // boundary edge assignment
            if (F.length == 1) {
                EA[i] = "B";
            }
        }


        const [V_MV, UV_MV, UA_MV] = DIFF.trim(V_, UV_, UA_, ["FF", "MM", "VV"]);
        const UV_F = [];
        for (const [ei, a] of UA_.entries()) {
            if (a == "F") {
                UV_F.push(UV_[ei]);
            }
        }


        const UV = [];
        const UA = [];
        DIFF.add_segments(V, UV, UA, V_, UV_F, UV_F.map(() => "F"));
        DIFF.add_segments(V, UV, UA, V_MV, UV_MV, UA_MV);



        const FU = FV.map(_ => []);
        for (const [ui, vv] of UV.entries()) {
            const c = M.centroid(M.expand(vv, V));
            for (const [fi, vs] of FV.entries()) {
                if (N.is_inside(c, M.expand(vs, V))) {
                    FU[fi].push(ui);
                    break;
                };
            }
        }

        const Vc = V.map(_ => false);
        for (const [fi, uis] of FU.entries()) {
            for (const ui of uis) {
                const [pi, qi] = UV[ui];
                const [p, q] = M.expand(UV[ui], V);
                const F = M.expand(FV[fi], V);
                let a = F[F.length - 1];
                for (let i = 0; i < F.length; i++) {
                    const b = F[i];
                    if (M.on_segment(a, b, p, 1e-8)) {
                        Vc[pi] = true;
                    }
                    if (M.on_segment(a, b, q, 1e-8)) {
                        Vc[qi] = true;
                    }
                    a = b;
                }
            }
        }
        for (const [ui, [p_i, q_i]] of UV.entries()) {
            const a = UA[ui];
            if (a == "FF" || a == "MM" || a == "VV") {
                Vc[p_i] = false;
                Vc[q_i] = false;
            }
        }

        const [Vf, Ff] = Y.V_FV_EV_EA_FU_UV_2_Vf_Ff(V, FV, EV, EA, FU, UV)
        const FF_map = F0.FV.map((vs) => [])
        for (const [i, vs] of FV.entries()) {
            const c = M.interior_point(M.expand(vs, V))
            for (const [j, ws] of F0.FV.entries()) {
                if (N.is_inside(c, M.expand(ws, F0.V))
                ) {
                    FF_map[j].push(i);
                    break;
                }
            }
        }

        const FOLD = { V, Vf, EV, EA, EF, FV, FE, Ff, VV, FU, UV, Vc, UA }
        for (const [i, Fs] of FF_map.entries()) {
            if (Fs.length == 1) {
                if (F0.Ff[i] != Ff[Fs[0]]) {
                    FOLD.Ff = Ff.map(f => !f);
                    break;
                }
            }
        }

        if (LIN0 == undefined) { return [FOLD, undefined]; }
        const S = LIN0.S.map((f0) => {
            return FF_map[f0][0];
        }
        );
        const cycle = LIN0.cycle.map((s) => {
            const [f, g] = M.decode(s);
            return M.encode([FF_map[f][0], FF_map[g][0]]);
        });
        return [FOLD, { S, cycle }];
    },

    trim: (V_, UV_, UA_, filter = []) => {
        let L = [];
        const as = ["UF", "B", "RM", "RV", "M", "V"].concat(filter);
        for (const [ei, a] of UA_.entries()) {
            if (as.indexOf(a) >= 0) {
                const [pi, qi] = UV_[ei];
                L.push([V_[pi], V_[qi], a]);
            }
        }

        const [V, EV_, EL,] = X.L_2_V_EV_EL(L);
        const EA = [];
        const EV = [];
        for (const [ei, ls] of EL.entries()) {
            const a = L[ls[0]][2];
            if (filter.indexOf(a) >= 0) {
                EA.push(a);
                EV.push(EV_[ei]);
            }
        }
        return [V, EV, EA];
    },

    add_segments: (V, UV, UA, V_ref, UV_add, UA_add) => {
        for (const [ei, a] of UA_add.entries()) {
            const [pi_, qi_] = UV_add[ei];
            const [p, q] = [V_ref[pi_], V_ref[qi_]];
            let pi = -1;
            for (const [vi, v] of V.entries()) {
                if (M.distsq(p, v) < 1e-16) {
                    pi = vi
                    break;
                }
            }
            if (pi < 0) {
                V.push(p);
                pi = V.length - 1;
            }
            let qi = -1;
            for (const [vi, v] of V.entries()) {
                if (M.distsq(q, v) < 1e-16) {
                    qi = vi
                    break;
                }
            }
            if (qi < 0) {
                V.push(q);
                qi = V.length - 1;
            }
            UV.push([pi, qi]);
            UA.push(a);
        }

    },

    get_VV_map: (V_from, V_to) => {
        const VV_map = V_from.map(() => undefined);
        V_to.map((v, i) => {
            for (const [w_i, w] of V_from.entries()) {
                const d = M.distsq(v, w);
                if (d < 1e-12) {
                    VV_map[w_i] = i;
                    return;
                }
            }
        });
        return VV_map;
    },

    get_FF_map: (VV_map, FV_from, FV_to) => {
        const FF_map = FV_from.map(() => undefined);
        const FV_set = FV_from.map((vs) => { return new Set(vs.map((vi) => VV_map[vi])) });

        FV_to.map((vs, fi) => {
            const v_set = new Set(vs);
            for (const [g_i, w_set] of FV_set.entries()) {
                const d = w_set.difference(v_set);
                if (d.size == 0) {
                    FF_map[g_i] = fi;
                    return;
                }
            }
        });
        return FF_map;
    },
    overwrite_FO: (FF_map, FO_from, FO_to, Ff_from, Ff_to) => {

        const FO_map = new Map();
        FO_to.map(([f1, f2, o], i) => {
            FO_map.set(M.encode_order_pair([f1, f2]), i);
        });

        for (const [, [f1, f2, o]] of FO_from.entries()) {
            const g1 = FF_map[f1];
            const g2 = FF_map[f2];
            if (g1 == undefined || g2 == undefined) {
                continue;
            }
            const i_to = FO_map.get(M.encode_order_pair([g1, g2]));
            if (i_to == undefined) {
                continue;
            }
            const [Ff1_to, Ff2_to] = [Ff_to[g1], Ff_to[g2]];
            if (Ff1_to ^ Ff2_to != Ff_from[f1] ^ Ff_from[f2]) {
                continue;
            }
            FO_to[i_to] = [g1, g2, Ff2_to];
        }
    },

    FO_GB_GA_BF_2_GI: (FO, GB, GA, BF, GI) => {
        const FO_map = new Map();
        FO.map(([f1, f2, o], i) => {
            FO_map.set(M.encode_order_pair([f1, f2]), i);
        });
        for (const [i, B] of GB.entries()) {
            const orders = [];
            for (const [j, F] of B.entries()) {
                const [f1, f2] = M.decode(BF[F]);
                const [g1, g2] = FO[FO_map.get(BF[F])];

                const o = f1 == g1 ? 1 : 2;
                orders.push(o);
            }
            const enc = M.bit_encode(orders);
            for (const [ai, a] of GA[i].entries()) {
                if (a == enc) {
                    GI[i] = ai;
                }
            }

        }
    },
    infer_GI: (FOLD_from, FOLD_to, CELL_from, CELL_to) => {
        const VV_map = DIFF.get_VV_map(FOLD_from.V, FOLD_to.V);
        const FF_map = DIFF.get_FF_map(VV_map, FOLD_from.FV, FOLD_to.FV);

        const FO_from = Y.FOLD_CELL_2_FO(FOLD_from, CELL_from);
        const FO_to = Y.FOLD_CELL_2_FO(FOLD_to, CELL_to);
        DIFF.overwrite_FO(FF_map, FO_from, FO_to, FOLD_from.Ff, FOLD_to.Ff);
        const { GB, GA, BF, GI } = CELL_to;
        DIFF.FO_GB_GA_BF_2_GI(FO_to, GB, GA, BF, GI);
    },

    FOLD_FOLD_2_FG: (FOLD_from, FOLD_to) => {
        const { FV, EV, EA, V, EF, FE } = FOLD_to;
        const L_from = FOLD_from.EV.map(vs => vs.map(i => FOLD_from.V[i]));
        const L_to = EV.map(vs => vs.map(i => V[i]));
        let L = L_from.concat(L_to);
        const [, , EL,] = X.L_2_V_EV_EL(L);
        const EB = EA.map(() => true);
        for (const ls of EL) {
            if (ls.length == 2) {
                const [l0, l1] = ls;
                if (l0 < L_from.length && l1 >= L_from.length) {
                    const a_from = FOLD_from.EA[l0];
                    const a_to = EA[l1 - L_from.length];
                    EB[l1 - L_from.length] = a_from != a_to;
                }
                if (l1 < L_from.length && l0 >= L_from.length) {
                    const a_from = FOLD_from.EA[l1];
                    const a_to = EA[l0 - L_from.length];
                    EB[l0 - L_from.length] = a_from != a_to;
                }

            }
        }
        let group = -1;
        const FG = FV.map(() => undefined);
        for (const [fi, eis] of FE.entries()) {
            if (FG[fi] != undefined) { continue; }
            group++;
            FG[fi] = group;
            let stack = eis.map(ei => [ei, fi]);
            let stack_idx = 0;
            while (stack.length > stack_idx) {
                const [ei, f0] = stack[stack_idx];
                if (!EB[ei]) {
                    const [g1, g2] = EF[ei];
                    const f_pair = (g1 == f0) ? g2 : g1;
                    if (f_pair != undefined) {
                        if (FG[f_pair] == undefined) {
                            FG[f_pair] = group;
                            stack = stack.concat(FE[f_pair].map(ei => [ei, f_pair]));
                        }
                    }
                }
                stack_idx++;
            }
        }
        return FG;
    },

    infer_BA: (FOLD_from, FOLD_to, CELL_from, BI_to, BA_to) => {
        const VV_map = DIFF.get_VV_map(FOLD_from.V, FOLD_to.V);
        const FF_map = DIFF.get_FF_map(VV_map, FOLD_from.FV, FOLD_to.FV);
        const FG = DIFF.FOLD_FOLD_2_FG(FOLD_from, FOLD_to);
        const edges = X.BF_GB_GA_GI_2_edges(CELL_from.BF, CELL_from.GB, CELL_from.GA, CELL_from.GI);
        for (const edge of edges) {
            const [f1, f2] = M.decode(edge);
            const [g1, g2] = [FF_map[f1], FF_map[f2]];
            if (g1 == undefined || g2 == undefined) {
                continue;
            }
            const key = M.encode_order_pair([g1, g2]);
            const bi = BI_to.get(key);
            if (bi == undefined) {
                continue;
            }
            if (BA_to[bi] != 0) {
                continue;
            }
            const [g1_,] = M.decode(key);
            if (FG[g1] != FG[g2]) {
                continue;
            }
            const same_side = (FOLD_to.Ff[g1] == FOLD_from.Ff[f1]);
            if (g1 == g1_) {
                BA_to[bi] = same_side ? 1 : 2;
            }
            else {
                BA_to[bi] = same_side ? 2 : 1;
            }
        }
    }
}
