import { IO3 } from "./defox/io.js";
import { DIST } from "./distortionfolder/distortion.js";
import { Y } from "./defox/y.js";
import { GUI } from "./defox/gui.js";
import { SMPL } from "./defox/sample.js"
import { STEP } from "./defox/step.js"
import { SEG } from "./defox/segment.js";
import { PAGE } from "./defox/page.js";
import { DRAW } from "./defox/draw.js";

window.onload = () => { MAIN.startup(); };  // entry point

const MAIN = {
    current_idx: 0,
    steps: [],

    refresh: () => {
        MAIN.current_idx = 0;
        MAIN.steps = [];
    },
    startup: () => {
        GUI.startup();

        document.getElementById("new").onclick = (e) => {
            if (confirm("Are you sure to discard current sequence?")) {
                const input = document.createElement('input');
                input.type = 'file';
                input.accept = 'cp/plain';
                input.multiple = true;
                input.onchange = MAIN.read;
                MAIN.refresh();
                input.click();
            }
        };

        document.getElementById("export").onclick = (e) => {
            const ext = document.getElementById("export_ext").value;
            IO3.write("state3", "step_" + MAIN.current_idx, ext);
        };
        document.getElementById("page_export").onclick = (e) => {
            const ext = document.getElementById("page_export_ext").value;
            IO3.write("page", "page_" + PAGE.current_idx, ext);
        };
        document.getElementById("save_proj").onclick = (e) => {
            const pj = document.getElementById("proj_name").value;
            IO3.save(MAIN.steps, pj);
        };
        document.getElementById("import_proj").onclick = MAIN.read_project;
        document.getElementById("next").onclick = MAIN.next;
        document.getElementById("prev").onclick = MAIN.prev;
        document.getElementById("range_steps").oninput = MAIN.jump;


        document.getElementById("import0").onclick = MAIN.read;
        MAIN.import_new("sample", SMPL.hanikamu);
        MAIN.redraw_page();
        document.getElementById("cp_layers").onclick = () => {
            if (document.getElementById("cp3").style.display == "none") {
                document.getElementById("state0").setAttribute("style", "display: none;");
                document.getElementById("cp3").setAttribute("style", "display: default;");
            } else {
                document.getElementById("state0").setAttribute("style", "display: default;");
                document.getElementById("cp3").setAttribute("style", "display: none;");
            }
        };


        document.getElementById("loc_text").onchange = (e) => {
            PAGE.text.location = e.target.value;
            MAIN.redraw_page();
        }
        document.getElementById("page_next").onclick = MAIN.page_next;
        document.getElementById("page_prev").onclick = MAIN.page_prev;

        document.getElementById("page_reload").onclick = (e) => {
            MAIN.record(MAIN.current_idx);
            MAIN.redraw_page();
        }
        for (const [i, id] of ["T0", "T1", "T2", "T3"].entries()) {
            document.getElementById("cb_" + id).onchange = (e) => {
                DIST[id] = e.target.checked;
                STEP.recalculate();
                MAIN.record(MAIN.current_idx);
            }
        }
        document.getElementById("apply_tt").onclick = (e) => {
            STEP.recalculate();
            MAIN.record(MAIN.current_idx);
        }
        MAIN.setup_number_options(
            ["width_crease",
                "width_boundary",
                "width_MMVV"],
            ["F", "B", ["MM", "VV"]],
            [1, 3, 6],
            DRAW.width.edge
        );
        MAIN.setup_number_options(
            ["size_text"],
            ["size"],
            [100],
            PAGE.text
        );
        MAIN.setup_number_options(
            ["dim_r", "dim_c", "dim_b"],
            ["rows", "cols", "blanks"],
            [4, 3, 1],
            PAGE.layout
        );
        MAIN.setup_number_options(
            ["dim_w", "dim_h", "dim_x", "dim_y", "step_x"],
            ["width", "height", "margin_x", "margin_y", "margin_step"],
            [2894, 4093, 50, 80, 20],
            PAGE.dim
        );

    },

    redraw_page: () => {
        PAGE.redraw(document.getElementById("page"), MAIN.steps);
    },

    prev: () => {
        if (MAIN.current_idx == 0) {
            return;
        }
        const i = MAIN.current_idx;
        MAIN.record(i);
        MAIN.restore(i - 1);
        STEP.redraw();
    },
    next: () => {

        if (MAIN.steps.length - 1 < MAIN.current_idx + 1) {
            document.getElementById("import0").click();
        }
        else {
            const i = MAIN.current_idx;
            MAIN.record(i);
            MAIN.restore(i + 1);
            STEP.redraw();
        }

    },
    jump: (e) => {
        const j = e.target.value;
        MAIN.jump_to(j - 1);
    },
    jump_to: (idx) => {
        MAIN.record(MAIN.current_idx);
        MAIN.restore(idx);
        STEP.redraw();
    },


    read: (e) => {
        const button = document.createElement("input");
        button.setAttribute("type", "file");
        button.setAttribute("multiple", true);
        button.setAttribute("accept", ".cp");
        button.click();
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
                            if (MAIN.steps.length == 0) {
                                res = MAIN.import_new(el.files[i].name, e.target.result);
                            }
                            else {
                                res = MAIN.import(el.files[i].name, e.target.result);
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
        MAIN.steps.splice(MAIN.current_idx + 1, 0, step);
        const [f, c] = [STEP.FOLD1, STEP.CELL1];

        [STEP.FOLD1, STEP.CELL1] = [FOLD1, CELL1];
        STEP.new();
        MAIN.record(MAIN.current_idx);

        [STEP.FOLD0, STEP.CELL0] = [FOLD1, CELL1];
        [STEP.FOLD1, STEP.CELL1] = [f, c];
        STEP.new();
        MAIN.record(MAIN.current_idx + 1);
        MAIN.restore(MAIN.current_idx + 1);

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
        MAIN.steps.push(step0);
        MAIN.steps.push(step1);
        MAIN.record(0);

        [STEP.FOLD0, STEP.CELL0] = [FOLD1, CELL1];
        [STEP.FOLD1, STEP.CELL1] = [undefined, undefined];
        STEP.new();

        MAIN.record(1);
        MAIN.restore(1);

        return true
    },
    restore: (i) => {
        if (i > MAIN.steps.length - 1) {
            return;
        }
        STEP.FOLD0 = MAIN.steps[i].fold_cp;
        STEP.CELL0 = MAIN.steps[i].cell_cp;
        STEP.STATE0 = MAIN.steps[i].state_cp;

        if (i < MAIN.steps.length - 1) {
            STEP.FOLD1 = MAIN.steps[i + 1].fold_cp;
            STEP.CELL1 = MAIN.steps[i + 1].cell_cp;
        } else {
            STEP.FOLD1 = undefined;
            STEP.CELL1 = undefined;
        }
        STEP.id = i;
        STEP.FOLD = MAIN.steps[i].fold;

        STEP.FOLD_D = MAIN.steps[i].fold_d;
        STEP.CELL_D = MAIN.steps[i].cell_d;
        STEP.LIN = MAIN.steps[i].lin;

        [STEP.flip0, STEP.rotate, STEP.scale, SEG.clip, DIST.p0, DIST.p1, DIST.p2, STEP.cx, STEP.cy] = MAIN.steps[i].params;
        document.getElementById("clip").value = SEG.clip;
        document.getElementById("rotate").value = STEP.rotate;
        document.getElementById("p0").value = DIST.p0;
        document.getElementById("p1").value = DIST.p1;
        document.getElementById("p2").value = DIST.p2;

        MAIN.current_idx = i
        document.getElementById("steps").innerHTML = MAIN.steps.length;
        document.getElementById("step").innerHTML = i + 1;
        document.getElementById("range_steps").max = MAIN.steps.length;
        document.getElementById("range_steps").value = i + 1;

    },
    record: (i) => {
        if (MAIN.steps.length - 1 < i) {
            return;
        }
        MAIN.steps[i].state_cp = STEP.STATE0;
        MAIN.steps[i].fold = STEP.FOLD;
        MAIN.steps[i].fold_d = STEP.FOLD_D;
        MAIN.steps[i].cell_d = STEP.CELL_D;
        MAIN.steps[i].lin = STEP.LIN;
        MAIN.steps[i].params = MAIN.parameters();
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
        MAIN.redraw_page();
    },
    page_next: () => {

        if (PAGE.get_pages(MAIN.steps) - 1 < PAGE.current_idx + 1) {
            return;
        }
        PAGE.current_idx = PAGE.current_idx + 1;
        MAIN.redraw_page();
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
                MAIN.redraw_page();
            }
            document.getElementById(id + "_reset").onclick = (e) => {
                if (Array.isArray(props)) {
                    props.map(p => module[p] = init[i])
                } else {
                    module[props] = init[i]
                }
                document.getElementById(id).value = init[i]
                STEP.redraw();
                MAIN.redraw_page();
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
                    MAIN.steps = JSON.parse(doc);
                    MAIN.restore(MAIN.steps.length - 1);
                    STEP.redraw();
                    MAIN.redraw_page();
                };
                file_reader.readAsText(e.target.files[0]);
            }
        }

    },
};

