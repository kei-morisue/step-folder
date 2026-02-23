import { SVG } from "../flatfolder/svg.js";
import { Y } from "./y.js";
import { DRAW_LIN } from "./draw_lin.js";
import { DRAW } from "./draw.js";
import { SVG3 } from "./svg.js";
import { STEP } from "./step.js";


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
        blanks: 1,
    },
    text: {
        color: "black",
        size: 100,
        font: "Arial",
        weght: "bold",
        location: "Top",
    },
    is_river: false,
    river_flow: 1,
    current_idx: 0,

    get_pages: (steps) => {
        const c = PAGE.layout.cols;
        const r = PAGE.layout.rows;
        const b = PAGE.layout.blanks;
        return Math.ceil((steps.length + b) / (r * c));
    },
    redraw: (svg, steps) => {
        document.getElementById("pages").innerHTML = PAGE.get_pages(steps);
        document.getElementById("page_idx").innerHTML = PAGE.current_idx + 1;

        svg.setAttribute("xmlns", SVG.NS);
        svg.setAttribute("style", "background: " + DRAW.color.background);
        svg.setAttribute("viewBox", [0, 0, PAGE.dim.width, PAGE.dim.height].join(" "));
        const body = PAGE.draw_body();
        body.appendChild(document.getElementById("defs").cloneNode(true));
        const w = body.width.baseVal.value / PAGE.layout.cols;
        const h = body.height.baseVal.value / PAGE.layout.rows;

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
            PAGE.draw_step(panel_d, steps[i], i);
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


        }
        SVG3.reset();
    },
    draw_step: (panel_d, step, id) => {
        const { flip0, rotate, scale, clip, cx, cy, depth } = step.params;

        const T = STEP.get_T(flip0, rotate, scale, cx, cy);
        const FOLD = step.fold_d;
        const CELL = step.cell_d;
        const symbols = step.symbols ?? [];

        if (CELL) {
            const STATE = Y.FOLD_CELL_2_STATE(FOLD, CELL);
            DRAW.draw_state(panel_d, FOLD, CELL, STATE, T, clip, id, symbols);
        } else {
            DRAW_LIN.draw_state(panel_d, FOLD, step.lin.S, T, clip, depth, id, symbols);
        }
    },
    get_row_col: (idx) => {
        const c = PAGE.layout.cols;
        const r = PAGE.layout.rows;
        const b = PAGE.layout.blanks;

        if (PAGE.current_idx == 0) {
            if (idx + b <= r * c) {
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
    draw_body: () => {
        const body = SVG.clear("page_body");
        body.setAttribute("xmlns", SVG.NS);

        const w = PAGE.dim.width - 2 * PAGE.dim.margin_x;
        const h = PAGE.dim.height - 2 * PAGE.dim.margin_y;
        body.setAttribute("width", w);
        body.setAttribute("height", h);
        body.setAttribute("x", PAGE.dim.margin_x);
        body.setAttribute("y", PAGE.dim.margin_y);
        // body.setAttribute("viewBox", [0, 0, w, h].join(" "));
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