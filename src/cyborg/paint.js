import { SVG } from "../flatfolder/svg.js";
import { M } from "../flatfolder/math.js";
import { X } from "../flatfolder/conversion.js";


import { N } from "../defox/nath.js";
import { PRJ } from "../defox/project.js";


import { L } from "./lath.js";
import { DRAW } from "./draw.js";
import { STEP } from "../defox/step.js";
import { Z } from "./z.js";
import { ACT } from "./action.js";

import { Pointer } from "./pointer.js";

export const PAINT = {
    current_mode: "mv",
    bind_angle: Math.PI / 8,
    input_a: "V",
    pointers: Pointer(),

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
        PAINT.saves = [];
        PAINT.save_idx = 0;
        const CP = Z.segs_2_CP(PAINT.segs, PAINT.EA);
        PAINT.update_cp(CP);
        PAINT.record();
    },

    get_FOLD_CELL: (idx, is_interp) => {
        const FOLD_infer = is_interp ? PRJ.steps[idx - 1].fold_cp : undefined;
        const segs = PAINT.segs;
        const assigns = PAINT.EA;
        let limit = parseInt(document.getElementById("assign_limit").value);
        if (limit == 0) { limit = Infinity }
        const [FOLD, CELL] = Z.segs_assings_2_FOLD_CELL(segs, assigns, limit, FOLD_infer);
        return { FOLD, CELL };
    },

    set_mode: (mode) => {
        PAINT.current_mode = mode;
    },

    get_T: () => {
        return STEP.get_T(false, 0.5, PAINT.scale, PAINT.cx, PAINT.cy);
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
        PAINT.redraw();
    },

    reset_view: () => {
        PAINT.scale = 1;
        PAINT.cx = .5;
        PAINT.cy = .5;
        PAINT.redraw();
    },

    get_pointer_loc: (e) => {
        return PAINT.get_pointer_loc_xy(e.clientX, e.clientY);
    },
    
    get_pointer_loc_xy: (x, y) => {
        const svg = document.getElementById("cpedit");
        var pt = svg.createSVGPoint();
        pt.x = x;
        pt.y = y;
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
    
    onpointdown: (e) => {
        if (PAINT.current_mode != "move") return;
        
        if (e.pointerType == "touch") {
            PAINT.pointers.add_point(e);
            switch (PAINT.pointers.count()) {
                case 1:
                    PAINT.vertex = undefined;
                    break;
                case 2:
                    PAINT.vertex = PAINT.get_pointer_loc_xy(PAINT.pointers.get_middle_x(), PAINT.pointers.get_middle_y());
                    break;
                default:
                    return;
            }
        } else if ((e.pointerType == "mouse" && e.button == 0) || e.pointerType != "mouse") {
            // Expect one pointer from the other types
            if (PAINT.pointers.count() > 0) return;
            PAINT.vertex = PAINT.get_pointer_loc(e);
            PAINT.pointers.add_point(e);
            PAINT.svg.style.cursor = "move";
        }
    },
    
    onpointcancel: (e) => {
        PAINT.vertex = undefined;
        PAINT.segment = undefined;
        PAINT.pointers.clear();
        PAINT.svg.style.cursor = "auto";
        PAINT.redraw();
    },
    
    onwheelscroll: (e) => {
        if (PAINT.current_mode != "move") return;
        
        e.preventDefault();
        const new_scale = STEP.limit_scale(PAINT.scale + (e.deltaY * (-0.01)));
        if (Math.abs(PAINT.scale - new_scale) <= 0.001) return;
        const p_cursor = PAINT.get_pointer_loc(e);
        const zoom_factor = STEP.get_zoom(PAINT.scale)/STEP.get_zoom(new_scale);
        PAINT.cx = zoom_factor*(PAINT.cx - p_cursor[0]) + p_cursor[0];
        PAINT.cy = zoom_factor*(PAINT.cy - p_cursor[1]) + p_cursor[1];
        PAINT.scale = new_scale;
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