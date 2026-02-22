import { SVG } from "../flatfolder/svg.js"
import { STEP } from "../defox/step.js"
import { DRAW as D } from "../defox/draw.js"
import { SEG } from "../defox/segment.js"
import { PRJ } from "../defox/project.js"

import { SYM } from "../defox/symbol.js"
import { PAINT } from "./paint.js"

import { GUI } from "./gui.js"

export const CTRL = {

    set_range: (symbol, l) => {
        const range_d = document.createElement("input");
        range_d.type = "range";
        range_d.min = 0;
        range_d.max = l - 1;
        range_d.step = 1;
        range_d.value = symbol.depth;

        range_d.oninput = (e) => {
            symbol.depth = parseInt(e.target.value);
            PAINT.redraw();
        };
        const div = document.createElement("div");
        const lbl = document.createElement("label");
        div.appendChild(lbl);
        div.appendChild(range_d);
        lbl.innerHTML = "depth";
        return div;
    },

    set_remove: (i, l) => {
        const rem = document.createElement("button");
        rem.innerHTML = "remove";
        rem.onclick = () => {
            PAINT.symbols.splice(i, 1);
            GUI.set_controls(l);
            PAINT.redraw();
        }
        return rem;
    },

    set_flip: (symbol) => {
        const flip = document.createElement("button");
        flip.innerHTML = "flip";
        flip.onclick = () => {
            symbol.params.is_clockwise = !symbol.params.is_clockwise;
            PAINT.redraw();
        }
        return flip;
    },

    set_reverse: (symbol) => {
        const rev = document.createElement("button");
        rev.innerHTML = "reverse";
        rev.onclick = () => {
            symbol.params.is_rev = !symbol.params.is_rev;
            PAINT.redraw();
        }
        return rev;
    },

    set_length: (symbol) => {
        const range_l = document.createElement("input");
        range_l.type = "range";
        range_l.min = 0;
        range_l.max = 10;
        range_l.step = 0.0001;
        range_l.value = symbol.params.length;

        range_l.oninput = (e) => {
            symbol.params.length = parseFloat(e.target.value);
            PAINT.redraw();
        };
        const div = document.createElement("div");
        const lbl = document.createElement("label");
        const reset = document.createElement("button");
        reset.onclick = () => {
            range_l.value = 1;
            symbol.params.length = 1;
            PAINT.redraw();
        }
        div.appendChild(lbl);
        div.appendChild(range_l);
        div.appendChild(reset);
        lbl.innerHTML = "length";
        reset.innerHTML = "reset";
        return div;
    },

    set_offset: (symbol) => {
        const range_off = document.createElement("input");
        range_off.type = "range";
        range_off.min = -5;
        range_off.max = 5;
        range_off.step = 0.0001;
        range_off.value = symbol.params.offset;

        range_off.oninput = (e) => {
            symbol.params.offset = parseFloat(e.target.value);
            PAINT.redraw();
        };
        const div = document.createElement("div");
        const lbl = document.createElement("label");
        const reset = document.createElement("button");
        reset.onclick = () => {
            range_off.value = 0;
            symbol.params.offset = 0;
            PAINT.redraw();
        }
        div.appendChild(lbl);
        div.appendChild(range_off);
        div.appendChild(reset);
        lbl.innerHTML = "offset";
        reset.innerHTML = "reset";
        return div;
    },
    set_cps: (symbol) => {
        const cps = PRJ.steps.map((s) => s.fold_cp);
        const i0 = cps.indexOf(symbol.params.cp_0);
        const i1 = cps.indexOf(symbol.params.cp_1);
        const range_cp1 = document.createElement("input");
        range_cp1.type = "range";
        range_cp1.min = i0 < 0 ? 1 : i0 + 1;
        range_cp1.max = PRJ.current_idx + 1;
        range_cp1.step = 1;
        range_cp1.value = i1 < 0 ? range_cp1.max : i1 + 1;

        const range_cp0 = document.createElement("input");
        range_cp0.type = "range";
        range_cp0.min = 1;
        range_cp0.max = i1 < 0 ? range_cp1.value : i1 + 1;
        range_cp0.step = 1;
        range_cp0.value = i0 < 0 ? range_cp0.max : i0 + 1;

        range_cp0.oninput = (e) => {
            const j0 = parseInt(e.target.value) - 1;
            symbol.params.cp0 = PRJ.steps[j0].fold_cp;
            range_cp1.min = j0 + 1;
            PAINT.redraw();
        };
        range_cp1.oninput = (e) => {
            const j1 = parseInt(e.target.value) - 1;
            symbol.params.cp1 = PRJ.steps[j1].fold_cp;
            range_cp0.max = j1 + 1;
            PAINT.redraw();
        };
        const div = document.createElement("div");
        const div0 = document.createElement("div");
        const div1 = document.createElement("div");
        const lbl0 = document.createElement("label");
        lbl0.innerHTML = "from";
        const lbl1 = document.createElement("label");
        lbl1.innerHTML = "to";
        div.appendChild(div0);
        div.appendChild(div1);
        div0.appendChild(lbl0);
        div0.appendChild(range_cp0);
        div1.appendChild(lbl1);
        div1.appendChild(range_cp1);
        return div;
    },
    set: (body, i, symbol, l) => {

        const div = document.createElement("div");
        div.setAttribute("class", "axanael_controls");
        body.appendChild(div);
        const template = document.getElementById(`template_${symbol.type}`).cloneNode(true);
        div.appendChild(template);

        const buttons = document.createElement("div");
        div.appendChild(buttons);
        if (symbol.params.is_clockwise != undefined) {
            const flip = CTRL.set_flip(symbol);
            buttons.appendChild(flip);
        }

        if (symbol.params.is_rev != undefined) {
            const rev = CTRL.set_reverse(symbol);
            buttons.appendChild(rev);
        }

        if (symbol.params.length != undefined) {
            const length = CTRL.set_length(symbol);
            div.appendChild(length);
        }

        if (symbol.params.offset != undefined) {
            const offset = CTRL.set_offset(symbol);
            div.appendChild(offset);
        }
        if (symbol.params.cp0 != undefined && symbol.params.cp1 != undefined) {
            const offset = CTRL.set_cps(symbol);
            div.appendChild(offset);
        }

        const range_d = CTRL.set_range(symbol, l);
        div.appendChild(range_d);


        const rem = CTRL.set_remove(i, l);
        div.appendChild(rem);

    },
}