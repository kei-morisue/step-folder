import { SVG } from "../flatfolder/svg.js";
import { PRJ } from "../defox/project.js";
import { PAINT } from "./paint.js";
import { STEP } from "../defox/step.js";


export const GUI = {

    startup: () => {

        const dialog = document.getElementById("cpeditor");
        const showButton = document.getElementById("opencpeditor");
        const closeButton = document.getElementById("closeDialog");
        const discardButton = document.getElementById("discardDialog");
        const svg = document.getElementById("cpedit");
        const input_angle_num = document.getElementById("cpedit_angle_num");
        const input_a = document.getElementById("cpedit_input_a");
        const mv = document.getElementById("cpedit_mv");
        const input_angle = document.getElementById("cpedit_input_angle");
        const input_free = document.getElementById("cpedit_input_free");
        const zoom_out = document.getElementById("cpedit_zoomout");
        const zoom_in = document.getElementById("cpedit_zoomin");
        const move = document.getElementById("cpedit_move");

        closeButton.onclick = GUI.close;
        discardButton.onclick = GUI.discard;

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
        input_free.onclick = () => {
            PAINT.set_mode("input_free");
        }
        move.onclick = () => {
            PAINT.set_mode("move");
        }

        input_angle_num.onchange = () => {
            PAINT.bind_angle = 2 * Math.PI / input_angle_num.value;
        }
        zoom_in.onclick = () => {
            PAINT.scale = Math.min(10, PAINT.scale + 1);
            PAINT.redraw();
        }
        zoom_out.onclick = () => {
            PAINT.scale = Math.max(1, PAINT.scale - 1);
            PAINT.redraw();
        }

        dialog.onkeydown = GUI.bind;
        dialog.onwheel = (e) => {
            e.preventDefault();
            if (e.deltaY > 0) {
                zoom_in.click();
            } else {
                zoom_out.click();
            }
        }
        GUI.set_svg("cpedit");

    },
    bind: (e) => {
        const mv = document.getElementById("cpedit_mv");
        const input_angle = document.getElementById("cpedit_input_angle");
        if (e.type != "keydown" && e.type != "keyup") {
            return;
        }
        if (e.key == " ") {
            e.preventDefault();
            input_angle.onclick();
            return;
        }
        if (e.key == "w") {
            mv.onclick();
            return;
        }
        GUI.toggle_input_a(e);
    },

    toggle_input_a: (e) => {
        const button = document.getElementById("cpedit_input_a")
        const a_ = button.innerHTML;
        let a = a_;
        if (e.type == "keydown" && e.key == "Control") {

            a = a_ == "M" ? "F" : a_ == "V" ? "M" : "V";
        }

        if (e.type == "click") {
            a = a_ == "M" ? "F" : a_ == "V" ? "M" : "V";
        }
        const color = PAINT.color[a];
        button.setAttribute("style", `background: ${color}; color: white`);
        button.innerHTML = a;
        a = a == "M" ? "V" : a == "V" ? "M" : "F";
        PAINT.input_a = a;
    },
    open: () => {
        const dialog = document.getElementById("cpeditor");
        const svg = document.getElementById("cpedit")

        dialog.showModal();
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

        PRJ.restore(i - 1);
        STEP.update_states();
        STEP.update_dist();
        PRJ.record(i - 1);
        PRJ.restore(i);
        STEP.update_states();
        STEP.update_dist();
        PRJ.record(i);
        STEP.redraw();
        PRJ.redraw_page();
    },

    discard: () => {
        const dialog = document.getElementById("cpeditor");
        dialog.close();
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