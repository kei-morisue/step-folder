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
import { SEG } from "./defox/segment.js";

window.onload = () => { MAIN.startup(); };  // entry point

const MAIN = {
    current_idx: 0,
    blank_cp: undefined,
    Cps: [],
    States: [],
    States_D: [],
    Params: [],
    refresh: () => {
        MAIN.current_idx = 0;
        MAIN.blank_cp = undefined;
        MAIN.Cps = [];
        MAIN.States = [];
        MAIN.States_D = [];
        MAIN.Params = [];
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

        document.getElementById("next").onclick = MAIN.next;
        document.getElementById("prev").onclick = MAIN.prev;
        document.getElementById("import0").onchange = MAIN.read;
        [STEP.FOLD0, STEP.CELL0] = Y.CP_2_FOLD_CELL(SMPL.cp1, true);
        [STEP.FOLD1, STEP.CELL1] = Y.CP_2_FOLD_CELL(SMPL.cp0, true);
        STEP.new();
        MAIN.record(0)


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

        if (MAIN.States.length <= MAIN.current_idx + 1) {
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
                    if (MAIN.Cps.length == 0) {
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
        MAIN.record(MAIN.current_idx);
        [STEP.FOLD0, STEP.CELL0] = [STEP.FOLD1, STEP.CELL1];
        [STEP.FOLD1, STEP.CELL1] = [FOLD1, CELL1];
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
        MAIN.record(0);
        MAIN.restore(0)

        return true
    },
    restore: (i) => {
        if (i > MAIN.Cps.length - 1) {
            return;
        }
        [STEP.FOLD0, STEP.CELL0] = (0 < i) ? MAIN.Cps[i - 1] : MAIN.blank_cp;
        [STEP.FOLD1, STEP.CELL1] = MAIN.Cps[i];

        [STEP.FOLD, STEP.CELL] = MAIN.States[i];
        [STEP.FOLD_D, STEP.CELL_D] = MAIN.States_D[i];
        [STEP.flip0, SEG.clip, DIST.scale, DIST.rotation, DIST.strength] = MAIN.Params[i]


        MAIN.current_idx = i
        document.getElementById("steps").innerHTML = MAIN.States.length;
        document.getElementById("step").innerHTML = i + 1;
    },
    record: (i) => {
        if (i == 0) {
            MAIN.blank_cp = [STEP.FOLD0, STEP.CELL0]
        }
        if (MAIN.Cps.length - 1 < i) {
            MAIN.Cps.push([STEP.FOLD1, STEP.CELL1])
            MAIN.States.push([STEP.FOLD, STEP.CELL])
            MAIN.States_D.push([STEP.FOLD_D, STEP.CELL_D])
            MAIN.Params.push(MAIN.parameters());
        }
        else {
            MAIN.Cps[i] = [STEP.FOLD1, STEP.CELL1];
            MAIN.States[i] = [STEP.FOLD, STEP.CELL];
            MAIN.States_D[i] = [STEP.FOLD_D, STEP.CELL_D];
            MAIN.Params[i] = MAIN.parameters();
        }
    },

    parameters: () => {
        return [
            STEP.flip0,
            SEG.clip,
            DIST.scale,
            DIST.rotation,
            DIST.strength]
    },
};

