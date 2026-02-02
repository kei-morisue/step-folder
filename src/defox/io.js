import { NOTE } from "../flatfolder//note.js";
import { SVG } from "../flatfolder//svg.js";
import { IO } from "../flatfolder/io.js";
import { M } from "../flatfolder/math.js";
import { X } from "../flatfolder/conversion.js";
import { N } from "./nath.js";


export const IO3 = {    // INPUT-OUTPUT
    write: (svg_id, name) => {
        const img = new Blob([document.getElementById(svg_id).outerHTML], {
            type: "image/svg+xml"
        });
        const ext = "svg";
        const link = document.createElement("a");
        const button = document.createElement("input");
        link.appendChild(button);
        link.setAttribute("download", `${name}.${ext}`);
        link.setAttribute("href", window.URL.createObjectURL(img));
        button.setAttribute("type", "button");
        button.click();

    },

    save: (data, name) => {
        const json = new Blob([JSON.stringify(data, undefined, 2)], {
            type: "application/json"
        })
        const ext = "defox";
        const link = document.createElement("a");
        const button = document.createElement("input");
        link.appendChild(button);
        link.setAttribute("download", `${name}.${ext}`);
        link.setAttribute("href", window.URL.createObjectURL(json));
        button.setAttribute("type", "button");
        button.click();
    },

    cp_2_V_VV_EV_EA_EF_FV_FE: (doc) => {
        let V, EV_, EV, EA_, EA, EF, FE, VV, FV;
        let UV, FU;
        let L, EL;
        L = IO.CP_2_L(doc);

        [V, EV_, EL,] = X.L_2_V_EV_EL(L);
        EA_ = EL.map((l) => {
            const a = L[l[0]][2];
            return (a == "M") ? "V" : ((a == "V") ? "M" : a);
        });

        V = M.normalize_points(V);
        EV = [];
        UV = [];
        EA = [];
        for (const [ei_, a_] of EA_.entries()) {
            if (a_ == "F") {
                UV.push(EV_[ei_]);
            }
            else {
                EV.push(EV_[ei_]);
                EA.push(a_);
            }
        }

        [VV, FV] = X.V_EV_2_VV_FV(V, EV);

        [EF, FE] = X.EV_FV_2_EF_FE(EV, FV);     // remove holes


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
        FU = FV.map(_ => []);
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
        const UA = UV.map(_ => "F");
        return [V, VV, EV, EA, EF, FV, FE, UV, FU, Vc, UA];
    },
}