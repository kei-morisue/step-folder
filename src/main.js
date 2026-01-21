import { IO3 } from "./defox/io.js";
import { DIST } from "./distortionfolder/distortion.js";
import { Y } from "./defox/y.js";
import { GUI } from "./defox/gui.js";
import { SMPL } from "./defox/sample.js"
import { STEP } from "./defox/step.js"
import { SEG } from "./defox/segment.js";

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
            IO3.write(MAIN.steps[MAIN.current_idx].state_d, "state3", "hoge")
        };

        document.getElementById("next").onclick = MAIN.next;
        document.getElementById("prev").onclick = MAIN.prev;
        document.getElementById("import0").onchange = MAIN.read;
        MAIN.import_new("sample", SMPL.owo);



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


    read: (e) => {
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
    },
    import: (path, doc) => {
        if (!doc) {
            return false;
        }
        const [FOLD1, CELL1] = Y.CP_2_FOLD_CELL(doc, true);
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

        const [FOLD1, CELL1] = Y.CP_2_FOLD_CELL(doc, true);
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
        [STEP.FOLD1, STEP.CELL1] = [FOLD1, CELL1];
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

        if (i < MAIN.steps.length - 1) {
            STEP.FOLD1 = MAIN.steps[i + 1].fold_cp;
            STEP.CELL1 = MAIN.steps[i + 1].cell_cp;
        } else {
            STEP.FOLD1 = MAIN.steps[i].fold_cp;
            STEP.CELL1 = MAIN.steps[i].cell_cp;
        }
        STEP.id = i;
        STEP.FOLD = MAIN.steps[i].fold;
        STEP.CELL = MAIN.steps[i].cell;

        STEP.FOLD_D = MAIN.steps[i].fold_d;
        STEP.CELL_D = MAIN.steps[i].cell_d;
        STEP.LIN = MAIN.steps[i].lin;

        [STEP.flip0, STEP.rotate, STEP.scale, SEG.clip, DIST.p0, DIST.p1, DIST.p2, DIST.direction_skew, DIST.strength] = MAIN.steps[i].params;
        document.getElementById("clip").value = SEG.clip;
        document.getElementById("rotate").value = STEP.rotate;
        document.getElementById("p0").value = DIST.p0;
        document.getElementById("p1").value = DIST.p1;
        document.getElementById("p2").value = DIST.p2;

        MAIN.current_idx = i
        document.getElementById("steps").innerHTML = MAIN.steps.length;
        document.getElementById("step").innerHTML = i + 1;
    },
    record: (i) => {
        if (MAIN.steps.length - 1 < i) {
            return;
        }
        MAIN.steps[i].fold = STEP.FOLD;
        MAIN.steps[i].cell = STEP.CELL;
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
            DIST.p2]
    },
};

