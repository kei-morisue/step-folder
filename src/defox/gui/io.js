import { PRJ } from "../project.js";
import { IO3 } from "../io.js";
import { STEP } from "../step.js";
import { Y } from "../y.js";


export const GUI_IO = {
    startup: () => {
        document.getElementById("new").onclick = (e) => {
            if (confirm("Are you sure to discard current sequence?")) {
                GUI_IO.read();
                PRJ.refresh();
            }
        };
        document.getElementById("export").onclick = (e) => {
            const ext = document.getElementById("export_ext").value;
            IO3.write("state3", "step_" + PRJ.current_idx, ext);
        };
        document.getElementById("import0").onclick = GUI_IO.read;
        document.getElementById("save_proj").onclick = (e) => {
            const pj = document.getElementById("proj_name").value;
            IO3.save(PRJ.steps, pj);
        };
        document.getElementById("import_proj").onclick = GUI_IO.read_project;

        document.getElementById("remove").onclick = PRJ.remove;
        document.getElementById("duplicate").onclick = PRJ.duplicate;


    },

    read: (e) => {
        const button = document.createElement("input");
        button.setAttribute("type", "file");
        button.setAttribute("multiple", true);
        button.setAttribute("accept", ".cp");
        button.dispatchEvent(new MouseEvent("click"));
        button.onchange = (e) => {
            if (e.target.files.length > 0) {
                const l = e.target.files.length;
                const el = e.target;
                if (l > 0) {
                    const file_reader = new FileReader();
                    let i = 0;
                    const fn = () => {
                        file_reader.readAsText(el.files[i]);
                        file_reader.onload = (e) => {
                            let res = undefined;
                            if (PRJ.steps.length == 0) {
                                res = GUI_IO.import_new(el.files[i].name, e.target.result);
                            }
                            else {
                                res = GUI_IO.import(el.files[i].name, e.target.result);
                            }
                            if (res && i < l - 1) {
                                i++;
                                fn();
                            }
                            else {
                                return true;
                            }
                        }
                    }
                    fn();
                }
            }
        }
    },
    import: (path, doc) => {
        if (!doc) {
            return false;
        }
        const [FOLD1, CELL1] = Y.CP_2_FOLD_CELL(doc);
        if (FOLD1 == undefined) {
            alert("unfoldable Crease Pattern: " + path)
            return false;
        }

        const step = { fold_cp: FOLD1, cell_cp: CELL1 };
        PRJ.steps.splice(PRJ.current_idx + 1, 0, step);
        PRJ.restore(PRJ.current_idx);
        [STEP.FOLD1, STEP.CELL1] = [FOLD1, CELL1];
        STEP.new();
        PRJ.record(PRJ.current_idx);
        PRJ.restore(PRJ.current_idx + 1);

        STEP.new();
        PRJ.record(PRJ.current_idx);
        PRJ.restore(PRJ.current_idx);

        return true
    },


    import_new: (path, doc) => {
        if (!doc) {
            return false;
        }

        const [FOLD1, CELL1] = Y.CP_2_FOLD_CELL(doc);
        if (FOLD1 == undefined) {
            alert("unfoldable Crease Pattern: " + path)
            return false;
        }
        const [FOLD0, CELL0] = Y.FOLD_2_PAPER(FOLD1);

        [STEP.FOLD0, STEP.CELL0] = [FOLD0, CELL0];
        [STEP.FOLD1, STEP.CELL1] = [FOLD1, CELL1];
        STEP.new();


        const step0 = { fold_cp: FOLD0, cell_cp: CELL0 };
        const step1 = { fold_cp: FOLD1, cell_cp: CELL1 };
        PRJ.steps.push(step0);
        PRJ.steps.push(step1);
        PRJ.record(0);

        [STEP.FOLD0, STEP.CELL0] = [FOLD1, CELL1];
        [STEP.FOLD1, STEP.CELL1] = [undefined, undefined];
        STEP.new();

        PRJ.record(1);
        PRJ.restore(1);

        return true
    },
    read_project: (e) => {
        const button = document.createElement("input");
        button.setAttribute("type", "file");
        button.setAttribute("accept", ".defox");
        button.click();
        button.onchange = (e) => {
            if (e.target.files.length > 0) {
                const file_reader = new FileReader();
                file_reader.onload = (e) => {
                    const doc = e.target.result;
                    let pj = button.value.split("\\");
                    pj = pj[pj.length - 1];
                    pj = pj.split(".defox");
                    pj = pj[0];
                    document.getElementById("proj_name").value = pj;
                    PRJ.steps = JSON.parse(doc);
                    PRJ.restore(PRJ.steps.length - 1);
                    STEP.redraw();
                    PRJ.redraw_page();
                };
                file_reader.readAsText(e.target.files[0]);
            }
        }

    },


}