import { SVG } from "../flatfolder/svg.js";
import { M } from "../flatfolder/math.js";
import { N } from "../defox/nath.js";


import { L } from "./lath.js";
import { DRAW } from "./draw.js";
import { STEP } from "../defox/step.js";
import { Z } from "./z.js";
import { PAINT } from "./paint.js";


export const ACT = {
    hilight: (e) => {
        const p_cursor = PAINT.get_pointer_loc(e);
        PAINT.segment = undefined;
        PAINT.vertex = undefined;
        SVG.clear(PAINT.svg_selection.id);

        if (PAINT.current_mode == "move") {
            PAINT.vertex = p_cursor;
            return;
        }
        if (ACT.hilight_input_mv(p_cursor)) {
            return;
        };
        if (ACT.hilight_input_angle(p_cursor)) {
            return;
        };
        if (ACT.hilight_input_free(p_cursor)) {
            return;
        };
        if (ACT.hilight_input_bisector(p_cursor)) {
            return;
        };
    },

    onclick: (e) => {
        if (PAINT.current_mode == "move") {
            [PAINT.cx, PAINT.cy] = PAINT.vertex;
            PAINT.redraw();
            return;
        }
        if (ACT.click_input_mv(e)) {
            return;
        }
        if (ACT.click_input_angle(e)) {
            return;
        }
        if (ACT.click_input_free(e)) {
            return;
        };
        if (ACT.click_input_bisector(e)) {
            return;
        };
    },


    oncontextmenu: (e) => {
        e.preventDefault();
        const m = PAINT.current_mode;
        if (ACT.context_input_free(e, m)) {
            return;
        };
        if (ACT.context_input_angle(e, m)) {
            return;
        };
        if (ACT.context_input_bisector(e, m)) {
            return;
        };
        ACT.remove(e);
    },
    hilight_input_mv: (p_cursor) => {
        if (PAINT.current_mode == "mv") {
            const seg = L.find_seg(p_cursor, PAINT.segs, PAINT.EA);
            PAINT.hilight_mv(seg);
            return true;
        }
        return false;
    },
    hilight_input_angle: (p_cursor) => {
        if (PAINT.current_mode == "input_angle") {
            const v = L.find_v(p_cursor, PAINT.V, PAINT.radius.bind / PAINT.scale);
            PAINT.hilight_input(v);
            return true;

        }
        if (PAINT.current_mode == "input_angle_2") {
            const v0 = PAINT.v0;
            const theta = L.binded_angle(v0, p_cursor, PAINT.bind_angle);
            const r = M.dist(v0, p_cursor);
            const b_v = L.find_binded_v(v0, r, theta, PAINT.V, PAINT.segs, PAINT.radius.bind / PAINT.scale);
            PAINT.hilight_inputs(v0, b_v);
            return true;
        }
        return false;
    },

    hilight_input_free: (p_cursor) => {
        if (PAINT.current_mode == "input_free") {
            const v = L.find_v(p_cursor, PAINT.V, PAINT.radius.bind / PAINT.scale);
            PAINT.hilight_input(v);
            return true;
        }
        if (PAINT.current_mode == "input_free_2") {
            const v = L.find_v(p_cursor, PAINT.V, PAINT.radius.bind / PAINT.scale);
            const v0 = PAINT.v0;
            PAINT.hilight_inputs(v0, v);
            return true;
        }
        return false;
    },

    hilight_input_bisector: (p_cursor) => {

        if (PAINT.current_mode == "input_bisector") {
            const v = L.find_v(p_cursor, PAINT.V, PAINT.radius.bind / PAINT.scale);
            PAINT.hilight_input(v);
            return true;
        }
        if (PAINT.current_mode == "input_bisector_2") {
            const v = L.find_v(p_cursor, PAINT.V, PAINT.radius.bind / PAINT.scale);
            PAINT.hilight_input(PAINT.v0);
            PAINT.hilight_input(v);
            return true;
        }
        if (PAINT.current_mode == "input_bisector_3") {
            const v = L.find_v(p_cursor, PAINT.V, PAINT.radius.bind / PAINT.scale);
            PAINT.hilight_input(PAINT.v0);
            PAINT.hilight_input(PAINT.v1);
            PAINT.hilight_input(v);
            return true;
        }
        if (PAINT.current_mode == "input_bisector_4") {
            const v1 = PAINT.v1;
            const v0 = PAINT.v0;
            const v2 = PAINT.v2;

            const theta = L.get_bisector_angle(M.sub(v0, v1), M.sub(v2, v1));
            const r = M.dist(v1, p_cursor);
            const b_v = L.find_binded_v(v1, r, theta, PAINT.V, PAINT.segs, PAINT.radius.bind / PAINT.scale);

            PAINT.hilight_input(v0);
            PAINT.hilight_input(v1);
            PAINT.hilight_input(v2);
            PAINT.hilight_inputs(v1, b_v);
            return true;
        }
        return false;
    },

    click_input_mv: (e) => {
        if (PAINT.current_mode == "mv") {
            const i = PAINT.segment;
            if (i < 0) {
                return true;
            }
            const a_ = PAINT.EA[i];
            const a = DRAW.pair(a_);
            if (a == "F" || a == "B") { return; }
            const EA = PAINT.EA.map(a => a);
            EA[i] = a;
            PAINT.EA = EA;
            PAINT.record()
            PAINT.redraw();
            ACT.hilight(e);
            return true;
        }
        return false;
    },

    click_input_angle: (e) => {
        if (PAINT.current_mode == "input_angle") {
            if (PAINT.vertex == undefined) {
                return true;
            }
            PAINT.v0 = PAINT.vertex;
            PAINT.current_mode = "input_angle_2";
            return true;
        }
        if (PAINT.current_mode == "input_angle_2") {
            const v = PAINT.vertex;
            if (!v) {
                return true;
            }
            const seg = [PAINT.v0, v];
            const a = PAINT.input_a;
            const CP = Z.add_segment(PAINT.segs, PAINT.EA, seg, a);
            PAINT.update_cp(CP);
            PAINT.record();
            ACT.hilight(e);
            PAINT.current_mode = "input_angle";
            return true;
        }
        return false;
    },

    click_input_free: (e) => {
        if (PAINT.current_mode == "input_free") {
            if (!PAINT.vertex) {
                return true;
            }
            PAINT.v0 = PAINT.vertex;
            PAINT.current_mode = "input_free_2";
            return true;
        }
        if (PAINT.current_mode == "input_free_2") {
            const v = PAINT.vertex;
            if (!v) {
                return true;
            }
            const seg = [PAINT.v0, v];
            const a = PAINT.input_a;
            const CP = Z.add_segment(PAINT.segs, PAINT.EA, seg, a);
            PAINT.record;
            PAINT.update_cp(CP);
            ACT.hilight(e);
            PAINT.current_mode = "input_free";
            return true;
        }
        return false;
    },

    click_input_bisector: (e) => {
        if (PAINT.current_mode == "input_bisector") {
            if (!PAINT.vertex) {
                return true;
            }
            PAINT.v0 = PAINT.vertex;
            PAINT.current_mode = "input_bisector_2";
            return true;
        }
        if (PAINT.current_mode == "input_bisector_2") {
            if (!PAINT.vertex) {
                return true;
            }
            PAINT.v1 = PAINT.vertex;
            PAINT.current_mode = "input_bisector_3";
            return true;
        }
        if (PAINT.current_mode == "input_bisector_3") {
            const v = PAINT.vertex;
            if (!v) {
                return true;
            }
            PAINT.v2 = v;
            PAINT.current_mode = "input_bisector_4";
            return true;
        }
        if (PAINT.current_mode == "input_bisector_4") {
            const v = PAINT.vertex;
            if (!v) {
                return true;
            }
            const seg = [PAINT.v1, v];
            const a = PAINT.input_a;
            const CP = Z.add_segment(PAINT.segs, PAINT.EA, seg, a);
            PAINT.record;
            PAINT.update_cp(CP);
            ACT.hilight(e);
            PAINT.current_mode = "input_bisector";
            return true;
        }
        return false;
    },

    context_input_free: (e, m) => {
        if (m == "input_free_2") {
            PAINT.v0 = undefined;
            PAINT.current_mode = "input_free";
            ACT.hilight(e);
            return true;
        }
        return false;
    },

    context_input_angle: (e, m) => {
        if (m == "input_angle_2") {
            PAINT.v0 = undefined;
            PAINT.current_mode = "input_angle";
            ACT.hilight(e);
            return true;
        }
        return false;
    },
    context_input_bisector: (e, m) => {
        if (m == "input_bisector_2") {
            PAINT.v0 = undefined;
            PAINT.current_mode = "input_bisector";
            ACT.hilight(e);
            return true;
        }
        if (m == "input_bisector_3") {
            PAINT.v1 = undefined;
            PAINT.current_mode = "input_bisector_2";
            ACT.hilight(e);
            return true;
        }
        if (m == "input_bisector_4") {
            PAINT.v2 = undefined;
            PAINT.current_mode = "input_bisector_3";
            ACT.hilight(e);
            return true;
        }
        return false;
    },

    remove: (e) => {
        const pt = PAINT.get_pointer_loc(e);
        const s_i = L.find_seg(pt, PAINT.segs, PAINT.EA)[0];
        if (s_i < 0) {
            return true;
        }
        const CP = Z.remove_segment(PAINT.segs, PAINT.EA, s_i);
        PAINT.update_cp(CP);
        PAINT.record();
        ACT.hilight(e);
        return true;
    },
}