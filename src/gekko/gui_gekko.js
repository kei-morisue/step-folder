import { SVG } from "../flatfolder/svg.js";
import { PRJ } from "../defox/project.js";
import { STEP } from "../defox/step.js";
import { SVG3 } from "../defox/svg.js";
import { LOAD } from "../defox/gui/load.js";
import { PAINT } from "./paint.js";
import { ACT } from "./action.js";

export const GUI = {

    startup: () => {
        fetch('./resources/gekko.xml')
            .then(response => response.text())
            .then(svgText => {
                const dialog = document.getElementById("gekko");
                dialog.innerHTML = svgText;


                const showButton = document.getElementById("opengekko");
                const closeButton = document.getElementById("closegekko");
                const discardButton = document.getElementById("discardgekko");
                const svg = document.getElementById("gekko_cp");
                const input_angle_num = document.getElementById("gekko_angle_num");

                const del = document.getElementById("gekko_delete");
                const input_angle = document.getElementById("gekko_input_angle");
                const input_bisector = document.getElementById("gekko_input_bisector");
                const input_mirror = document.getElementById("gekko_input_mirror");
                const input_all = document.getElementById("gekko_input_all");
                const delete_all = document.getElementById("gekko_delete_all");


                const zoom_out = document.getElementById("gekko_zoomout");
                const zoom_in = document.getElementById("gekko_zoomin");
                const move = document.getElementById("gekko_move");
                const reset = document.getElementById("gekko_reset");
                const undo = document.getElementById("gekko_undo");
                const redo = document.getElementById("gekko_redo");

                const bg = [del, input_angle, input_bisector, move, input_mirror];
                closeButton.onclick = async () => await GUI.close();
                discardButton.onclick = GUI.discard;

                showButton.onclick = async () => await GUI.open();
                svg.onpointermove = ACT.hilight;
                svg.onclick = ACT.onclick;
                svg.onmouseleave = PAINT.onmouseout;
                svg.oncontextmenu = ACT.oncontextmenu;

                del.onclick = () => {
                    PAINT.set_mode("del");
                    GUI.reset_bg(bg, del);
                }
                input_angle.onclick = () => {
                    PAINT.set_mode("input_angle");
                    GUI.reset_bg(bg, input_angle);
                }
                input_bisector.onclick = () => {
                    PAINT.set_mode("input_bisector");
                    GUI.reset_bg(bg, input_bisector);
                }
                input_mirror.onclick = () => {
                    PAINT.set_mode("input_mirror");
                    GUI.reset_bg(bg, input_mirror);
                }
                move.onclick = () => {
                    PAINT.set_mode("move");
                    GUI.reset_bg(bg, move);
                }

                input_all.onclick = () => {
                    PAINT.all(false);
                    PAINT.redraw();
                }
                delete_all.onclick = () => {
                    PAINT.all(true);
                    PAINT.redraw();
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
                input_angle.click();
            });
    },

    reset_bg: (bg, b_0) => {
        for (const b of bg) {
            b.style["background-color"] = "";
        }
        b_0.style["background-color"] = "darkgray";
    },
    key_bind: (e) => {
        const input_angle = document.getElementById("gekko_input_angle");
        const undo = document.getElementById("gekko_undo");
        const redo = document.getElementById("gekko_redo");

        if (e.type != "keydown" && e.type != "keyup") {
            return;
        }
        if (e.key == " ") {
            e.preventDefault();
            input_angle.onclick();
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
    },

    open: async () => {
        const dialog = document.getElementById("gekko");
        const svg = document.getElementById("gekko_cp")

        dialog.showModal();
        const STEP = PRJ.steps[Math.max(PRJ.current_idx, 0)];
        const FOLD = STEP.fold;
        const CATAL = STEP.catalyst;
        await PAINT.initialize(FOLD, svg, CATAL);
        PAINT.redraw();
    },
    close: async () => {
        const dialog = document.getElementById("gekko");
        if (PAINT.is_invalid) {
            alert("The Crease Pattern is not Flat Foldable.");
            return;
        }
        dialog.close();
        await GUI.calculate();
    },

    calculate: async () => {
        const i = PRJ.current_idx;

        PRJ.steps[i].catalyst = PAINT.get_catalyst();
        PRJ.restore(i);
        await STEP.update_states();
        STEP.update_dist();
        PRJ.record(i);
        await STEP.redraw();
        PAINT.reset();
    },

    discard: () => {
        const dialog = document.getElementById("gekko");
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