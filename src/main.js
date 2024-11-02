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
    Gs: [],
    Ss: [],
    Ps: [],
    Fs: [],

    startup: () => {
        GUI.startup();
        document.getElementById("next").onclick = MAIN.next;
        document.getElementById("import0").onchange = (e) => {
            if (e.target.files.length > 0) {
                const file_reader = new FileReader();
                file_reader.onload = (e) => {
                    const doc = e.target.result;
                    const path = e.target.value;
                    MAIN.import(path, doc);
                };
                file_reader.readAsText(e.target.files[0]);
            }
        };

        [STEP.FOLD0, STEP.CELL0] = Y.CP_2_FOLD_CELL(SMPL.cp1, true);
        [STEP.FOLD1, STEP.CELL1] = Y.CP_2_FOLD_CELL(SMPL.cp0, true);



        STEP.FOLD_D = STEP.FOLD0;
        STEP.CELL_D = STEP.CELL0;

        STEP.update_states();
        const select = document.getElementById("selectG");
        const assign = document.getElementById("assign");
        STEP.update_component(STEP.FOLD0, STEP.CELL0, select, assign);
        STEP.update_dist()

        const is_flip = STEP.flip0;
        MAIN.record(0, is_flip)
    },

    next: () => {
        const is_flip0 = STEP.flip0

        if (MAIN.Gs.length < MAIN.current_idx + 2) {
            document.getElementById("import0").click();
        }
        else {
            const i = MAIN.current_idx;
            MAIN.record(i, is_flip0);

            [STEP.FOLD0, STEP.CELL0] = MAIN.Gs[i];
            [STEP.FOLD1, STEP.CELL1] = MAIN.Gs[i + 1];
            [STEP.FOLD, STEP.CELL] = MAIN.Ss[i + 1];
            [DIST.scale, DIST.rotation, DIST.strength] = MAIN.Ps[i + 1];
            current_idx++;
            document.getElementById("steps").innerHTML = MAIN.Gs.length;
            document.getElementById("step").innerHTML = MAIN.current_idx + 1;
        }

    },

    import: (path, doc) => {
        if (!doc) {
            return
        }
        MAIN.Gs.push([STEP.FOLD1, STEP.CELL1]);
        MAIN.Ss.push([STEP.FOLD, STEP.CELL]);
        MAIN.Fs.push(true);
        MAIN.Ps.push([DIST.scale, DIST.rotation, DIST.strength]);


        const i = MAIN.Gs.length - 1;
        MAIN.current_idx = i;
        [STEP.FOLD0, STEP.CELL0] = MAIN.Gs[i];
        [STEP.FOLD1, STEP.CELL1] = Y.CP_2_FOLD_CELL(doc, true);
        STEP.update_states();
        const select = document.getElementById("selectG");
        const assign = document.getElementById("assign");
        STEP.update_component(STEP.FOLD0, STEP.CELL0, select, assign);
        STEP.update_dist()
        document.getElementById("steps").innerHTML = MAIN.Gs.length;
        document.getElementById("step").innerHTML = MAIN.current_idx + 1;
    },

    record: (i, is_flip0) => {
        MAIN.Gs[i] = [STEP.FOLD0, STEP.CELL0];
        MAIN.Ss[i] = [STEP.FOLD, STEP.CELL];
        MAIN.Fs[i] = is_flip0;
        MAIN.Ps[i] = [DIST.scale, DIST.rotation, DIST.strength];
    },
};

