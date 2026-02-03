import { DIST } from "../distortionfolder/distortion.js";
import { Y } from "./y.js";

import { STEP } from "./step.js"
import { SEG } from "./segment.js";
import { PAGE } from "./page.js";


export const PRJ = {
    current_idx: 0,
    steps: [],

    refresh: () => {
        PRJ.current_idx = 0;
        PRJ.steps = [];
    },

    redraw_page: () => {
        PAGE.redraw(document.getElementById("page"), PRJ.steps);
    },

    prev: () => {
        if (PRJ.current_idx == 0) {
            return;
        }
        const i = PRJ.current_idx;
        PRJ.record(i);
        PRJ.restore(i - 1);
        STEP.redraw();
    },
    next: () => {
        if (PRJ.steps.length - 1 < PRJ.current_idx + 1) {
            return;
        }
        else {
            const i = PRJ.current_idx;
            PRJ.record(i);
            PRJ.restore(i + 1);
            STEP.redraw();
        }
    },
    jump: (e) => {
        const j = e.target.value;
        PRJ.jump_to(j - 1);
    },
    jump_to: (idx) => {
        PRJ.record(PRJ.current_idx);
        PRJ.restore(idx);
        STEP.redraw();
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
                                res = PRJ.import_new(el.files[i].name, e.target.result);
                            }
                            else {
                                res = PRJ.import(el.files[i].name, e.target.result);
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

    remove: () => {
        const i = PRJ.current_idx;
        if (PRJ.steps.length == 2 || i == 0) {
            return;
        }
        if (confirm("Are you sure to remove current step " + (i + 1) + "? ")) {
            PRJ.steps.splice(i, 1);
            if (PRJ.steps[i - 1]) {
                PRJ.restore(i - 1);
                STEP.update_states();
                STEP.update_dist();
                PRJ.record(i - 1);
            }
            PRJ.restore(i);
            STEP.update_states();
            STEP.update_dist();
            PRJ.record(i);

            document.getElementById("steps").innerHTML--;
            document.getElementById("range_steps").max--;
            STEP.redraw();
            PRJ.redraw_page();
        }
    },
    duplicate: () => {

    },
    restore: (i) => {
        if (i > PRJ.steps.length - 1) {
            return;
        }
        STEP.FOLD0 = PRJ.steps[i].fold_cp;
        STEP.CELL0 = PRJ.steps[i].cell_cp;
        STEP.STATE0 = PRJ.steps[i].state_cp;

        if (i < PRJ.steps.length - 1) {
            STEP.FOLD1 = PRJ.steps[i + 1].fold_cp;
            STEP.CELL1 = PRJ.steps[i + 1].cell_cp;
        } else {
            STEP.FOLD1 = undefined;
            STEP.CELL1 = undefined;
        }
        STEP.id = i;
        STEP.FOLD = PRJ.steps[i].fold;

        STEP.FOLD_D = PRJ.steps[i].fold_d;
        STEP.CELL_D = PRJ.steps[i].cell_d;
        STEP.LIN = PRJ.steps[i].lin;

        const p = PRJ.steps[i].params;
        if (p) {
            [STEP.flip0, STEP.rotate, STEP.scale, SEG.clip, DIST.p0, DIST.p1, DIST.p2, STEP.cx, STEP.cy] = p;
            document.getElementById("clip").value = SEG.clip;
            document.getElementById("rotate").value = STEP.rotate;
            document.getElementById("p0").value = DIST.p0;
            document.getElementById("p1").value = DIST.p1;
            document.getElementById("p2").value = DIST.p2;
        } else {
            STEP.refresh();
        }

        PRJ.current_idx = i
        document.getElementById("steps").innerHTML = PRJ.steps.length;
        document.getElementById("step").innerHTML = i + 1;
        document.getElementById("range_steps").max = PRJ.steps.length;
        document.getElementById("range_steps").value = i + 1;

    },
    record: (i) => {
        if (PRJ.steps.length - 1 < i) {
            return;
        }
        PRJ.steps[i].fold_cp = STEP.FOLD0;
        PRJ.steps[i].cell_cp = STEP.CELL0;
        PRJ.steps[i].state_cp = STEP.STATE0;
        PRJ.steps[i].fold = STEP.FOLD;
        PRJ.steps[i].fold_d = STEP.FOLD_D;
        PRJ.steps[i].cell_d = STEP.CELL_D;
        PRJ.steps[i].lin = STEP.LIN;
        PRJ.steps[i].params = PRJ.parameters();
    },

    parameters: () => {
        return [
            STEP.flip0,
            STEP.rotate,
            STEP.scale,
            SEG.clip,
            DIST.p0,
            DIST.p1,
            DIST.p2,
            STEP.cx,
            STEP.cy,]
    },

    page_prev: () => {
        if (PAGE.current_idx == 0) {
            return;
        }
        PAGE.current_idx = PAGE.current_idx - 1;
        PRJ.redraw_page();
    },
    page_next: () => {

        if (PAGE.get_pages(PRJ.steps) - 1 < PAGE.current_idx + 1) {
            return;
        }
        PAGE.current_idx = PAGE.current_idx + 1;
        PRJ.redraw_page();
    },



    setup_number_options: (ids, edge_props, init, module) => {
        for (const [i, id] of ids.entries()) {
            const props = edge_props[i]
            document.getElementById(id).onchange = (e) => {
                if (Array.isArray(props)) {
                    props.map(p => module[p] = e.target.value)
                } else {
                    module[props] = parseInt(e.target.value);
                }
                STEP.redraw();
                PRJ.redraw_page();
            }
            document.getElementById(id + "_reset").onclick = (e) => {
                if (Array.isArray(props)) {
                    props.map(p => module[p] = init[i])
                } else {
                    module[props] = init[i]
                }
                document.getElementById(id).value = init[i]
                STEP.redraw();
                PRJ.redraw_page();
            }
        }
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