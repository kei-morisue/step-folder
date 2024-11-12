import { M } from "../flatfolder/math.js";
import { X } from "../flatfolder/conversion.js";
import { SOLVER } from "../flatfolder/solver.js";
import { NOTE } from "../flatfolder/note.js";
import { SVG } from "../flatfolder/svg.js";

export const DIST = {    // STATE DISTORTER
    scale: .5,
    rotation: .5,
    strength: .5,
    T0: true,
    T1: true,
    T2: true,
    T3: true,
    refresh: () => {
        DIST.scale = .5;
        DIST.rotation = .5;
        DIST.strength = .5;
        DIST.T0 = true;
        DIST.T1 = true;
        DIST.T2 = true;
        DIST.T3 = true;
    },
    affine: (x, T) => {
        const { A, b } = T
        const Ax = DIST.matprod(A, x)
        return M.add(Ax, b);
    },

    matprod: (A, x) => {
        return [M.dot(A[0], x), M.dot(A[1], x)]
    },
    tilt: () => {
        return 1 + (DIST.scale - 0.5) * DIST.mul()
    },
    twist: () => { return (DIST.rotation - 0.5) * Math.PI * 0.1 * DIST.mul() },
    mul: () => { return 1.01 ** (2 - 1 / DIST.strength) },
    FOLD_2_VD: (V, Vf) => {
        const s = DIST.tilt();
        const t = DIST.twist();
        const co = Math.cos(t)
        const si = Math.sin(t)
        const T = { A: [[s * co, -si * s], [s * si, s * co]], b: [0, 0] }
        return Vf.map((vf, i) => { return M.add(V[i], M.sub(DIST.affine(vf, T), vf)) });
    },
    infer_FO: (FOLD, CELL_D) => {
        //Solving only with FULL Constraints
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
            return X.edges_Ff_2_FO(X.BF_GB_GA_GI_2_edges(BF, GB, GA, GI), Ff)
        }
        return
    },


    write: (FOLD) => {
        const { V, Vf, EV, EA, FV, FO } = FOLD;
        const path = document.getElementById("import").value.split("\\");
        const name = path[path.length - 1].split(".")[0];
        FOLD = {
            file_spec: 1.1,
            file_creator: "flat-distorter",
            file_title: `${name}_dist`,
            file_classes: ["singleModel"],
            vertices_coords: V,
            edges_vertices: EV,
            edges_assignment: EA,
            faces_vertices: FV,
        };
        const data = {};
        if (FO != undefined) {
            FOLD.faceOrders = FO;   // TODO: remove implied face orders?
        }
        data.fold = new Blob([JSON.stringify(FOLD, undefined, 2)], {
            type: "application/json"
        });
        data.svg = new Blob([document.getElementById("output").outerHTML], {
            type: "image/svg+xml"
        });
        data.log = new Blob([NOTE.lines.join("\n")], {
            type: "text/plain"
        });
        const ex = SVG.clear("export");
        for (const [type, ext] of [
            ["fold", "fold"],
            ["svg", "svg"],
            ["log", "txt"]
        ]) {
            const link = document.createElement("a");
            const button = document.createElement("input");
            ex.appendChild(link);
            link.appendChild(button);
            link.setAttribute("download", `${name}_dist.${ext}`);
            link.setAttribute("href", window.URL.createObjectURL(data[type]));
            button.setAttribute("type", "button");
            button.setAttribute("value", type);
        }
    },
}