import { M } from "./flatfolder/math.js";
import { NOTE } from "./flatfolder/note.js";
import { SVG } from "./flatfolder/svg.js";
import { IO } from "./flatfolder/io.js";
import { X } from "./flatfolder/conversion.js";
import { SOLVER } from "./flatfolder/solver.js";
import { CON } from "./flatfolder/constraints.js";

import { DIST } from "./distortionfolder/distortion.js";


import { Y } from "./defox/y.js";
import { GUI } from "./defox/gui.js";
import { DRAW } from "./defox/draw.js";
import { DIFF } from "./defox/diff.js";
import { SMPL } from "./defox/sample.js"
import { STEP } from "./defox/step.js"

window.onload = () => { MAIN.startup(); };  // entry point

const MAIN = {
    current_idx: 0,
    lastcp: undefined,
    Cps: [],
    States: [],
    Params: [],

    startup: () => {
        GUI.startup();

        document.getElementById("new").onclick = (e) => {
            if (confirm("Are you sure to discard current sequence?")) {
                const input = document.createElement('input');
                input.type = 'file';
                input.accept = 'cp/plain';
                input.onchange = MAIN.new;
                input.click();
            }
        };

        document.getElementById("next").onclick = MAIN.next;
        document.getElementById("prev").onclick = MAIN.prev;
        document.getElementById("import0").onclick = MAIN.read;
        [STEP.FOLD0, STEP.CELL0] = Y.CP_2_FOLD_CELL(SMPL.cp1, true);
        [STEP.FOLD1, STEP.CELL1] = Y.CP_2_FOLD_CELL(SMPL.cp0, true);



        STEP.FOLD_D = STEP.FOLD0;
        STEP.CELL_D = STEP.CELL0;

        STEP.update_states();
        const select = document.getElementById("selectG");
        const assign = document.getElementById("assign");
        STEP.update_component(STEP.FOLD0, STEP.CELL0, select, assign);
        STEP.update_dist()

        MAIN.record(0)
    },

    prev: () => {
        if (MAIN.current_idx == 0) {
            return;
        }
        const i = MAIN.current_idx;
        MAIN.record(i);
        MAIN.restore(i - 1);
        MAIN.current_idx--;
    },
    next: () => {

        if (MAIN.States.length <= MAIN.current_idx + 1) {
            document.getElementById("import0").click();
        }
        else {
            const i = MAIN.current_idx;
            MAIN.record(i);
            MAIN.restore(i + 1);
            MAIN.current_idx++;
        }

    },

    read: (e) => {
        if (e.target.files.length > 0) {
            const el = e.target;
            const file_reader = new FileReader();
            file_reader.onload = (e1) => {
                const doc = e1.target.result;
                const path = el.value;
                MAIN.import(path, doc);
            };
            file_reader.readAsText(e.target.files[0]);
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

        MAIN.Cps.push(MAIN.lastcp);
        MAIN.lastcp = [FOLD1, CELL1]
        MAIN.States.push([STEP.FOLD, STEP.CELL]);
        MAIN.Params.push([STEP.flip0, DIST.scale, DIST.rotation, DIST.strength]);

        const i = MAIN.Cps.length - 1;
        MAIN.current_idx = i;

        MAIN.restore(i)
        return true
    },


    new: (e) => {
        if (e.target.files.length > 0) {
            const el = e.target
            const file_reader = new FileReader();
            file_reader.onload = (e1) => {
                const doc = e1.target.result;
                const path = el.value;
                MAIN.import_new(path, doc);
            };
            file_reader.readAsText(e.target.files[0]);
        }
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

        MAIN.Cps = [[FOLD0, CELL0]];
        MAIN.States = [DIFF.diff(FOLD0, CELL0, FOLD1, CELL1)];
        MAIN.Flips = [false];
        MAIN.Params = [[1, 0, 1]];
        MAIN.record(1)
        MAIN.restore(0)
        return true
    },
    restore: (i) => {
        if (i > MAIN.Cps.length - 1) {
            return;
        }
        [STEP.FOLD0, STEP.CELL0] = MAIN.Cps[i];
        [STEP.FOLD1, STEP.CELL1] = (MAIN.Cps.length - 1 > i) ? MAIN.Cps[i + 1] : MAIN.lastcp;

        [STEP.FOLD, STEP.CELL] = MAIN.States[i];
        [STEP.flip0, DIST.scale, DIST.rotation, DIST.strength] = MAIN.Params[i]

        STEP.update_states();
        const select = document.getElementById("selectG");
        const assign = document.getElementById("assign");
        STEP.update_component(STEP.FOLD0, STEP.CELL0, select, assign);
        STEP.update_dist()
        document.getElementById("steps").innerHTML = MAIN.States.length;
        document.getElementById("step").innerHTML = i + 1;
    },
    record: (i) => {
        if (MAIN.Cps.length - 1 < i) {
            MAIN.Cps.push(undefined)
            MAIN.States.push(undefined)
            MAIN.Params.push(undefined)
            MAIN.lastcp = [STEP.FOLD1, STEP.CELL1]
        }
        MAIN.Cps[i] = [STEP.FOLD0, STEP.CELL0];
        MAIN.States[i] = [STEP.FOLD, STEP.CELL];
        MAIN.Params[i] = [STEP.flip0, DIST.scale, DIST.rotation, DIST.strength];
    },
};

