import { SVG } from "../flatfolder/svg.js";
import { PRJ } from "../defox/project.js";
import { PAINT } from "./paint.js";
import { STEP } from "../defox/step.js";


export const GUI = {

    startup: () => {
        const dialog = document.getElementById("cpeditor");
        const showButton = document.getElementById("opencpeditor");
        const closeButton = document.getElementById("closeDialog");
        closeButton.addEventListener("click", () => {
            if (PAINT.VK) {
                dialog.close();
                const i = PRJ.current_idx;
                const { FOLD, CELL, VK } = PAINT.get_FOLD_CELL_VK();
                PRJ.steps[i].fold_cp = FOLD;
                PRJ.steps[i].cell_cp = CELL;
                PRJ.restore(i);
                STEP.update_states();
                STEP.redraw();
            }
        });
        showButton.onclick = () => {
            dialog.showModal();
            GUI.set_svg("cpedit");
            const FOLD = PRJ.steps[PRJ.current_idx].fold_cp;
            const svg = document.getElementById("cpedit")
            PAINT.initialize(FOLD, svg);
            PAINT.redraw();
            svg.onpointermove = PAINT.onmove;
            svg.onclick = PAINT.onclick;
            document.getElementById("cpedit_mv").onclick = () => {
                PAINT.set_mode("mv");
            }
            document.getElementById("cpedit_input_angle").onclick = () => {
                PAINT.set_mode("input_angle");
            }

        };


    },
    set_svg: (id) => {
        const [b, s] = [SVG.MARGIN, SVG.SCALE];

        const svg = document.getElementById(id);
        for (const [k, v] of Object.entries({
            xmlns: SVG.NS,
            height: s,
            width: s,
            viewBox: [-b, -b, s + 2 * b, s + 2 * b].join(" "),
        })) {
            svg.setAttribute(k, v);
        }
    },
}