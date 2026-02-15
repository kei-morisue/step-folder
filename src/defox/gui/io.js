import { PAGE } from "../page.js";

import { PRJ } from "../project.js";
import { IO3 } from "../io.js";
import { STEP } from "../step.js";
import { Y } from "../y.js";


export const GUI_IO = {
    startup: () => {
        document.getElementById("new").onclick = (e) => {
            if (confirm("Are you sure to discard current sequence?")) {
                const is_interp = document.getElementById("crease_interp").checked;
                GUI_IO.import_cps(is_interp);
                PRJ.refresh();
            }
        };
        document.getElementById("import0").onclick = () => {
            const is_interp = document.getElementById("crease_interp").checked;
            GUI_IO.import_cps(is_interp)
        };
        document.getElementById("save_proj").onclick = (e) => {
            PRJ.record(PRJ.current_idx);
            const pj = document.getElementById("proj_name").value;
            IO3.save(PRJ.steps, pj);
        };
        document.getElementById("import_proj").onclick = GUI_IO.import_project;

        document.getElementById("remove").onclick = PRJ.remove;
        document.getElementById("duplicate").onclick = PRJ.duplicate;

        document.getElementById("export").onclick = (e) => {
            const ext = document.getElementById("export_ext").value;
            const pj = document.getElementById("proj_name").value;

            IO3.write("state3", pj, ext, PRJ.current_idx);
        };


    },

    import_cps: (is_interp = false) => {
        const button = document.createElement("input");
        button.setAttribute("type", "file");
        button.setAttribute("multiple", true);
        button.setAttribute("accept", ".cp");
        button.dispatchEvent(new MouseEvent("click"));
        button.onchange = (e) => {
            const l = e.target.files.length;
            if (l == 0) {
                return false;
            }
            const el_input = e.target;
            const file_reader = new FileReader();
            const read = (i) => {
                const file = el_input.files[i];
                file_reader.readAsText(file);
                file_reader.onload = (e) => {
                    const is_new = PRJ.steps.length == 0;
                    const res = GUI_IO.import_cp(file.name, e.target.result, is_new, is_interp);
                    if (res && i < l - 1) {
                        read(i + 1);
                    }
                }
            }
            read(0);
        }
    },
    import_cp: (path, doc, is_new = false, is_interp = false) => {
        if (!doc) {
            return false;
        }
        const FOLD_infer = !is_new && is_interp ? PRJ.steps[PRJ.current_idx].fold_cp : undefined;
        const [FOLD1, CELL1] = Y.CP_2_FOLD_CELL(doc, FOLD_infer);
        if (FOLD1 == undefined) {
            alert("unfoldable Crease Pattern: " + path)
            return false;
        }

        if (is_new) {
            const [FOLD0, CELL0] = Y.FOLD_2_PAPER(FOLD1);
            const step0 = { fold_cp: FOLD0, cell_cp: CELL0 };
            const step1 = { fold_cp: FOLD1, cell_cp: CELL1 };
            PRJ.steps.push(step0);
            PRJ.steps.push(step1);
        }
        else {
            const step = { fold_cp: FOLD1, cell_cp: CELL1 };
            PRJ.steps.splice(PRJ.current_idx + 1, 0, step);
        }
        PRJ.restore(PRJ.current_idx);
        STEP.new();
        PRJ.record(PRJ.current_idx);

        PRJ.restore(PRJ.current_idx + 1);
        STEP.new();
        PRJ.record(PRJ.current_idx);
        PRJ.restore(PRJ.current_idx);

        return true;
    },

    import_project: (e) => {
        const button = document.createElement("input");
        button.setAttribute("type", "file");
        button.setAttribute("accept", ".defox");
        button.click();
        button.onchange = (e) => {
            if (e.target.files.length != 1) {
                return;
            }
            const file_reader = new FileReader();
            file_reader.onload = (e) => {
                const doc = e.target.result;
                let pj = button.value.split("\\");
                pj = pj[pj.length - 1];
                pj = pj.split(".defox");
                pj = pj[0];
                document.getElementById("proj_name").value = pj;
                PRJ.steps = IO3.load(JSON.parse(doc));
                PRJ.restore(PRJ.steps.length - 1);
                STEP.redraw();
                PRJ.redraw_page();
            };
            file_reader.readAsText(e.target.files[0]);
        }

    },


}