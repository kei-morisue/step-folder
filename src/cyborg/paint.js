import { SVG } from "../flatfolder/svg.js";
import { M } from "../flatfolder/math.js";
import { X } from "../flatfolder/conversion.js";


import { N } from "../defox/nath.js";
import { PRJ } from "../defox/project.js";


import { L } from "./lath.js";
import { DRAW } from "./draw.js";
import { STEP } from "../defox/step.js";
import { Z } from "./z.js";



export const PAINT = {
    current_mode: "mv",
    bind_angle: Math.PI / 8,
    input_a: "V",

    V: [],
    EV: [],
    EA: [],
    segs: [],




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

    pair: (a) => {
        return a == "M" ? "V" : a == "V" ? "M" : a;
    },

    initialize: (FOLD, svg) => {
        PAINT.segment = -1;
        PAINT.vertex = -1;
        PAINT.v0 = undefined;
        PAINT.v1 = undefined;
        PAINT.v2 = undefined;
        const { V, EV, EA, UA, UV } = FOLD;
        PAINT.V = V;
        PAINT.EV = EV.concat(UV);

        PAINT.segs = EV.map((vs) => {
            return M.expand(vs, V);
        }).concat(UV.map((vs) => {
            return M.expand(vs, V);
        }));
        PAINT.EA = EA.concat(UA);

        PAINT.svg = svg;
        PAINT.VK = [];
        PAINT.is_invalid = false;
        PAINT.cx = .5;
        PAINT.cy = .5;
        PAINT.scale = 1;
        PAINT.saves = [];
        PAINT.save_idx = 0;
        PAINT.trim();
        PAINT.record();
    },

    get_FOLD_CELL: (idx, is_interp) => {
        const FOLD_infer = is_interp ? PRJ.steps[idx - 1].fold_cp : undefined;
        const segs = PAINT.segs;
        const assigns = PAINT.EA;
        const [FOLD, CELL] = Z.segs_assings_2_FOLD_CELL(segs, assigns, FOLD_infer);
        return { FOLD, CELL };
    },

    set_mode: (mode) => {
        PAINT.current_mode = mode;
    },

    get_T: () => {
        const zoom = STEP.get_zoom(PAINT.scale);
        return STEP.get_T(false, 0.5, zoom, PAINT.cx, PAINT.cy);
    },
    redraw: () => {
        const T = PAINT.get_T();
        const segs = PAINT.segs;
        const assigns = PAINT.EA;
        DRAW.draw_cp(segs, assigns, SVG.clear(PAINT.svg.id), T);
        PAINT.svg_selection = SVG.append("g", PAINT.svg, { id: "selection" });
        PAINT.svg_validation = SVG.append("g", PAINT.svg, { id: "validation" });
        DRAW.draw_VK(PAINT.V, PAINT.VK, PAINT.svg, T);
    },

    validate: () => {
        PAINT.VK = [];
        PAINT.is_invalid = false;
        const V = PAINT.V;
        const EA = PAINT.EA;
        const EV = PAINT.EV;
        const [VK, is_invalid] = DRAW.get_VK(
            V,
            EA,
            EV);
        PAINT.VK = VK;
        PAINT.is_invalid = is_invalid;
    },
    trim: () => {
        const fn = (V, EA, EV) => {
            const VE = V.map((_) => []);
            for (const [e_i, [p_i, q_i]] of EV.entries()) {
                VE[p_i].push(e_i);
                VE[q_i].push(e_i);
            }
            const res = Z.trim_a_vertex(VE, EA, EV, V);
            if (res) {
                const { EA_, EV_ } = res;
                return fn(V, EA_, EV_);
            } else {
                return [EA, EV];
            }
        }
        const UEA_ = PAINT.EA;
        const UEV_ = PAINT.EV;
        const [UEA, UEV] = fn(PAINT.V, UEA_, UEV_);
        const EA_ = [];
        const EV_ = [];
        const UV = [];
        for (const [idx, a] of UEA.entries()) {
            const vs = UEV[idx];
            if (a == "F") {
                UV.push(vs);
            }
            else {
                EA_.push(a);
                EV_.push(vs);
            }
        }
        const V_ = PAINT.V;
        const [EA, EV] = fn(V_, EA_, EV_);

        const { V, V_map } = Z.sweep_vertices(V_, EV.concat(UV));
        PAINT.V = V;
        PAINT.EA = EA.concat(UV.map(() => "F"));
        PAINT.EV = EV.map(([p, q]) => [V_map[p], V_map[q]]).concat(UV.map(([p, q]) => [V_map[p], V_map[q]]));
        PAINT.segs = PAINT.EV.map((vs) => M.expand(vs, V));
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
        PAINT.reset_view();
    },

    reset_view: () => {
        PAINT.scale = 1;
        PAINT.cx = .5;
        PAINT.cy = .5;
        PAINT.redraw();
    },

    get_pointer_loc: (e) => {
        const svg = document.getElementById("cpedit");
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
            const a = PAINT.pair(PAINT.EA[idx]);
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
        const a = PAINT.pair(PAINT.input_a);
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
        PAINT.trim();
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
        const data = { V, segs, EA, EV };
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
        const { V, segs, EA, EV } = PAINT.saves[i];
        PAINT.save_idx = i + 1;
        PAINT.V = V;
        PAINT.EA = EA;
        PAINT.segs = segs;
        PAINT.EV = EV;
    },

    undo: () => {
        const i = Math.max(0, PAINT.save_idx - 2);
        PAINT.recall(i);
        PAINT.redraw();
    },

    redo: () => {
        const i = Math.min(PAINT.saves.length - 1, PAINT.save_idx);
        PAINT.recall(i);
        PAINT.redraw();
    },

}