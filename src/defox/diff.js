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

        L = [];
        for (const [ei_, a_] of UA_.entries()) {
            if (a_ == "FF" || a_ == "F" || a_ == "MM" || a_ == "VV") {
                continue;
            }
            const [pi, qi] = UV_[ei_];
            L.push([V_[pi], V_[qi], a_]);
        }

        let [V, EV, EL,] = X.L_2_V_EV_EL(L);
        let EA = EL.map(ls => L[ls[0]][2]);

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

        const UV = [];
        const UA = [];
        for (const [ei_, a_] of UA_.entries()) {
            if (a_ == "FF" || a_ == "F" || a_ == "MM" || a_ == "VV") {
                const [pi_, qi_] = UV_[ei_];
                const [p, q] = [V_[pi_], V_[qi_]];
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
                UA.push(a_);
            }
        }



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
        const FO = []
        for (const [, [f1, f2, o]] of F0.FO.entries()) {
            const gi = FF_map[f1][0];
            const hi = FF_map[f2][0];
            FO.push([gi, hi, o])
        }
        const FOLD = { V, Vf, EV, EA, EF, FV, FE, Ff, VV, FU, UV, Vc, UA, FO }
        for (const [i, Fs] of FF_map.entries()) {
            if (Fs.length == 1) {
                if (F0.Ff[i] != Ff[Fs[0]]) {
                    FOLD.Ff = Ff.map(f => !f);
                    break;
                }
            }
        }

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


    infer_FO: (F_origin, F_apply) => {
        const { V, FV } = F_apply;
        const FF_map = F_origin.FV.map((vs) => [])
        for (const [i, vs] of FV.entries()) {
            const c = M.interior_point(M.expand(vs, V))
            for (const [j, ws] of F_origin.FV.entries()) {
                if (N.is_inside(c, M.expand(ws, F_origin.V))
                ) {
                    FF_map[j].push(i);
                    break;
                }
            }
        }
        const FO = []
        for (const [, [f1, f2, o]] of F_origin.FO.entries()) {
            const gi = FF_map[f1][0];
            const hi = FF_map[f2][0];
            FO.push([gi, hi, o])
        }
        F_apply.FO = FO;
    }
}
