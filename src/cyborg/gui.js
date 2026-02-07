import { SVG } from "../flatfolder/svg.js";
import { PRJ } from "../defox/project.js";
import { PAINT } from "./paint.js";
import { STEP } from "../defox/step.js";


export const GUI = {

    startup: () => {
        const showButton = document.getElementById("opencpeditor");
        const closeButton = document.getElementById("closeDialog");
        const svg = document.getElementById("cpedit");
        const input_angle_num = document.getElementById("cpedit_angle_num");
        closeButton.onclick = GUI.close;
        showButton.onclick = GUI.open;
        svg.onpointermove = PAINT.onmove;
        svg.onclick = PAINT.onclick;
        svg.onmouseleave = PAINT.onmouseout;
        document.getElementById("cpedit_mv").onclick = () => {
            PAINT.set_mode("mv");
        }
        document.getElementById("cpedit_input_angle").onclick = () => {
            PAINT.set_mode("input_angle");
        }
        input_angle_num.onchange = () => {
            PAINT.bind_angle = 2 * Math.PI / input_angle_num.value;
        }


    },

    open: () => {
        const dialog = document.getElementById("cpeditor");
        const svg = document.getElementById("cpedit")
        dialog.showModal();
        GUI.set_svg("cpedit");
        const FOLD = PRJ.steps[PRJ.current_idx].fold_cp;
        PAINT.initialize(FOLD, svg);
        PAINT.redraw();
    },
    close: () => {
        const dialog = document.getElementById("cpeditor");
        if (PAINT.is_invalid) {
            alert("The Crease Pattern is not Flat Foldable.");
            return;
        }
        dialog.close();
        const i = PRJ.current_idx;
        const { FOLD, CELL } = PAINT.get_FOLD_CELL_VK();
        PRJ.steps[i].fold_cp = FOLD;
        PRJ.steps[i].cell_cp = CELL;
        PRJ.restore(i);
        STEP.update_states();
        STEP.update_dist();
        STEP.redraw();
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