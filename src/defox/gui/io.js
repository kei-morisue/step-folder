import { LOAD } from "../gui/load.js";
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
                PRJ.refresh();
                GUI_IO.import_cps(is_interp);
            }
        };
        document.getElementById("import0").onclick = () => {
            const is_interp = document.getElementById("crease_interp").checked;
            GUI_IO.import_cps(is_interp)
        };
        document.getElementById("save_proj").onclick = async (e) => {
            PRJ.record(PRJ.current_idx);
            const pj = document.getElementById("proj_name").value;
            await IO3.save(PRJ.steps, pj);
        };
        document.getElementById("import_proj").onclick = GUI_IO.import_project;

        document.getElementById("remove").onclick = PRJ.remove;

        document.getElementById("export").onclick = async (e) => {
            const ext = document.getElementById("export_ext").value;
            const pj = document.getElementById("proj_name").value;

            await IO3.write("state3", pj, ext, PRJ.current_idx);
        };


    },

    import_cps: (is_interp = false) => {
        const button = document.createElement("input");
        button.setAttribute("type", "file");
        button.setAttribute("multiple", true);
        button.setAttribute("accept", ".cp");
        button.dispatchEvent(new MouseEvent("click"));
        button.onchange = async (e) => {
            const l = e.target.files.length;
            if (l == 0) {
                return false;
            }
            const readFileAsText = (file) => {
                return new Promise((resolve, reject) => {
                    const reader = new FileReader();
                    reader.onload = (event) => resolve(event.target.result);
                    reader.onerror = (error) => reject(error);
                    reader.readAsText(file);
                });
            };

            await LOAD.set(l, async () => {
                for (let i = 0; i < l; i++) {
                    const file = e.target.files[i];
                    const textContent = await readFileAsText(file);
                    const is_new = PRJ.steps.length == 0;
                    const res = await GUI_IO.import_cp(file.name, textContent, is_new, is_interp);

                    if (res) {
                        await LOAD.report();
                    }
                }
            });
        }
    },
    import_cp: async (path, doc, is_new = false, is_interp = false) => {
        if (!doc) {
            return false;
        }
        PRJ.record(PRJ.current_idx);
        const FOLD_infer = !is_new && is_interp ? PRJ.steps[PRJ.current_idx].fold_cp : undefined;
        let limit = parseInt(document.getElementById("assign_limit").value);
        if (limit == 0) { limit = Infinity };
        const [FOLD1, CELL1] = await Y.CP_2_FOLD_CELL(doc, limit, FOLD_infer);
        if (FOLD1 == undefined) {
            alert("unfoldable Crease Pattern: " + path)
            return false;
        }

        if (is_new) {
            await LOAD.status("Building the Initial CP");
            const [FOLD0, CELL0] = await Y.FOLD_2_PAPER(FOLD1);
            const step0 = { fold_cp: FOLD0, cell_cp: CELL0, id: Date.now() + Math.floor(Math.random() * 100000) };
            const step1 = { fold_cp: FOLD1, cell_cp: CELL1, id: Date.now() + Math.floor(Math.random() * 100000) };
            PRJ.steps.push(step0);
            PRJ.steps.push(step1);
        }
        else {
            const step = { fold_cp: FOLD1, cell_cp: CELL1, id: Date.now() + Math.floor(Math.random() * 100000) };
            PRJ.steps.splice(PRJ.current_idx + 1, 0, step);
        }
        await LOAD.status("Detecting CP differences");
        PRJ.restore(PRJ.current_idx);
        STEP.new(is_new);
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
            file_reader.onload = async (e) => {
                const doc = e.target.result;
                let pj = button.value.split("\\");
                pj = pj[pj.length - 1];
                pj = pj.split(".defox");
                pj = pj[0];
                document.getElementById("proj_name").value = pj;
                PRJ.steps = await IO3.load(JSON.parse(doc));
                PRJ.restore(PRJ.steps.length - 1);
                STEP.redraw();
                PAGE.current_idx = 0;
                PRJ.redraw_page();
            };
            file_reader.readAsText(e.target.files[0]);
        }

    },


}