import { SVG } from "../flatfolder/svg.js";
import { M } from "../flatfolder/math.js";
import { N } from "../defox/nath.js";


import { PRJ } from "../defox/project.js";
import { DRAW as DD } from "../defox/draw.js";


import { L } from "./lath.js";
import { DRAW } from "./draw.js";
import { STEP } from "../defox/step.js";
import { Z } from "./z.js";


export const PAINT = {
    V: [],
    EV: [],
    segs: [],
    EA: [],
    svg: undefined,
    svg_selection: undefined,
    svg_validation: undefined,
    current_mode: "mv",
    segment: -1,
    vertex: undefined,
    VK: [],
    v0: undefined,
    bind_angle: Math.PI / 8,
    input_a: "V",
    is_invalid: false,
    bind_radius: 0.05,

    initialize: (FOLD, svg) => {
        PAINT.segment = -1;
        PAINT.vertex = -1;
        PAINT.v0 = undefined;
        const { V, EV, EA, UA, UV } = FOLD;
        PAINT.V = V;
        PAINT.EV = EV;
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
    },

    get_FOLD_CELL_VK: () => {
        const [FOLD, CELL] = Z.segs_assings_2_FOLD_CELL(PAINT.segs, PAINT.EA)
        return { FOLD, CELL };
    },

    set_mode: (mode) => {
        PAINT.current_mode = mode;
    },

    redraw: () => {
        DRAW.draw_cp(PAINT.segs, PAINT.EA, SVG.clear(PAINT.svg.id));
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
        const [VK, is_invalid] = DRAW.draw_local_isses(V, EA, EV, SVG.clear(PAINT.svg_validation.id));
        PAINT.VK = VK;
        PAINT.is_invalid = is_invalid;

    },
    reset: () => {
        PAINT.svg_selection = undefined;
        PAINT.v0 = undefined;
        PAINT.segment = -1;
        PAINT.vertex = undefined;
        PAINT.VK = [];
        PAINT.is_invalid = false;
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
        const label = document.getElementById("pt_loc");
        label.innerHTML = "[" + (x0.toFixed(8)) + ", " + (y0.toFixed(8)) + "]";

        return [x0, y0];
    },

    onmove: (e) => {
        const p0 = PAINT.get_pointer_loc(e);
        PAINT.hilight(p0);
        return;
    },

    hilight_mv: ([idx, min_l]) => {
        if (min_l < 0.1) {
            const [[x1, y1], [x2, y2]] = N.matmul(PAINT.segs[idx], SVG.SCALE);
            const seg_svg = SVG.append("line", PAINT.svg_selection, { x1, x2, y1, y2 });
            seg_svg.setAttribute("stroke", "magenta");
            seg_svg.setAttribute("stroke-width", 3);
            PAINT.segment = idx;
        }
    },


    hilight_input_angle: (v) => {
        if (!v) {
            return
        }
        const [cx, cy] = M.mul(v, SVG.SCALE);
        const c = SVG.append("circle", PAINT.svg_selection, { cx, cy, r: 5, "fill": "magenta" });
        PAINT.vertex = v;
    },

    hilight_input_angle_2: (b_v) => {
        const s = SVG.SCALE;
        const v0 = PAINT.v0;
        const [c0x, c0y] = M.mul(v0, s);
        SVG.append("circle", PAINT.svg_selection, { cx: c0x, cy: c0y, r: 5, "fill": "magenta" });
        if (!b_v) {
            return;
        }
        const [cx, cy] = M.mul(b_v, s);
        SVG.append("circle", PAINT.svg_selection, { cx, cy, r: 5, "fill": "magenta" });
        PAINT.vertex = b_v;

        const seg_svg = SVG.append(
            "line",
            PAINT.svg_selection,
            {
                x1: v0[0] * s,
                x2: b_v[0] * s,
                y1: v0[1] * s,
                y2: b_v[1] * s
            });
        seg_svg.setAttribute("stroke", "magenta");
        seg_svg.setAttribute("stroke-width", 3);
    },

    hilight: (p_cursor) => {
        PAINT.segment = undefined;
        PAINT.vertex = undefined;
        SVG.clear(PAINT.svg_selection.id);
        if (PAINT.current_mode == "mv") {
            PAINT.hilight_mv(L.find_seg(p_cursor, PAINT.segs));
        }
        if (PAINT.current_mode == "input_angle") {
            PAINT.hilight_input_angle(L.find_v(p_cursor, PAINT.V, PAINT.bind_radius));
        }
        if (PAINT.current_mode == "input_angle_2") {
            const v0 = PAINT.v0;
            const theta = L.binded_angle(v0, p_cursor, PAINT.bind_angle);
            const r = M.dist(v0, p_cursor);
            const b_v = L.find_binded_v(v0, r, theta, PAINT.V, PAINT.segs, PAINT.bind_radius);
            PAINT.hilight_input_angle_2(b_v);
        }

    },

    onclick: (e) => {
        if (PAINT.current_mode == "mv") {
            const i = PAINT.segment;
            if (i < 0) {
                return;
            }
            const a_ = PAINT.EA[i];
            const a = DRAW.pair(a_);
            PAINT.EA[i] = a;
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
            PAINT.onmove(e);
            PAINT.current_mode = "input_angle";
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
        const pt = PAINT.get_pointer_loc(e);
        e.preventDefault();
        const s_i = L.find_seg(pt, PAINT.segs)[0];
        if (s_i < 0) {
            return;
        }
        const CP = Z.remove_segment(PAINT.segs, PAINT.EA, s_i);
        PAINT.update_cp(CP);
        PAINT.onmove(e);
    },

    onmouseout: (e) => {
        PAINT.vertex = undefined;
        PAINT.segment = undefined;
        PAINT.redraw();
    },
}