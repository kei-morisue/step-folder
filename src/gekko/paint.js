import { SVG } from "../flatfolder/svg.js";
import { M } from "../flatfolder/math.js";
import { X } from "../flatfolder/conversion.js";
import { IO } from "../flatfolder/io.js";


import { N } from "../defox/nath.js";
import { PRJ } from "../defox/project.js";
import { STEP } from "../defox/step.js";
import { Y } from "../defox/y.js";
import { IO3 } from "../defox/io.js";



import { L } from "../cyborg/lath.js";
import { DRAW } from "../cyborg/draw.js";
import { Z } from "../cyborg/z.js";
import { PAINT as C_PAINT } from "../cyborg/paint.js";




export const PAINT = {
    input_a: "V",
    current_mode: "input_angle",
    bind_angle: Math.PI / 8,

    V: [],
    EV: [],
    EA: [],
    segs: [],


    V_0: [],
    EV_0: [],
    EA_0: [],
    segs_0: [],

    UV_0: [],
    UA_0: [],
    unfold_0: [],

    VK: [],
    svg: undefined,
    svg_selection: undefined,
    svg_validation: undefined,
    segment: -1,
    vertex: undefined,
    v0: undefined,
    v1: undefined,
    v2: undefined,

    is_invalid: false,
    cx: .5,
    cy: .5,
    scale: 1,
    saves: [],
    save_idx: 0,

    radius: {
        bind: 0.05,
    },
    color: {
        "M": "red",
        "V": "blue",
        "F": "gray",
        "B": "black"
    },


    initialize: async (FOLD, svg, catalyst = undefined) => {
        PAINT.segment = -1;
        PAINT.vertex = -1;
        PAINT.v0 = undefined;
        PAINT.v1 = undefined;
        PAINT.v2 = undefined;
        const { V, EV, EA, UA, UV } = FOLD;
        PAINT.V_0 = V;
        PAINT.EV_0 = EV;
        PAINT.EA_0 = EA.map((a) => {
            return a == "B" ? "B" : "F"
        });
        PAINT.segs_0 = EV.map((vs) => {
            return M.expand(vs, V);
        });

        PAINT.UV_0 = UV;
        PAINT.UA_0 = UA.map(() => "F");
        PAINT.unfold_0 = UV.map((vs) => {
            return M.expand(vs, V);
        });


        if (catalyst == undefined) {
            const [FOLD_,] = await Y.FOLD_2_PAPER(FOLD);
            PAINT.V = FOLD_.V;
            PAINT.EA = FOLD_.EA;
            PAINT.EV = FOLD_.EV;
            PAINT.segs = FOLD_.EV.map((vs) => {
                return M.expand(vs, FOLD_.V);
            });

        } else {
            PAINT.V = catalyst.V;
            PAINT.EA = catalyst.EA;
            PAINT.EV = catalyst.EV;
            PAINT.segs = PAINT.EV.map((vs) => {
                return M.expand(vs, PAINT.V);
            });

        }


        PAINT.svg = svg;
        PAINT.VK = [];
        PAINT.is_invalid = false;
        PAINT.saves = [];
        PAINT.save_idx = 0;
        const CP = Z.segs_2_CP(PAINT.segs, PAINT.EA);
        PAINT.update_cp(CP);
        PAINT.record();
    },

    get_vertices: () => {

        return PAINT.V_0.concat(PAINT.V)
    },

    get_catalyst: () => {
        const doc = Y.segs_EA_2_CP(
            PAINT.segs.concat(PAINT.segs_0).concat(PAINT.unfold_0),
            PAINT.EA.concat(PAINT.EA_0).concat(PAINT.UA_0),
            1.0);
        const [V_, VV_, EV_, EA, EF, FV_, FE] =
            IO.doc_type_side_2_V_VV_EV_EA_EF_FV_FE(doc, "cp", true);
        if (V_ == undefined) { return; }
        const [Vf_, Ff] = X.V_FV_EV_EA_2_Vf_Ff(V_, FV_, EV_, EA);


        const Vf = PAINT.V_0.map(() => undefined);
        const W = M.normalize_points(V_);
        for (const [i, v] of PAINT.V_0.entries()) {
            for (const [j, v0] of W.entries()) {
                if (Math.abs(M.distsq(v0, v)) < M.FLOAT_EPS) {
                    Vf[i] = Vf_[j];
                    break;
                }
            }
        }

        const CATAL = {
            Vf,
            L: PAINT.segs,
            EA: PAINT.EA,
            EV: PAINT.EV,
            V: PAINT.V,
        };
        return CATAL;
    },

    set_mode: (mode) => {
        PAINT.current_mode = mode;
    },

    all: (is_delete) => {
        if (is_delete) {
            const F0 = { V: PAINT.V, EA: PAINT.EA, EV: PAINT.EV };
            const [F,] = Y.FOLD_2_PAPER(F0);
            PAINT.V = F.V;
            PAINT.EV = F.EV;
            PAINT.EA = F.EA.map((a) => {
                return a == "B" ? "B" : "V";
            });
            PAINT.segs = PAINT.EV.map((vs) => { return M.expand(vs, PAINT.V) });
            return;
        }
        PAINT.V = PAINT.V_0;
        PAINT.EV = PAINT.EV_0;
        PAINT.EA = PAINT.EA_0.map((a) => {
            return a == "B" ? "B" : "V";
        });
        PAINT.segs = PAINT.segs_0;
        return
    },

    get_T: () => {
        const zoom = STEP.get_zoom(PAINT.scale);
        return STEP.get_T(false, 0.5, zoom, PAINT.cx, PAINT.cy);
    },
    redraw: () => {
        const T = PAINT.get_T();
        const segs = PAINT.segs;
        const assigns = PAINT.EA
        DRAW.draw_cp(PAINT.segs_0, PAINT.EA_0, SVG.clear(PAINT.svg.id), T);
        DRAW.draw_cp(segs, assigns, PAINT.svg, T);
        PAINT.svg_selection = SVG.append("g", PAINT.svg, { id: "gekko_selection" });
        PAINT.svg_validation = SVG.append("g", PAINT.svg, { id: "gekko_validation" });
        DRAW.draw_VK(PAINT.V, PAINT.VK, PAINT.svg, T);
    },

    validate: () => {
        PAINT.VK = [];
        PAINT.is_invalid = false;
        const V = PAINT.V;
        const EV = PAINT.EV;
        const EA = PAINT.EA;

        const [VV, FV] = X.V_EV_2_VV_FV(V, EV);
        const VK = PAINT.V_VV_EV_EA_2_VK(V, VV, EV, EA);
        PAINT.VK = VK;
        for (const [i, vk] of VK.entries()) {
            if (Math.abs(vk) > 1e-6) {
                PAINT.is_invalid = true;
                break;
            }
        }
    },

    V_VV_EV_EA_2_VK: (V, VV, EV, EA) => {
        const VVA_map = new Map();
        for (const [i, [v1, v2]] of EV.entries()) {
            const a = EA[i];
            VVA_map.set(M.encode([v1, v2]), a);
            VVA_map.set(M.encode([v2, v1]), a);
        }
        const VK = [];
        for (const [i, A] of VV.entries()) {
            const adj = [];
            let boundary = false;
            let [count_M, count_V, count_U] = [0, 0, 0];
            for (const j of A) {
                const a = VVA_map.get(M.encode([i, j]));
                if (a == "B") {
                    boundary = true;
                    break;
                }
                if (a == "V" || a == "M" || a == "U") {
                    adj.push(j);
                }
                if (a == "M") { ++count_M; }
                if (a == "V") { ++count_V; }
                if (a == "U") { ++count_U; }
            }
            if (boundary || (adj.length == 0)) {
                VK.push(0);
            } else if (
                (adj.length % 2 != 0)
            ) {                       // violates blindMaekawa
                VK.push(1);           // far from zero
            } else {
                const angles = adj.map(j => M.angle(M.sub(V[j], V[i])));
                angles.sort((a, b) => a - b);
                let kawasaki = 0;
                for (let j = 0; j < angles.length; j += 2) {
                    kawasaki += angles[j + 1] - angles[j];
                }
                VK.push(Math.abs(kawasaki - Math.PI));
            }
        }
        return VK;
    },


    reset: () => {
        PAINT.svg_selection = undefined;
        PAINT.v0 = undefined;
        PAINT.v1 = undefined;
        PAINT.v2 = undefined;
        PAINT.segment = -1;
        PAINT.vertex = undefined;
        PAINT.VK = [];
        PAINT.is_invalid = false;
        PAINT.saves = [];
        PAINT.save_idx = 0;
        PAINT.redraw();
    },

    reset_view: () => {
        PAINT.scale = 1;
        PAINT.cx = .5;
        PAINT.cy = .5;
        PAINT.redraw();
    },

    get_pointer_loc: (e) => {
        const svg = document.getElementById("gekko_cp");
        var pt = svg.createSVGPoint();
        pt.x = e.clientX;
        pt.y = e.clientY;
        const p = pt.matrixTransform(svg.getScreenCTM().inverse());
        const w = SVG.SCALE;
        const x0 = ((p.x) / w);
        const y0 = ((p.y) / w);
        const T = PAINT.get_T();
        const A_inv = N.inv(T[0]);
        const b = M.mul(N.apply(A_inv, T[1]), -1);
        return N.transform([A_inv, b], [x0, y0]);
    },


    hilight_mv: ([idx, min_l]) => {
        if (min_l < 0.1) {
            const [p_, q_] = PAINT.segs[idx];
            const T = PAINT.get_T();
            const [p, q] = [
                N.transform(T, p_), N.transform(T, q_)];
            const l = N.matmul([p, q], SVG.SCALE);
            const [[x1, y1], [x2, y2]] = l;
            const seg_svg = SVG.append("line", PAINT.svg_selection, { x1, x2, y1, y2 });
            const a = "M";
            const color = PAINT.color[a];
            seg_svg.setAttribute("stroke", color);
            seg_svg.setAttribute("stroke-width", 6);
            PAINT.segment = idx;
        }
    },


    hilight_input: (v) => {
        if (!v) {
            return
        }
        const T = PAINT.get_T();
        const v_ = N.transform(T, v)
        const [cx, cy] = M.mul(v_, SVG.SCALE);
        const c = SVG.append("circle", PAINT.svg_selection, { cx, cy, r: 5, "fill": "magenta" });
        PAINT.vertex = v;
    },

    hilight_inputs: (v0_, b_v) => {
        const s = SVG.SCALE;
        const T = PAINT.get_T();
        const v0 = N.transform(T, v0_);
        const [c0x, c0y] = M.mul(v0, s);
        SVG.append("circle", PAINT.svg_selection, { cx: c0x, cy: c0y, r: 5, "fill": "magenta" });
        if (!b_v) {
            return;
        }
        const bv = N.transform(T, b_v);
        const [cx, cy] = M.mul(bv, s);
        SVG.append("circle", PAINT.svg_selection, { cx, cy, r: 5, "fill": "magenta" });
        PAINT.vertex = b_v;

        const seg_svg = SVG.append(
            "line",
            PAINT.svg_selection,
            {
                x1: v0[0] * s,
                x2: bv[0] * s,
                y1: v0[1] * s,
                y2: bv[1] * s
            });
        const a = "M";
        const color = PAINT.color[a];
        seg_svg.setAttribute("stroke", color);
        seg_svg.setAttribute("stroke-width", 1);
    },



    update_cp(CP) {
        const { V, EV, EA, segs } = CP;
        PAINT.V = V;
        PAINT.EA = EA;
        PAINT.EV = EV;
        PAINT.segs = segs;
        PAINT.validate();
        PAINT.redraw();
    },
    onmouseout: (e) => {
        PAINT.vertex = undefined;
        PAINT.segment = undefined;
        PAINT.redraw();
    },

    record: () => {
        const V = PAINT.V;
        const EA = PAINT.EA;
        const segs = PAINT.segs;
        const EV = PAINT.EV;
        const VK = PAINT.VK;
        const data = { V, segs, EA, EV, VK };
        if (PAINT.save_idx < PAINT.saves.length) {
            PAINT.saves.length = PAINT.save_idx;
        }
        const push = () => {
            const blob = new Blob(PAINT.saves);
            const size_mb = blob.size * 10 ** -6;
            if (size_mb < 20) {
                PAINT.saves.push(data);
                PAINT.save_idx = PAINT.saves.length;
            }
            else {
                PAINT.saves.shift();
                PAINT.save_idx = PAINT.saves.length;
                push();
            }
        }
        push();
    },

    recall: (i) => {
        const { V, segs, EA, EV, VK } = PAINT.saves[i];
        PAINT.save_idx = i + 1;
        PAINT.V = V;
        PAINT.EA = EA;
        PAINT.segs = segs;
        PAINT.EV = EV;
        PAINT.VK = VK;
    },

    undo: () => {
        const i = Math.max(0, PAINT.save_idx - 2);
        PAINT.recall(i);
        const segs = PAINT.segs;
        const assigns = PAINT.EA;
        const CP = Z.segs_2_CP(segs, assigns);
        PAINT.update_cp(CP);
    },

    redo: () => {
        const i = Math.min(PAINT.saves.length - 1, PAINT.save_idx);
        PAINT.recall(i);
        const segs = PAINT.segs;
        const assigns = PAINT.EA;
        const CP = Z.segs_2_CP(segs, assigns);
        PAINT.update_cp(CP);
    },

}