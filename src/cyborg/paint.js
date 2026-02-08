import { SVG } from "../flatfolder/svg.js";
import { M } from "../flatfolder/math.js";
import { N } from "../defox/nath.js";


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
    segs: [],
    EA: [],

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
    bind_radius: 0.05,
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
        });
        PAINT.segs = PAINT.segs.concat(UV.map((vs) => {
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
        PAINT.record();
    },

    get_FOLD_CELL_VK: () => {
        const [FOLD, CELL] = Z.segs_assings_2_FOLD_CELL(PAINT.segs, PAINT.EA)
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
        DRAW.draw_cp(PAINT.segs, PAINT.EA, SVG.clear(PAINT.svg.id), T);
        PAINT.svg_selection = SVG.append("g", PAINT.svg, { id: "selection" });
        PAINT.svg_validation = SVG.append("g", PAINT.svg, { id: "validation" });
        PAINT.validate();
    },

    validate: () => {
        PAINT.VK = [];
        PAINT.is_invalid = false;
        const V = PAINT.V;
        const EA = PAINT.EA;
        const EV = PAINT.EV;
        const [VK, is_invalid] = DRAW.draw_local_isses(
            V,
            EA,
            EV,
            SVG.clear(PAINT.svg_validation.id),
            PAINT.get_T());
        PAINT.VK = VK;
        PAINT.is_invalid = is_invalid;

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

    onmove: (e) => {
        const p0 = PAINT.get_pointer_loc(e);
        PAINT.hilight(p0);
        return;
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

    hilight_input_2: (v0_, b_v) => {
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

    hilight: (p_cursor) => {
        PAINT.segment = undefined;
        PAINT.vertex = undefined;
        SVG.clear(PAINT.svg_selection.id);

        if (PAINT.current_mode == "move") {
            PAINT.vertex = p_cursor;
            return;
        }
        if (PAINT.current_mode == "mv") {
            const seg = L.find_seg(p_cursor, PAINT.segs, PAINT.EA);
            PAINT.hilight_mv(seg);
            return;
        }
        if (PAINT.current_mode == "input_angle") {
            const v = L.find_v(p_cursor, PAINT.V, PAINT.radius.bind);
            PAINT.hilight_input(v);
            return;

        }
        if (PAINT.current_mode == "input_angle_2") {
            const v0 = PAINT.v0;
            const theta = L.binded_angle(v0, p_cursor, PAINT.bind_angle);
            const r = M.dist(v0, p_cursor);
            const b_v = L.find_binded_v(v0, r, theta, PAINT.V, PAINT.segs, PAINT.radius.bind);
            PAINT.hilight_input_2(v0, b_v);
            return;
        }
        if (PAINT.current_mode == "input_free") {
            const v = L.find_v(p_cursor, PAINT.V, PAINT.radius.bind);
            PAINT.hilight_input(v);
            return;
        }
        if (PAINT.current_mode == "input_free_2") {
            const v = L.find_v(p_cursor, PAINT.V, PAINT.radius.bind);
            PAINT.hilight_input_2(v);
            return;
        }
        if (PAINT.current_mode == "input_bisector") {
            const v = L.find_v(p_cursor, PAINT.V, PAINT.radius.bind);
            PAINT.hilight_input(v);
            return;
        }
        if (PAINT.current_mode == "input_bisector_2") {
            const v = L.find_v(p_cursor, PAINT.V, PAINT.radius.bind);
            PAINT.hilight_input(PAINT.v0);
            PAINT.hilight_input(v);
            return;
        }
        if (PAINT.current_mode == "input_bisector_3") {
            const v = L.find_v(p_cursor, PAINT.V, PAINT.radius.bind);
            PAINT.hilight_input(PAINT.v0);
            PAINT.hilight_input(PAINT.v1);
            PAINT.hilight_input(v);
            return;
        }
        if (PAINT.current_mode == "input_bisector_4") {
            const v = L.find_v(p_cursor, PAINT.V, PAINT.radius.bind);
            const v1 = PAINT.v1;
            const v0 = PAINT.v0;
            const v2 = PAINT.v2;

            const theta = M.angle(M.sub(v0, v1)) * .5
                + M.angle(M.sub(v2, v1)) * .5;
            const r = M.dist(v1, p_cursor);
            const b_v = L.find_binded_v(v1, r, theta, PAINT.V, PAINT.segs, PAINT.radius.bind);

            PAINT.hilight_input(v0);
            PAINT.hilight_input(v1);
            PAINT.hilight_input(v2);
            PAINT.hilight_input_2(v1, b_v);
            return;
        }
    },

    onclick: (e) => {
        if (PAINT.current_mode == "move") {
            [PAINT.cx, PAINT.cy] = PAINT.vertex;
            PAINT.redraw();
            return;
        }
        if (PAINT.current_mode == "mv") {
            const i = PAINT.segment;
            if (i < 0) {
                return;
            }
            const a_ = PAINT.EA[i];
            const a = DRAW.pair(a_);
            if (a == "F" || a == "B") { return; }
            const EA = PAINT.EA.map(a => a);
            EA[i] = a;
            PAINT.EA = EA;
            PAINT.record()
            PAINT.redraw();
            PAINT.onmove(e);
            return;
        }
        if (PAINT.current_mode == "input_angle") {
            if (PAINT.vertex == undefined) {
                return;
            }
            PAINT.v0 = PAINT.vertex;
            PAINT.current_mode = "input_angle_2";
            return;
        }
        if (PAINT.current_mode == "input_angle_2") {
            const v = PAINT.vertex;
            if (!v) {
                return;
            }
            const seg = [PAINT.v0, v];
            const a = PAINT.input_a;
            const CP = Z.add_segment(PAINT.segs, PAINT.EA, seg, a);
            PAINT.update_cp(CP);
            PAINT.record();
            PAINT.onmove(e);
            PAINT.current_mode = "input_angle";
            return;
        }
        if (PAINT.current_mode == "input_free") {
            if (!PAINT.vertex) {
                return;
            }
            PAINT.v0 = PAINT.vertex;
            PAINT.current_mode = "input_free_2";
            return;
        }
        if (PAINT.current_mode == "input_free_2") {
            const v = PAINT.vertex;
            if (!v) {
                return;
            }
            const seg = [PAINT.v0, v];
            const a = PAINT.input_a;
            const CP = Z.add_segment(PAINT.segs, PAINT.EA, seg, a);
            PAINT.record;
            PAINT.update_cp(CP);
            PAINT.onmove(e);
            PAINT.current_mode = "input_free";
            return;
        }
        if (PAINT.current_mode == "input_bisector") {
            if (!PAINT.vertex) {
                return;
            }
            PAINT.v0 = PAINT.vertex;
            PAINT.current_mode = "input_bisector_2";
            return;
        }
        if (PAINT.current_mode == "input_bisector_2") {
            if (!PAINT.vertex) {
                return;
            }
            PAINT.v1 = PAINT.vertex;
            PAINT.current_mode = "input_bisector_3";
            return;
        }
        if (PAINT.current_mode == "input_bisector_3") {
            const v = PAINT.vertex;
            if (!v) {
                return;
            }
            PAINT.v2 = v;
            PAINT.current_mode = "input_bisector_4";
            return;
        }
        if (PAINT.current_mode == "input_bisector_4") {
            const v = PAINT.vertex;
            if (!v) {
                return;
            }
            const seg = [PAINT.v1, v];
            const a = PAINT.input_a;
            const CP = Z.add_segment(PAINT.segs, PAINT.EA, seg, a);
            PAINT.record;
            PAINT.update_cp(CP);
            PAINT.onmove(e);
            PAINT.current_mode = "input_bisector";
            return;
        }

    },

    update_cp(CP) {
        const { V, EV, EA, segs } = CP;
        PAINT.V = V;
        PAINT.EA = EA;
        PAINT.EV = EV;
        PAINT.segs = segs;
        PAINT.redraw();
    },

    oncontextmenu: (e) => {
        e.preventDefault();
        const m = PAINT.current_mode;
        if (m == "input_free_2") {
            PAINT.v0 = undefined;
            PAINT.current_mode = "input_free";
            PAINT.onmove(e);
            return;
        }
        if (m == "input_angle_2") {
            PAINT.v0 = undefined;
            PAINT.current_mode = "input_angle";
            PAINT.onmove(e);
            return;
        }
        if (m == "input_bisector_2") {
            PAINT.v0 = undefined;
            PAINT.current_mode = "input_bisector";
            PAINT.onmove(e);
            return;
        }
        if (m == "input_bisector_3") {
            PAINT.v1 = undefined;
            PAINT.current_mode = "input_bisector_2";
            PAINT.onmove(e);
            return;
        }
        if (m == "input_bisector_4") {
            PAINT.v2 = undefined;
            PAINT.current_mode = "input_bisector_3";
            PAINT.onmove(e);
            return;
        }
        const pt = PAINT.get_pointer_loc(e);
        const s_i = L.find_seg(pt, PAINT.segs, PAINT.EA)[0];
        if (s_i < 0) {
            return;
        }
        const CP = Z.remove_segment(PAINT.segs, PAINT.EA, s_i);
        PAINT.update_cp(CP);
        PAINT.record();
        PAINT.onmove(e);
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