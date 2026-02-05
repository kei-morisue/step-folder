import { SVG } from "../flatfolder/svg.js";
import { PRJ } from "../defox/project.js";
import { DRAW } from "./draw.js";
import { PAINT } from "./paint.js";


export const GUI = {

    startup: () => {
        const dialog = document.getElementById("cpeditor");
        const showButton = document.getElementById("opencpeditor");
        const closeButton = document.getElementById("closeDialog");
        closeButton.addEventListener("click", () => {
            // alert("quit?");
            dialog.close();
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