import { SVG } from "../flatfolder/svg.js";
import { Y } from "./y.js";
import { DRAW_LIN } from "./draw_lin.js";
import { DRAW } from "./draw.js";
import { SVG3 } from "./svg.js";
import { STEP } from "./step.js";
import { PRJ } from "./project.js";


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

    draw_title: (body, w, h, steps) => {
        if (!PAGE.make_title || PAGE.current_idx != 0) { return; }
        if (PAGE.layout.blanks > 0) { PAGE.draw_title_A(body, w, h, steps, .9); }
        if (PAGE.layout.blanks > 1) { PAGE.draw_title_B(body, w, h, .9); }
        if (PAGE.layout.blanks > 2) { PAGE.draw_title_C(body, w, h, steps, .9); }
    },
    draw_title_A: (body, w, h, steps, size) => {
        const panel = PAGE.draw_panel(body, w, h, 0, 0, "title_");
        const s = Math.min(w, h);
        const d = s * size;
        SVG.SCALE = d;
        const panel_d = PAGE.draw_panel(panel, s, s, (w - d) / 2, (h * .8 - d) / 2, "diagram_A");
        const b = s * SVG3.MARGIN / SVG3.INI_SCALE;
        const bb = `${-b} ${-b} ${s + 2 * b} ${s + 2 * b}`;
        panel_d.setAttribute("viewBox", bb);
        PAGE.draw_step(panel_d, steps[steps.length - 1], steps.length - 1);

        SVG.append("rect", panel, { x: 0, y: h * .8, width: w, height: h * 0.1, fill: "darkgray" });
        SVG3.reset();
        return panel;
    },
    draw_title_B: (body, w, h, size) => {
        const panel = PAGE.draw_panel(body, w, h, w, 0, "title_");
        const panel_d = PAGE.draw_panel(panel, w * size, h * size, w * (1 - size) / 2, h * (1 - size - 0.2) / 2, "diagram_B");

        SVG.append("text", panel_d, {
            x: 0,
            y: h * size / 4,
            "fill": "darkgray",
            "font-size": h * size / 8 + "pt",
            "font": PAGE.text.font,
        }).innerHTML = document.getElementById("title").value;
        SVG.append("line", panel_d, {
            x1: 0,
            x2: w * size,
            y1: h * size * (.3),
            y2: h * size * (.3),
            stroke: "darkgray",
            "stroke-width": 10
        })


        SVG.append("text", panel_d, {
            x: 0,
            y: h * size * (.3 + .1),
            "fill": "darkgray",
            "font-size": h * size * .0625 + "pt",
            "font": PAGE.text.font,
        }).innerHTML = document.getElementById("title_alt").value;
        SVG.append("text", panel_d, {
            x: 0,
            y: h * size * (.55),
            "fill": "black",
            "font-size": h * size * .05 + "pt",
            "font": PAGE.text.font,
        }).innerHTML = document.getElementById("desc0").value;
        SVG.append("text", panel_d, {
            x: 0,
            y: h * size * (.65),
            "fill": "black",
            "font-size": h * size * .05 + "pt",
            "font": PAGE.text.font,
        }).innerHTML = document.getElementById("desc1").value;
        SVG.append("text", panel_d, {
            x: 0,
            y: h * size * (.75),
            "fill": "black",
            "font-size": h * size * .05 + "pt",
            "font": PAGE.text.font,
        }).innerHTML = document.getElementById("desc2").value;

        SVG.append("rect", panel, { x: 0, y: h * .8, width: w, height: h * 0.1, fill: "darkgray" });
        return panel;
    },
    draw_title_C: (body, w, h, steps, size = .8) => {
        const panel = PAGE.draw_panel(body, w, h, w * 2, 0, "title_");
        const s = Math.min(w, h);
        const d = s * size;
        SVG.SCALE = d;
        const panel_d = PAGE.draw_panel(panel, s, s, (w - d) / 2, (h * .8 - d) / 2, "diagram_A");
        const b = s * SVG3.MARGIN / SVG3.INI_SCALE;
        const bb = `${-b} ${-b} ${s + 2 * b} ${s + 2 * b}`;
        panel_d.setAttribute("viewBox", bb);
        DRAW.draw_cp(steps[steps.length - 1].fold_cp, panel_d, false);

        SVG.append("rect", panel, { x: 0, y: h * .8, width: w, height: h * 0.1, fill: "darkgray" });
        SVG3.reset();
        return panel;
    },
    redraw: (svg, steps, defs = undefined, to_cell = false) => {
        document.getElementById("pages").innerHTML = PAGE.get_pages(steps);
        document.getElementById("page_idx").innerHTML = PAGE.current_idx + 1;

        svg.setAttribute("xmlns", SVG.NS);
        svg.setAttribute("style", "background: " + DRAW.color.background);
        svg.setAttribute("viewBox", [0, 0, PAGE.dim.width, PAGE.dim.height].join(" "));
        const body = PAGE.draw_body(svg);
        if (defs != undefined) {
            body.appendChild(defs.cloneNode(true));
        }
        const w = body.width.baseVal.value / PAGE.layout.cols;
        const h = body.height.baseVal.value / PAGE.layout.rows;

        PAGE.draw_title(body, w, h, steps);
        for (let i = 0; i < steps.length; i++) {
            const [r, c] = PAGE.get_row_col(i);
            if (r == undefined || c == undefined) {
                continue;
            }
            const panel = PAGE.draw_panel(body, w, h, w * c, h * r, "step_" + i);

            const s = Math.min(w, h);
            const d = s * (1.0 - PAGE.dim.margin_step * 0.01);
            SVG.SCALE = d;
            const panel_d = PAGE.draw_panel(panel, s, s, (s - d) / 2, (s - d) / 2, "diagram_" + i);
            const b = s * SVG3.MARGIN / SVG3.INI_SCALE;
            const bb = `${-b} ${-b} ${s + 2 * b} ${s + 2 * b}`;
            panel_d.setAttribute("viewBox", bb);
            PAGE.draw_step(panel_d, steps[i], i, to_cell);
            PAGE.draw_label(panel, i);

        }
        SVG3.reset();
        return svg;
    },
    draw_label: (panel, i) => {
        const t = PAGE.text.size;
        let num = i + 1;
        const loc = [t, t];
        if (PAGE.text.location == "Bottom") {
            loc[1] = h;
            num = num + ". "
        }
        const l = SVG3.draw_label(panel, loc, PAGE.text.color, num, t);
        l.setAttribute("font-family", PAGE.text.font);
        l.setAttribute("font-weight", PAGE.text.weght);
        return l;
    },

    draw_step: (panel_d, step, id, to_cell, render_all = true) => {
        const { flip0, rotate, scale, clip, cx, cy, depth } = step.params;

        const T = STEP.get_T(flip0, rotate, scale, cx, cy);
        const FOLD = step.fold_d;
        const CELL = step.cell_d;
        const symbols = step.symbols ?? [];

        if (to_cell) {
            if (CELL) {
                const STATE = Y.FOLD_CELL_2_STATE(FOLD, CELL);
                DRAW.draw_state(panel_d, FOLD, CELL, STATE, T, clip, id, symbols);
            }
            else {
                const CELL_d = Y.FOLD_2_CELL(FOLD);
                const STATE = Y.FOLD_CELL_2_STATE(FOLD, CELL_d);
                DRAW.draw_state(panel_d, FOLD, CELL_d, STATE, T, clip, id, symbols);
            }
        } else {
            if (CELL) {
                const STATE = Y.FOLD_CELL_2_STATE(FOLD, CELL);
                DRAW.draw_state(panel_d, FOLD, CELL, STATE, T, clip, id, symbols);
            } else {
                DRAW_LIN.draw_state(panel_d, FOLD, step.lin.S, T, clip, depth, id, symbols, render_all);
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