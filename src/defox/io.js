import { NOTE } from "../flatfolder//note.js";
import { SVG } from "../flatfolder//svg.js";

export const IO3 = {    // INPUT-OUTPUT
    write: (FOLD, svg_id, name) => {
        const { V, Vf, EV, EA, FV, FO } = FOLD;

        const img = new Blob([document.getElementById(svg_id).outerHTML], {
            type: "image/svg+xml"
        });
        const type = "img";
        const ext = "svg";
        const link = document.createElement("a");
        const button = document.createElement("input");
        link.appendChild(button);
        link.setAttribute("download", `${name}_${type}.${ext}`);
        link.setAttribute("href", window.URL.createObjectURL(img));
        button.setAttribute("type", "button");
        button.setAttribute("value", type);
        button.click();

    },
}