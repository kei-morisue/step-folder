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
        return range_d;
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

    set_scale: (symbol) => {
        const range_s = document.createElement("input");
        range_s.type = "range";
        range_s.min = 0;
        range_s.max = 5;
        range_s.step = 0.0001;
        range_s.value = 1;

        range_s.oninput = (e) => {
            symbol.params.scale = parseInt(e.target.value);
            PAINT.redraw();
        };
        return range_s;
    },

    set_offset: (symbol) => {
        const range_off = document.createElement("input");
        range_off.type = "range";
        range_off.min = -5;
        range_off.max = 5;
        range_off.step = 0.0001;
        range_off.value = 1;

        range_off.oninput = (e) => {
            symbol.params.offset = parseInt(e.target.value);
            PAINT.redraw();
        };
        return range_off;
    },

    set: (body, i, symbol, l) => {

        const span = document.createElement("span");
        body.appendChild(span);

        if ([0, 1, 2, 3, 6, 7].indexOf(symbol.type) >= 0) {
            const flip = CTRL.set_flip(symbol);
            span.appendChild(flip);
        }

        if ([0, 1, 2, 3, 4, 5, 6, 7].indexOf(symbol.type) >= 0) {
            const rev = CTRL.set_reverse(symbol);
            span.appendChild(rev);
        }


        const range_d = CTRL.set_range(symbol, l);
        span.appendChild(range_d);


        const rem = CTRL.set_remove(i, l);
        span.appendChild(rem);

    },
}