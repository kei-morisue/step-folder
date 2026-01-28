
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
                    return "F";
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
        const L = L0.concat(L1)

        const [V, EV_, EL,] = X.L_2_V_EV_EL(L);

        const EA_ = EL.map(ls => DIFF.diff_a(
            ls, L0, F0.EA.concat(F0.UA), F1.EA.concat(F1.UA)))

        const EV = [];
        const UV = [];
        const EA = [];
        const UA = [];
        for (const [ei_, a_] of EA_.entries()) {
            if (a_ == "F" || a_ == "MM" || a_ == "VV") {
                UV.push(EV_[ei_]);
                UA.push(a_);
            }
            else {
                EV.push(EV_[ei_]);
                EA.push(a_);
            }
        }
        const [VV, FV] = X.V_EV_2_VV_FV(V, EV)
        const [EF, FE] = X.EV_FV_2_EF_FE(EV, FV);

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
        for (const vs of FV) {
            for (const v of vs) {
                Vc[v] = true;
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
        for (const [i, Fs] of FF_map.entries()) {
            if (Fs.length == 1) {
                if (F0.Ff[i] != Ff[Fs[0]]) {
                    FOLD.Ff = Ff.map(f => !f);
                    break;
                }
            }
        }
        const FOLD = { V, Vf, EV, EA, EF, FV, FE, Ff, VV, FU, UV, Vc, UA, FO }

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
}
