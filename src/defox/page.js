import { SVG } from "../flatfolder/svg.js";
import { Y } from "./y.js";
import { DRAW_LIN } from "./draw_lin.js";
import { DRAW } from "./draw.js";
import { SVG3 } from "./svg.js";
import { STEP } from "./step.js";
import { PRJ } from "./project.js";
import { M } from "../flatfolder/math.js";


export const PAGE = {
    dim: {
        width: 2894,
        height: 4093,
        margin_x: 50,
        margin_y: 80,
        margin_step: 10,
    },
    layout: {
        rows: 4,
        cols: 3,
        blanks: 3,
    },
    text: {
        color: "black",
        size: 100,
        font: "Arial",
        weght: "bold",
        location: "Top",
        base_number: 1,
    },
    is_river: false,
    make_title: true,
    river_flow: 1,
    current_idx: 0,

    get_pages: (steps) => {
        const c = PAGE.layout.cols;
        const r = PAGE.layout.rows;
        const b = PAGE.layout.blanks;
        return Math.ceil((steps.length + b) / (r * c));
    },

    draw_title: (body, w, h, steps, origin_body = [0, 0]) => {
        if (!PAGE.make_title || PAGE.current_idx != 0) { return; }
        if (PAGE.layout.blanks > 0) { PAGE.draw_title_A(body, w, h, steps, .9, origin_body); }
        if (PAGE.layout.blanks > 1) { PAGE.draw_title_B(body, w, h, .9, origin_body); }
        if (PAGE.layout.blanks > 2) { PAGE.draw_title_C(body, w, h, steps, .9, origin_body); }
    },
    draw_title_A: (body, w, h, steps, size, origin_body = [0, 0]) => {
        const panel = SVG.append("g", body);
        const origin_panel = origin_body;

        const s = Math.min(w, h);
        const d = s * (size);
        const origin_panel_d = M.add(origin_panel, [(s - d) / 2, (h * .8 - d) / 2]);

        const b = d * SVG3.MARGIN / SVG3.INI_SCALE;
        const [x0, y0] = M.add(origin_panel_d, [b, b])
        SVG.SCALE = d - 2 * b;
        PAGE.draw_step(panel, steps[steps.length - 1], steps.length, false, true, [x0, y0]);

        SVG.append("rect", panel, { x: origin_body[0], y: origin_body[1] + h * .8, width: w, height: h * 0.1, fill: "darkgray" });
        SVG3.reset();
        return panel;
    },
    draw_title_B: (body, w, h, size, origin_body = [0, 0]) => {
        const panel = SVG.append("g", body);
        const origin_panel = M.add(origin_body, [w, 0]);

        const s = Math.min(w, h);
        const d = s * (size + .2);
        const [x0, y0] = M.add(origin_panel, [(s - d) / 2, (s - d) / 2]);

        SVG.append("text", panel, {
            x: x0,
            y: y0 + h * size / 4,
            "fill": "darkgray",
            "font-size": h * size / 8 + "pt",
            "font-family": PAGE.text.font,
        }).innerHTML = document.getElementById("title").value;
        SVG.append("line", panel, {
            x1: x0,
            x2: x0 + w * size,
            y1: y0 + h * size * (.3),
            y2: y0 + h * size * (.3),
            stroke: "darkgray",
            "stroke-width": 10
        })


        SVG.append("text", panel, {
            x: x0,
            y: y0 + h * size * (.3 + .1),
            "fill": "darkgray",
            "font-size": h * size * .0625 + "pt",
            "font-family": PAGE.text.font,
        }).innerHTML = document.getElementById("title_alt").value;
        SVG.append("text", panel, {
            x: x0,
            y: y0 + h * size * (.55),
            "fill": "black",
            "font-size": h * size * .05 + "pt",
            "font-family": PAGE.text.font,
        }).innerHTML = document.getElementById("desc0").value;
        SVG.append("text", panel, {
            x: x0,
            y: y0 + h * size * (.65),
            "fill": "black",
            "font-size": h * size * .05 + "pt",
            "font-family": PAGE.text.font,
        }).innerHTML = document.getElementById("desc1").value;
        SVG.append("text", panel, {
            x: x0,
            y: y0 + h * size * (.75),
            "fill": "black",
            "font-size": h * size * .05 + "pt",
            "font-family": PAGE.text.font,
        }).innerHTML = document.getElementById("desc2").value;

        SVG.append("rect", panel, { x: origin_body[0] + w, y: origin_body[1] + h * .8, width: w, height: h * 0.1, fill: "darkgray" });
        return panel;
    },
    draw_title_C: (body, w, h, steps, size = .8, origin_body = [0, 0]) => {
        const panel = SVG.append("g", body);
        const origin_panel = M.add(origin_body, [2 * w, 0]);

        const s = Math.min(w, h);
        const d = s * (size);
        const origin_panel_d = M.add(origin_panel, [(s - d) / 2, (h * .8 - d) / 2]);

        const b = d * SVG3.MARGIN / SVG3.INI_SCALE;
        const [x0, y0] = M.add(origin_panel_d, [b, b])
        SVG.SCALE = d - 2 * b;
        DRAW.draw_cp(steps[steps.length - 1].fold_cp, panel, false, [x0, y0]);

        SVG.append("rect", panel, { x: origin_body[0] + 2 * w, y: origin_body[1] + h * .8, width: w, height: h * 0.1, fill: "darkgray" });
        SVG3.reset();
        return panel;
    },
    redraw: (svg, steps, defs = undefined, to_cell = false, origin = [0, 0]) => {
        document.getElementById("pages").innerHTML = PAGE.get_pages(steps);
        document.getElementById("page_idx").innerHTML = PAGE.current_idx + 1;

        svg.setAttribute("xmlns", SVG.NS);
        svg.setAttribute("style", "background: " + DRAW.color.background);
        svg.setAttribute("viewBox", [0, 0, PAGE.dim.width, PAGE.dim.height].join(" "));

        const body = SVG.append("g", svg);
        const origin_body = M.add(origin, [PAGE.dim.margin_x, PAGE.dim.margin_y]);
        const w = (PAGE.dim.width - 2 * PAGE.dim.margin_x) / PAGE.layout.cols;
        const h = (PAGE.dim.height - 2 * PAGE.dim.margin_y) / PAGE.layout.rows;

        PAGE.draw_title(body, w, h, steps, origin_body);
        for (let i = 0; i < steps.length; i++) {
            const [r, c] = PAGE.get_row_col(i);
            if (r == undefined || c == undefined) {
                continue;
            }
            const panel = SVG.append("g", body);
            const origin_panel = M.add(origin_body, [w * c, h * r]);

            const s = Math.min(w, h);
            const d = s * (1.0 - PAGE.dim.margin_step * 0.01);
            const origin_panel_d = M.add(origin_panel, [(s - d) / 2, (s - d) / 2]);

            const b = s * SVG3.MARGIN / SVG3.INI_SCALE;
            SVG.SCALE = d - 2 * b;
            const origin_dia = M.add(origin_panel_d, [b, b])
            PAGE.draw_step(panel, steps[i], i, to_cell, true, origin_dia);
            PAGE.draw_label(panel, i, origin_panel);
        }
        SVG3.reset();
        return svg;
    },
    draw_label: (panel, i, origin = [0, 0]) => {
        const t = PAGE.text.size;
        let num = i + PAGE.text.base_number;
        const loc = M.add([t, t], origin);
        if (PAGE.text.location == "Bottom") {
            loc[1] = h;
            num = num + ". "
        }
        const l = SVG3.draw_label(panel, loc, PAGE.text.color, num, t);
        l.setAttribute("font-family", PAGE.text.font);
        l.setAttribute("font-weight", PAGE.text.weght);
        return l;
    },

    draw_step: (panel_d, step, id, to_cell, render_all = true, origin = [0, 0]) => {
        const { flip0, rotate, scale, clip, cx, cy, depth } = step.params;

        const T = STEP.get_T(flip0, rotate, scale, cx, cy);
        const FOLD = step.fold_d;
        const CELL = step.cell_d;
        const symbols = step.symbols ?? [];

        if (to_cell) {
            if (CELL) {
                const STATE = step.state ?? Y.FOLD_CELL_2_STATE(FOLD, CELL);
                DRAW.draw_state(panel_d, FOLD, CELL, STATE, T, clip, id, symbols, origin);
            }
            else {
                const CELL_d = Y.FOLD_2_CELL(FOLD);
                const C = {
                    CF: CELL_d.CF,
                    BF: step.cell_cp.BF,
                    GB: step.cell_cp.GB,
                    GA: step.cell_cp.GA,
                    GI: step.cell_cp.GI
                }
                const STATE = step.state ?? Y.FOLD_CELL_2_STATE(FOLD, C);
                DRAW.draw_state(panel_d, FOLD, CELL_d, STATE, T, clip, id, symbols, origin);
            }
        } else {
            if (CELL) {
                const STATE = step.state ?? Y.FOLD_CELL_2_STATE(FOLD, CELL);
                DRAW.draw_state(panel_d, FOLD, CELL, STATE, T, clip, id, symbols, origin);
            } else {
                DRAW_LIN.draw_state(panel_d, FOLD, step.lin.S, T, clip, depth, id, symbols, render_all, origin);
            }
        }
    },

    draw_blank_step: (par_svg, step, id, scaled = true) => {
        const { flip0, rotate, scale, clip, cx, cy, depth } = step.params;

        const T = STEP.get_T(flip0, rotate, scaled ? scale : 1, cx, cy);
        const FOLD = step.fold_cp;
        const CELL = step.cell_cp;

        const STATE = Y.FOLD_CELL_2_STATE(FOLD, CELL);
        DRAW.draw_state(par_svg, FOLD, CELL, STATE, T, clip, id);
    },

    get_tutorial_svg: (step_before, step_after, idx) => {
        const body = PAGE.draw_tutorial_body();
        const b = SVG3.MARGIN;
        const s = SVG.SCALE;
        const w = s + 2 * b;
        const h = s + 2 * b;
        const panel_A = PAGE.draw_panel(body, w, h, 0, 0, idx);
        const panel_B = PAGE.draw_panel(body, w, h, w, 0, idx);
        panel_A.setAttribute("viewBox", [-b, -b, w, h].join(" "));
        panel_B.setAttribute("viewBox", [-b, -b, w, h].join(" "));
        PAGE.draw_step(panel_A, step_before, idx);
        if (step_after) {
            PAGE.draw_blank_step(panel_B, step_after, idx);
        }
        PAGE.draw_label(body, idx);
        return body;
    },
    get_nonscale_svg: (step, idx) => {
        const body = PAGE.draw_tutorial_body(1, 1);
        const b = SVG3.MARGIN;
        const s = SVG.SCALE;
        const panel = PAGE.draw_panel(body, s + 2 * b, s + 2 * b, b, b, idx);
        PAGE.draw_blank_step(panel, step, idx, false);
        return body;
    },
    get_row_col: (idx) => {
        const c = PAGE.layout.cols;
        const r = PAGE.layout.rows;
        const b = PAGE.layout.blanks;

        if (PAGE.current_idx == 0) {
            if (idx + b < r * c) {
                const c_ = (idx + b) % c;
                const r_ = (idx + b - c_) / c;
                return [r_, c_];
            }
            return [undefined, undefined];
        }
        const j = (idx + b) % (r * c);
        const p = (idx + b - j) / (r * c);
        if (p == PAGE.current_idx) {
            const c_ = (j) % c;
            const r_ = (j - c_) / c;
            return [r_, c_];
        }
        return [undefined, undefined];
    },
    get_river_row_col: (idx) => {

    },

    draw_body: (svg_page) => {
        const body = SVG.append("svg", svg_page);
        body.setAttribute("xmlns", SVG.NS);
        const w = PAGE.dim.width - 2 * PAGE.dim.margin_x;
        const h = PAGE.dim.height - 2 * PAGE.dim.margin_y;
        body.setAttribute("width", w);
        body.setAttribute("height", h);
        body.setAttribute("x", PAGE.dim.margin_x);
        body.setAttribute("y", PAGE.dim.margin_y);
        return body;
    },

    draw_tutorial_body: (r = 1, c = 2) => {
        const body = SVG.clear("tutorial");
        body.setAttribute("xmlns", SVG.NS);
        body.appendChild(document.getElementById("defs").cloneNode(true));

        const b = SVG3.MARGIN;
        const s = SVG.SCALE;
        const u = (s + 2 * b);
        const h = u * r
        const w = h * c;
        body.setAttribute("width", w);
        body.setAttribute("height", h);
        body.setAttribute("x", 0);
        body.setAttribute("y", 0);
        body.setAttribute("viewBox", [0, 0, w, h].join(" "));
        return body;
    },

    draw_panel: (body, w, h, x, y, id) => {
        const panel = SVG.append("svg", body);
        panel.setAttribute("xmlns", SVG.NS);
        panel.setAttribute("id", id);


        panel.setAttribute("width", w);
        panel.setAttribute("height", h);
        panel.setAttribute("x", x);
        panel.setAttribute("y", y);

        return panel;
    },
}