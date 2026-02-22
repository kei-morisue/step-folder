import { STEP } from "../step.js";
import { DRAW } from "../draw.js";
import { PRJ } from "../project.js";
import { PAGE } from "../page.js";
import { GUI } from "./gui.js";
import { SYM } from "../symbol.js";
import { IO3 } from "../io.js";

export const GUI_PAGE = {
    startup: () => {
        const preview = document.getElementById("preview");
        fetch('./resources/preview.xml')
            .then(response => response.text())
            .then(xml => {
                preview.innerHTML = xml;

                document.getElementById("page_export").onclick = (e) => {
                    const ext = document.getElementById("page_export_ext").value;
                    const pj = document.getElementById("proj_name").value;
                    IO3.write("page", pj, ext);
                };

                document.getElementById("topcolor").onchange = (e) => {
                    DRAW.color.face.top = e.target.value
                    STEP.redraw()
                }

                document.getElementById("bottomcolor").onchange = (e) => {
                    DRAW.color.face.bottom = e.target.value
                    STEP.redraw()
                }
                document.getElementById("draw_uncreases").onclick = (e) => {
                    DRAW.uncreases = e.target.checked;
                    STEP.redraw();
                }

                document.getElementById("bgcolor").onchange = (e) => {
                    DRAW.color.background = e.target.value
                    STEP.update_dist()
                }

                document.getElementById("page_next").onclick = GUI_PAGE.next;
                document.getElementById("page_prev").onclick = GUI_PAGE.prev;

                document.getElementById("page_reload").onclick = (e) => {
                    PRJ.record(PRJ.current_idx);
                    PRJ.redraw_page();
                }


                document.getElementById("loc_text").onchange = (e) => {
                    PAGE.text.location = e.target.value;
                    PRJ.redraw_page();
                }

                PRJ.setup_number_options(
                    ["width_crease",
                        "width_boundary",
                        "width_MMVV",
                        "width_arrow"],
                    ["F", "B", ["MM", "VV"]],
                    [1, 3, 6],
                    DRAW.width.edge
                );
                PRJ.setup_number_options(
                    ["width_arrow"],
                    ["arrow"],
                    [4],
                    SYM.width
                );

                PRJ.setup_number_options(
                    ["size_text"],
                    ["size"],
                    [100],
                    PAGE.text
                );
                PRJ.setup_number_options(
                    ["dim_r", "dim_c", "dim_b"],
                    ["rows", "cols", "blanks"],
                    [4, 3, 1],
                    PAGE.layout
                );
                PRJ.setup_number_options(
                    ["dim_w", "dim_h", "dim_x", "dim_y", "step_x"],
                    ["width", "height", "margin_x", "margin_y", "margin_step"],
                    [2894, 4093, 50, 80, 10],
                    PAGE.dim
                );
                GUI.open_close("option_color", "inline");
                GUI.open_close("option_width", "inline");
                GUI.open_close("option_layers", "inline");
                GUI.open_close("option_text", "inline");
                GUI.open_close("option_layout", "inline");
                GUI.open_close("option_dim", "inline");
                PRJ.redraw_page();
            });
    },

    prev: () => {
        if (PAGE.current_idx == 0) {
            return;
        }
        PAGE.current_idx = PAGE.current_idx - 1;
        PRJ.redraw_page();
    },
    next: () => {

        if (PAGE.get_pages(PRJ.steps) - 1 < PAGE.current_idx + 1) {
            return;
        }
        PAGE.current_idx = PAGE.current_idx + 1;
        PRJ.redraw_page();
    },

}