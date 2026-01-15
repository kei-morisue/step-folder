
import { M } from "../flatfolder/math.js";
import { X } from "../flatfolder/conversion.js";

import { NOTE } from "../flatfolder/note.js";


import { N } from "./nath.js"
export const DIFF = {

    diff: (F0, F1, LIN0) => {
        const L0 = F0.EV.map(vs => vs.map(i => F0.Vf[i]));
        const L1 = F1.EV.map(vs => vs.map(i => F1.Vf[i]));
        const L = L0.concat(L1)
        NOTE.time("Constructing points and segments from edges");
        const [Vf, EV, EL, eps_i] = X.L_2_V_EV_EL(L);
        const eps = M.min_line_length(L) / (2 ** eps_i);

        const EA = EL.map(ls => {
            const i = ls[0]
            if (ls.length == 1) {
                if (i < L0.length) {
                    return F0.EA[i] == "F" ? "F" : "UF";
                }
                const a1 = F1.EA[i - L0.length]
                switch (a1) {
                    case "F":
                        return "F";
                    case "B":
                        return "B"
                    case "M":
                        return "MM"
                    case "V":
                        return "VV"
                }
            }
            if (ls.length > 2) { debugger; }
            const j = ls[1]
            const [i0, i1] = i < j ? [i, j - L0.length] : [j, i - L0.length]
            const [a0, a1] = [F0.EA[i0], F1.EA[i1]]
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
        })

        const [VV, FV] = X.V_EV_2_VV_FV(Vf, EV)
        const [EF, FE] = X.EV_FV_2_EF_FE(EV, FV);
        const [V, Ff] = X.V_FV_EV_EA_2_Vf_Ff(Vf, FV, EV, EA)
        const FOLD = { V, Vf, EV, EA, EF, FV, FE, eps, Ff, VV }
        const FF_map = F0.FV.map(vs => [])
        for (const [i, vs] of FV.entries()) {
            const c = M.interior_point(M.expand(vs, Vf))
            for (const [j, ws] of F0.FV.entries()) {
                if (N.is_inside(c, M.expand(ws, F0.Vf))
                ) {
                    FF_map[j].push(i)
                    continue
                }
            }
        }
        for (const [i, Fs] of FF_map.entries()) {
            if (Fs.length == 1) {
                if (F0.Ff[i] != Ff[Fs[0]]) {
                    FOLD.Ff = Ff.map(f => !f);
                    continue
                }
                continue
            }
        }
        if (!LIN0) {
            const CL = EV.map((P) => M.expand(P, V));
            const [P, SP, SE,] = X.L_2_V_EV_EL(CL);
            const [PP, CP] = X.V_EV_2_VV_FV(P, SP);
            const [SC, CS] = X.EV_FV_2_EF_FE(SP, CP);
            const [CF, FC] = X.EF_FV_SP_SE_CP_SC_2_CF_FC(EF, FV, SP, SE, CP, SC);
            const BF = X.CF_2_BF(CF);
            const BI = new Map();
            for (const [i, F] of BF.entries()) { BI.set(F, i); }
            const CELL = { P, SP, SE, PP, CP, CS, SC, CF, FC, BF, BI };

            const FO = []
            for (const [, [f1, f2, o]] of F0.FO.entries()) {
                for (const [, gi] of FF_map[f1].entries()) {
                    for (const [, hi] of FF_map[f2].entries()) {
                        if (BF.includes(M.encode_order_pair([gi, hi]))) {
                            FO.push([gi, hi, o])
                        }
                    }
                }
            }
            FOLD.FO = FO
            return [FOLD, CELL, undefined]
        }

        const LIN = LIN0.map((fs) => {
            const f1 = []
            for (const [, f] of fs.entries()) {

                for (const [, f0] of FF_map[f].entries()) {
                    f1.push(f0);
                }
            }
            return f1;
        }
        );
        if (FOLD.Ff[0] == Ff[FF_map[0][0]]) {
            LIN.reverse();
        }
        return [FOLD, undefined, LIN];
    },
}
