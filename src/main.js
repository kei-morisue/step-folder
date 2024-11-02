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

window.onload = () => { MAIN.startup(); };  // entry point

export const MAIN = {


    startup: () => {
        CON.build();
        NOTE.clear_log();
        NOTE.start("*** Starting Flat-Folder ***");
        NOTE.time("Initializing interface");

        GUI.set_svg("states")
        GUI.set_svg("cps")

        document.getElementById("import0").onchange = MAIN.process_doc;

        GUI.setup_number_options(
            ["width_crease", "width_boundary", "width_MMVV"],
            ["F", "B", ["MM", "VV"]],
            [1, 3, 3],
            DRAW.width.edge
        )


        for (const [i, id] of ["T0", "T1", "T2", "T3"].entries()) {
            document.getElementById("cb_" + id).onchange = (e) => {
                DIST[id] = e.target.checked
                MAIN.update_states()
                MAIN.update_dist()
            }
        }
        document.getElementById("topcolor").onchange = (e) => {
            DRAW.color.face.top = e.target.value
            MAIN.update_states()
        }

        document.getElementById("bottomcolor").onchange = (e) => {
            DRAW.color.face.bottom = e.target.value
            MAIN.update_states()
        }

        document.getElementById("assign").onchange = (e) => {
            const { GB, BF, GA, GI } = MAIN.CELL0
            const { Ff } = MAIN.FOLD0

            const a = e.target.value - 1;
            const g = document.getElementById("selectG").value

            MAIN.CELL0.GI[g] = a
            MAIN.FOLD0.FO = Y.BF_GB_GA_GI_Ff_2_FO(BF, GB, GA, GI, Ff)
            MAIN.update_states()
            MAIN.update_dist();
        }

        document.getElementById("selectG").onchange = (e) => {
            const { GA, GI } = MAIN.CELL0
            const g = e.target.value
            document.getElementById("assign").max = GA[g].length
            document.getElementById("assign").value = GI[g] + 1
        }


        GUI.setup_range_options(
            ["k0", "t0", "s0"],
            ["scale", "rotation", "strength"],
            [(v) => { return 1 + (v - 0.5) }, (v) => { return (v - 0.5) * Math.PI }, (v) => { return 1.01 ** (2 - 1 / v) }],
            [0.5, 0.5, 0.5],
            DIST
        );



        [MAIN.FOLD0, MAIN.CELL0] = Y.CP_2_FOLD_CELL(SMPL.cp1, true);
        [MAIN.FOLD1, MAIN.CELL1] = Y.CP_2_FOLD_CELL(SMPL.cp0, true);



        MAIN.update_state(MAIN.FOLD1, MAIN.CELL1, "state1", "cp1");
        MAIN.FOLD_D = MAIN.FOLD0;
        MAIN.CELL_D = MAIN.CELL0;

        MAIN.update_states();
        const select = document.getElementById("selectG");
        const assign = document.getElementById("assign");
        MAIN.update_component(MAIN.FOLD0, MAIN.CELL0, select, assign);
        MAIN.update_dist()
    },
    update_dist: () => {
        const { Vf, FV, EV, EF, FE, Ff, EA, V } = MAIN.FOLD
        const VD = DIST.FOLD_2_VD(V, Vf)
        MAIN.FOLD_D = { V: VD, Vf, FV, EV, EF, FE, Ff, EA }
        MAIN.CELL_D = Y.FOLD_2_CELL(MAIN.FOLD_D)
        const FO_D = DIST.infer_FO(MAIN.FOLD, MAIN.CELL_D)
        MAIN.FOLD_D.FO = FO_D
        MAIN.update_state(MAIN.FOLD_D, MAIN.CELL_D, "state3", "cp3");
    },
    update_component: (FOLD, CELL, el_select, el_assign) => {
        const { GB, GA } = CELL
        SVG.clear(el_select)
        el_assign.max = GA[0].length
        el_assign.value = 1;
        GB.map((_, i) => {
            const el = document.createElement("option");
            el.setAttribute("value", `${i}`);
            el.textContent = `${i}`;
            el_select.appendChild(el);
        })
    },


    update_states: () => {
        MAIN.update_state(MAIN.FOLD0, MAIN.CELL0, "state0", "cp0");
        DRAW.draw_group_text(MAIN.FOLD0, MAIN.CELL0, document.getElementById("state0"));
        [MAIN.FOLD, MAIN.CELL] = DIFF.diff(MAIN.FOLD0, MAIN.CELL0, MAIN.FOLD1, MAIN.CELL1);
        // MAIN.update_state(MAIN.FOLD, MAIN.CELL, "state2", "cp2");

        MAIN.update_state(MAIN.FOLD_D, MAIN.CELL_D, "state3", "cp3");

    },

    update_state: (FOLD, CELL, svg_state, svg_cp) => {
        const flip = false

        const STATE = Y.FOLD_CELL_2_STATE(FOLD, CELL, flip);

        DRAW.draw_state(SVG.clear(svg_state), FOLD, CELL, STATE, flip);
        DRAW.draw_cp(FOLD, SVG.clear(svg_cp));



    },
};
