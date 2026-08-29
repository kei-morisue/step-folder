import { SVG } from "../flatfolder/svg.js";
import { PRJ } from "../defox/project.js";
import { PAINT } from "./paint.js";
import { STEP } from "../defox/step.js";
import { SVG3 } from "../defox/svg.js";
import { ACT } from "./action.js";
import { LOAD } from "../defox/gui/load.js";

export const GUI = {

    startup: () => {
        fetch('./resources/cyborg.xml')
            .then(response => response.text())
            .then(svgText => {
                const dialog = document.getElementById("cpeditor");
                dialog.innerHTML = svgText;


                const showButton = document.getElementById("opencpeditor");
                const closeButton = document.getElementById("closeDialog");
                const discardButton = document.getElementById("discardDialog");
                const svg = document.getElementById("cpedit");
                const input_angle_num = document.getElementById("cpedit_angle_num");
                const input_a = document.getElementById("cpedit_input_a");

                const del = document.getElementById("cpedit_delete");
                const mv = document.getElementById("cpedit_mv");
                const to_m = document.getElementById("cpedit_to_m");
                const to_v = document.getElementById("cpedit_to_v");
                const to_aux = document.getElementById("cpedit_to_aux");

                const input_angle = document.getElementById("cpedit_input_angle");
                const input_free = document.getElementById("cpedit_input_free");
                const input_bisector = document.getElementById("cpedit_input_bisector");
                const input_mirror = document.getElementById("cpedit_input_mirror");
                const zoom_out = document.getElementById("cpedit_zoomout");
                const zoom_in = document.getElementById("cpedit_zoomin");
                const move = document.getElementById("cpedit_move");
                const reset = document.getElementById("cpedit_reset");
                const undo = document.getElementById("cpedit_undo");
                const redo = document.getElementById("cpedit_redo");

                const bg = [del, mv, input_angle, input_free, input_bisector, move, to_m, to_aux, to_v, input_mirror];
                closeButton.onclick = async () => await GUI.close();
                discardButton.onclick = GUI.discard;

                showButton.onclick = GUI.open;
                svg.onclick = ACT.onclick;
                svg.oncontextmenu = ACT.oncontextmenu;
                svg.onpointerdown = PAINT.onpointdown;
                svg.onpointermove = ACT.hilight;
                svg.onpointerup = PAINT.onpointcancel;
                svg.onpointercancel = PAINT.onpointcancel;
                svg.onpointerleave = PAINT.onpointcancel;
                svg.onwheel = PAINT.onwheelscroll;
                input_a.onclick = GUI.toggle_input_a;

                del.onclick = () => {
                    PAINT.set_mode("del");
                    GUI.reset_bg(bg, del);
                    GUI.toggle_touch_action();
                }
                mv.onclick = () => {
                    PAINT.set_mode("mv");
                    GUI.reset_bg(bg, mv);
                    GUI.toggle_touch_action();
                }
                to_m.onclick = () => {
                    PAINT.set_mode("to_m");
                    GUI.reset_bg(bg, to_m);
                    GUI.toggle_touch_action();
                }
                to_v.onclick = () => {
                    PAINT.set_mode("to_v");
                    GUI.reset_bg(bg, to_v);
                    GUI.toggle_touch_action();
                }
                to_aux.onclick = () => {
                    PAINT.set_mode("to_aux");
                    GUI.reset_bg(bg, to_aux);
                    GUI.toggle_touch_action();
                }
                input_angle.onclick = () => {
                    PAINT.set_mode("input_angle");
                    GUI.reset_bg(bg, input_angle);
                    GUI.toggle_touch_action();
                }
                input_free.onclick = () => {
                    PAINT.set_mode("input_free");
                    GUI.reset_bg(bg, input_free);
                    GUI.toggle_touch_action();
                }
                input_bisector.onclick = () => {
                    PAINT.set_mode("input_bisector");
                    GUI.reset_bg(bg, input_bisector);
                    GUI.toggle_touch_action();
                }
                input_mirror.onclick = () => {
                    PAINT.set_mode("input_mirror");
                    GUI.reset_bg(bg, input_mirror);
                    GUI.toggle_touch_action();
                }
                move.onclick = () => {
                    PAINT.set_mode("move");
                    GUI.reset_bg(bg, move);
                    GUI.toggle_touch_action();
                }

                reset.onclick = PAINT.reset_view;
                undo.onclick = PAINT.undo;
                redo.onclick = PAINT.redo;

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

                dialog.onkeydown = GUI.key_bind;
                GUI.set_svg(svg.id);
                mv.click();
            });
    },

    reset_bg: (bg, b_0) => {
        for (const b of bg) {
            b.style["background-color"] = "";
        }
        b_0.style["background-color"] = "darkgray";
    },
    
    toggle_touch_action: () => {
        const dialog = document.getElementById("cpeditor");
        dialog.style.touchAction = (PAINT.current_mode == "move") ? "none" : "auto";
    },
    
    key_bind: (e) => {
        const mv = document.getElementById("cpedit_mv");
        const input_angle = document.getElementById("cpedit_input_angle");
        const undo = document.getElementById("cpedit_undo");
        const redo = document.getElementById("cpedit_redo");
        const move = document.getElementById("cpedit_move");
        const trim = document.getElementById("cpedit_trim");

        if (e.type != "keydown" && e.type != "keyup") {
            return;
        }
        if (e.key == " ") {
            e.preventDefault();
            input_angle.onclick();
            return;
        }
        if (e.key == "w" && e.altKey) {
            trim.onclick();
            return;
        }
        if (e.key == "w") {
            mv.onclick();
            return;
        }

        if (e.key == "z" && e.ctrlKey && e.altKey) {
            move.onclick();
            return;
        }
        if (e.key == "z" && e.ctrlKey) {
            undo.click();
            return;
        }
        if (e.key == "y" && e.ctrlKey) {
            redo.click();
            return;
        }

        GUI.toggle_input_a(e);
    },

    toggle_input_a: (e) => {
        const button = document.getElementById("cpedit_input_a")
        const a_ = button.innerHTML;
        let a = a_;
        if (e.type == "keydown" && e.key == "Shift") {

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
    close: async () => {
        const dialog = document.getElementById("cpeditor");
        if (PAINT.is_invalid) {
            alert("The Crease Pattern is not Flat Foldable.");
            return;
        }
        dialog.close();
        LOAD.set(3, async () => await GUI.calculate());
    },

    calculate: async () => {
        const is_interp = document.getElementById("cpedit_crease_interp").checked;
        const i = PRJ.current_idx;
        const { FOLD, CELL } = PAINT.get_FOLD_CELL(i, is_interp);
        PRJ.steps[i].fold_cp = FOLD;
        PRJ.steps[i].cell_cp = CELL;
        await LOAD.report();

        PRJ.restore(i - 1);
        STEP.update_states();
        STEP.update_dist();
        PRJ.record(i - 1);
        PRJ.restore(i);
        await LOAD.report();

        STEP.update_states();
        STEP.update_dist();
        PRJ.record(i);
        STEP.redraw();
        PAINT.reset();
        await LOAD.report();

    },

    discard: () => {
        const dialog = document.getElementById("cpeditor");
        dialog.close();
    },
    set_svg: (id) => {
        const [b, s] = [SVG3.MARGIN, SVG.SCALE];

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