import { SVG } from "../flatfolder/svg.js";
import { PRJ } from "../defox/project.js";
import { PAINT } from "./paint.js";
import { STEP } from "../defox/step.js";


export const GUI = {

    startup: () => {
        const dialog = document.getElementById("cpeditor");
        const showButton = document.getElementById("opencpeditor");
        const closeButton = document.getElementById("closeDialog");
        const svg = document.getElementById("cpedit");
        const input_angle_num = document.getElementById("cpedit_angle_num");
        const input_a = document.getElementById("cpedit_input_a");
        const mv = document.getElementById("cpedit_mv");
        const input_angle = document.getElementById("cpedit_input_angle");

        closeButton.onclick = GUI.close;
        showButton.onclick = GUI.open;
        svg.onpointermove = PAINT.onmove;
        svg.onclick = PAINT.onclick;
        svg.onmouseleave = PAINT.onmouseout;
        svg.oncontextmenu = PAINT.oncontextmenu;
        input_a.onclick = GUI.toggle_input_a;
        mv.onclick = () => {
            PAINT.set_mode("mv");
        }
        input_angle.onclick = () => {
            PAINT.set_mode("input_angle");
        }
        input_angle_num.onchange = () => {
            PAINT.bind_angle = 2 * Math.PI / input_angle_num.value;
        }

        dialog.onkeydown = GUI.toggle_input_a;
        dialog.onkeyup = GUI.toggle_input_a;
        dialog.onkeydown = GUI.bind;
        dialog.onkeydown = GUI.bind;


    },
    bind: (e) => {
        const mv = document.getElementById("cpedit_mv");
        const input_angle = document.getElementById("cpedit_input_angle");
        if (e.type != "keydown") {
            return;
        }
        if (e.key == " ") {
            input_angle.onclick();
            return;
        }
        if (e.key == "w") {
            mv.onclick();
        }

    },

    toggle_input_a: (e) => {
        const button = document.getElementById("cpedit_input_a")
        const a_ = button.innerHTML;
        let a = a_;
        if (e.type == "keydown" && e.key == "Control") {
            a = a_ == "F" ? "F" : "V";
        }
        if (e.type == "keyup" && e.key == "Control") {
            a = a_ == "F" ? "F" : "M";
        }
        if (e.type == "click") {
            a = a_ == "M" ? "F" : a_ == "V" ? "M" : "V";
        }
        const color = a == "M" ? "red" : a == "V" ? "blue" : "gray";
        button.setAttribute("style", `background: ${color}; color: white`);
        button.innerHTML = a;
        a = a == "M" ? "V" : a == "V" ? "M" : "F";
        PAINT.input_a = a;
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