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

    get_FOLD_CELL_VK: (idx, is_interp) => {

        const FOLD_infer = is_interp ? PRJ.steps[idx - 1].fold_cp : undefined;

        const [FOLD, CELL] = Z.segs_assings_2_FOLD_CELL(PAINT.segs, PAINT.EA, FOLD_infer);
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
    trim: () => {
        const fn = () => {
            const V = PAINT.V;
            const EA = PAINT.EA;
            const EV = PAINT.EV;

            const VE = V.map((_) => []);
            for (const [e_i, [p_i, q_i]] of EV.entries()) {
                VE[p_i].push(e_i);
                VE[q_i].push(e_i);
            }

            for (const [v_i, e_is] of VE.entries()) {
                if (e_is.length != 2) {
                    continue;
                }
                const [e1, e2] = [e_is[0], e_is[1]];
                const a1 = EA[e1];
                const a2 = EA[e2];
                if (a1 != a2) {
                    continue;
                }
                const [p1, q1] = EV[e1];
                const [p2, q2] = EV[e2];
                const d1 = M.sub(V[p1], V[q1]);
                const d2 = M.sub(V[p2], V[q2]);

                if (!M.near_zero(N.cross(d1, d2))) {
                    continue;
                }
                PAINT.EA = EA.toSpliced(e2, 1);
                EV[e1] = p1 == p2 ? [q2, q1]
                    : p1 == q2 ? [p2, q1]
                        : p2 == q1 ? [p1, q2]
                            : [p1, q1];
                PAINT.EV = EV.toSpliced(e2, 1);
                PAINT.V = V.toSpliced(v_i, 1);
                for (const [e_i, [p_, q_]] of PAINT.EV.entries()) {
                    const p = p_ > v_i ? p_ - 1 : p_;
                    const q = q_ > v_i ? q_ - 1 : q_;
                    PAINT.EV[e_i] = [p, q];
                }
                PAINT.segs = PAINT.EV.map((vs) => M.expand(vs, PAINT.V));
                PAINT.redraw();
                PAINT.hilight_input(V[v_i]);
                fn();
                break;
            }
        }
        fn();
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