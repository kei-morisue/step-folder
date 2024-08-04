import { M } from "./flatfolder/math.js";
import { NOTE } from "./flatfolder/note.js";
import { SVG } from "./flatfolder/svg.js";
import { IO } from "./flatfolder/io.js";
import { X } from "./flatfolder/conversion.js";
import { SOLVER } from "./flatfolder/solver.js";
import { CON } from "./flatfolder/constraints.js";
import { GUI } from "./defox/gui.js";

window.onload = () => { MAIN.startup(); };  // entry point

const MAIN = {
    color: {
        background: "lightgray",
        normal: "black",
        active: "red",
        select: "blue",
        face: {
            top: "#555",
            bottom: "#FFF",
        },
        edge: {
            U: "black",
            F: "lightgray",
            B: "black",
        },
        rand: [
            "lightpink", "lightgreen", "lightskyblue", "gold",
            "lightsalmon", "powderblue", "lavender", "sandybrown"
        ],
    },
    opacity: {
        normal: 0.01,
        hover: 1,
    },
    radius: {
        normal: 10,
        hover: 20,
    },
    startup: () => {
        CON.build();
        NOTE.clear_log();
        NOTE.start("*** Starting Flat-Folder ***");
        NOTE.time("Initializing interface");
        const [b, s] = [50, SVG.SCALE];
        const main = document.getElementById("main");

        for (const [i, ch] of [].entries.call(main.children)) {
            const id = ch.id
            const svg = document.getElementById(id);
            for (const [k, v] of Object.entries({
                xmlns: SVG.NS,
                height: s,
                width: s,

                viewBox: [-b, -b, s + 2 * b, s + 2 * b].join(" "),
            })) {
                svg.setAttribute(k, v);
            }
        }
        const type_select = document.getElementById("type_select");
        for (const option of ["pure", "all"]) {
            const el = document.createElement("option");
            el.setAttribute("value", option);
            el.textContent = option;
            type_select.appendChild(el);
        }
        document.getElementById("import").onchange = (e) => {
            if (e.target.files.length > 0) {
                const file_reader = new FileReader();
                file_reader.onload = MAIN.process_file;
                file_reader.readAsText(e.target.files[0]);
            }
        };
        const V = [[0, 0], [0, 1], [1, 0], [1, 1]];
        const FV = [[0, 2, 3, 1]];
        const [FOLD, CELL] = MAIN.V_FV_2_FOLD_CELL(V, FV);
        FOLD.FO = [];
        MAIN.update_fold(FOLD, CELL, [[FOLD, CELL]]);
    },
    process_file: (e) => {
        NOTE.clear_log();
        NOTE.start("*** Starting File Import ***");
        const doc = e.target.result;
        const file_name = document.getElementById("import").value;
        const parts = file_name.split(".");
        const type = parts[parts.length - 1].toLowerCase();
        if (type != "fold") {
            console.log(`Found file with extension ${type}, FOLD format required`);
            return;
        }
        NOTE.time(`Importing from file ${file_name}`);
        const FS = MAIN.FOLD_2_FS(doc);
        const [FOLD, CELL] = FS[FS.length - 1];
        MAIN.update_fold(FOLD, CELL, FS);
    },
    update_fold: (FOLD, CELL, FS) => {

        document.getElementById("back_button").onclick = () => {
            GUI.back(FS);
        };
        GUI.refresh();
        SVG.clear("output");
        NOTE.time("Computing folded state");
        const STATE = MAIN.FOLD_CELL_2_STATE(FOLD, CELL);
        NOTE.time("Drawing CP");
        MAIN.update_cp(FOLD, STATE);
        NOTE.time("Writing output");
        MAIN.write(FS);
        NOTE.time("Drawing State");
        MAIN.draw_state(SVG.clear("input"), FOLD, CELL, STATE, FS);

        const flip_el = document.getElementById("flip");
        flip_el.onchange = () => {
            GUI.flip(FS, STATE);
        };
        NOTE.end();


        for (var i = 0; i < 6; i++) {
            const j = FS.length - i - 1
            const h = document.getElementById("h" + i)
            const p = document.getElementById("ph" + i)
            SVG.clear("h" + i)
            h.setAttribute("xmlns", SVG.NS)
            h.setAttribute("height", SVG.SCALE)
            h.setAttribute("width", SVG.SCALE)
            h.setAttribute("viewBox", [-50, -50, SVG.SCALE + 100, SVG.SCALE + 100].join(" "))
            if (j >= 0) {
                p.innerHTML = j + 1
                const [F, C] = FS[j]
                const S = MAIN.FOLD_CELL_2_STATE(F, C);
                MAIN.draw_state(h, F, C, S, FS)
            }
        }


    },
    update_cp: (FOLD, STATE, LINE) => {
        const { V, FV, EV, EF, Ff, FO, FOO, FM } = FOLD;
        const { edges } = STATE;
        const edge_map = new Set(edges);
        const EA = EF.map(F => {
            if (F.length != 2) { return "B"; }
            const [i, j] = F;
            if (edge_map.has(M.encode([i, j]))) { return Ff[i] ? "M" : "V"; }
            if (edge_map.has(M.encode([j, i]))) { return Ff[i] ? "V" : "M"; }
            return "F";
        });
        FOLD.Vf = X.V_FV_EV_EA_2_Vf_Ff(V, FV, EV, EA)[0];
        if (M.polygon_area2(M.expand(FOLD.FV[0], FOLD.Vf)) < 0) {
            FOLD.Vf = FOLD.Vf.map(v => M.add(M.refY(v), [0, 1]));
        }
        const v0 = FOLD.Vf[0];
        FOLD.Vf = FOLD.Vf.map(p => M.sub(p, v0));
        const [c1, s1] = FOLD.Vf[1];
        FOLD.Vf = FOLD.Vf.map(p => M.rotate_cos_sin(p, c1, -s1));
        FOLD.Vf = FOLD.Vf.map(p => M.rotate_cos_sin(p, 0, 1));
        FOLD.Vf = M.normalize_points(FOLD.Vf);
        const Vf = FOLD.Vf;
        const cp = SVG.clear("cp");
        const faces = FV.map(F => M.expand(F, Vf));
        const lines = EV.map(E => M.expand(E, Vf));
        const colors = EA.map(a => {
            if (a == "B") { return "black"; }
            if (a == "M") { return "blue"; }
            if (a == "V") { return "red"; }
            if (a == "F") { return "gray"; }
        });
        const g1 = SVG.append("g", cp, { id: "flat_f" });
        SVG.draw_polygons(g1, faces, { fill: "white", id: true });
        const g2 = SVG.append("g", cp, { id: "flat_e" });
        SVG.draw_segments(g2, lines, { stroke: colors, id: true });
        if (FM != undefined) {
            const H = new Map();
            for (const [i, j, o] of FO) {
                H.set(M.encode([i, j]), o);
                H.set(M.encode([j, i]), (Ff[i] == Ff[j]) ? -o : o);
            }
            const changed = new Set();
            for (const [i, j, o] of FOO) {
                if (H.get(M.encode([i, j])) != o) {
                    changed.add(M.encode_order_pair([i, j]));
                }
            }
            const FF = FV.map(() => []);
            for (const F of EF) {
                if (F.length != 2) { continue; }
                const [f, g] = F;
                if (!FM[f] || !FM[g]) { continue; }
                FF[f].push(g);
                FF[g].push(f);
            }
            const FL = FV.map(() => undefined);
            let ci = 0;
            for (let i = 0; i < FL.length; ++i) {
                if (!FM[i]) { continue; }
                if (FL[i] != undefined) { continue; }
                FL[i] = ci;
                const Q = [i];
                let j = 0;
                while (j < Q.length) {
                    const f = Q[j]; ++j;
                    const v = FL[f];
                    for (const g of FF[f]) {
                        if (
                            (FL[g] == undefined) &&
                            !changed.has(M.encode_order_pair([f, g]))
                        ) {
                            Q.push(g);
                            FL[g] = ci;
                        }
                    }
                }
                ++ci;
            }
            for (let i = 0; i < FL.length; ++i) {
                if (FL[i] == undefined) { continue; }
                const el = document.getElementById(`flat_f${i}`);
                el.setAttribute("fill", MAIN.color.rand[
                    FL[i] % MAIN.color.rand.length
                ]);
            }
            FOLD.FL = FL.map(l => l ?? -1);
        }
        if (LINE == undefined) { return; }
        const clicked = LINE.clicked_groups;
        const FG = LINE.FG;
        for (let i = 0; i < FG.length; ++i) {
            const el = document.getElementById(`flat_f${i}`);
            el.setAttribute("fill", clicked.has(FG[i]) ? "yellow" : "white");
        }
    },
    point_over: (el) => {
        el.setAttribute("fill", MAIN.color.select);
        el.setAttribute("r", MAIN.radius.hover);
        el.setAttribute("opacity", MAIN.opacity.hover);
    },
    point_out: (i, el, clicked) => {
        const unclicked = (clicked.get(i) == undefined);
        el.setAttribute("r", MAIN.radius.normal);
        el.setAttribute("opacity", unclicked
            ? MAIN.opacity.normal
            : MAIN.opacity.hover
        );
        el.setAttribute("fill", unclicked
            ? MAIN.color.normal
            : MAIN.color.active
        );
    },
    point_click: (i, el, clicked, Q, FOLD, CELL, FS) => {
        const { P } = CELL;
        NOTE.time(`Clicked point ${i}`);
        if (clicked.has(i) || (clicked.size >= 4)) {
            SVG.clear("lines");
            MAIN.clear_clicked(clicked);
            MAIN.point_over(el);
            return;
        }
        const svg = SVG.clear("lines");
        clicked.set(i, el);
        NOTE.time(`Clicked set is: [${Array.from(clicked.keys())}]`);
        el.setAttribute("fill", MAIN.color.select);
        const L = MAIN.get_lines(Array.from(clicked.keys()).map(i => Q[i]));
        if (L.length > 0) {
            SVG.draw_segments(svg, L.map(l => MAIN.line_2_coords(l)), {
                id: true, stroke: MAIN.color.normal,
                stroke_width: MAIN.radius.normal,
            });
            for (let j = 0; j < svg.children.length; ++j) {
                const el = svg.children[j];
                el.onclick = () => MAIN.line_click(el, clicked, L[j], FS);
                el.onmouseover = () => MAIN.line_over(el);
                el.onmouseout = () => MAIN.line_out(el);
            }
        } else if (clicked.size > 1) {
            MAIN.clear_clicked(clicked);
            MAIN.point_over(el);
        }
    },
    clear_clicked: (clicked) => {
        for (const [i, el] of clicked) {
            el.setAttribute("fill", MAIN.color.normal);
            el.setAttribute("opacity", MAIN.opacity.normal);
        }
        clicked.clear();
    },
    line_over: (el) => {
        el.setAttribute("stroke", MAIN.color.select);
        el.setAttribute("stroke-width", MAIN.radius.hover);
    },
    line_out: (el) => {
        el.setAttribute("stroke", MAIN.color.normal);
        el.setAttribute("stroke-width", MAIN.radius.normal);
    },
    line_click: (line, clicked, line_val, FS) => {
        const [FOLD_, CELL_] = FS[FS.length - 1];
        const V_ = FOLD_.V;
        const Vf_ = FOLD_.Vf;
        const FV_ = FOLD_.FV;
        const FO_ = FOLD_.FO;
        const eps_ = FOLD_.eps;
        const flip = document.getElementById("flip").checked;
        if (flip) {
            const [u, d] = line_val;
            const o = [0.5, 0.5];
            const p = M.add(M.refX(M.sub(M.mul(u, d), o)), o);
            const v = M.refX(u);
            const d2 = M.dot(p, v);
            line_val = [v, d2];
        }
        const [FV2, V, Vf, VD] = MAIN.FV_V_Vf_line_eps_2_FV2_V2_Vf2_VD2(
            FV_, V_, Vf_, line_val, eps_);
        const FV = [];
        const F_map = FV2.map(() => []);
        for (let fi = 0; fi < FV2.length; ++fi) {
            for (const f of FV2[fi]) {
                if (f.length > 0) {
                    F_map[fi].push(FV.length);
                    FV.push(f);
                }
            }
        }
        const FG = MAIN.FV_VD_2_FG(FV, VD);
        const [FOLD, CELL] = MAIN.V_FV_2_FOLD_CELL(V, FV);
        FOLD.Vf = Vf;
        const { BF, BI, CF } = CELL;
        const FO = [];
        for (const [f, g, o] of FO_) {
            for (const f_ of F_map[f]) {
                for (const g_ of F_map[g]) {
                    const pair = M.encode_order_pair([f_, g_]);
                    if (BI.has(pair)) {
                        FO.push([f_, g_, o]);
                    }
                }
            }
        }
        FOLD.FO = FO;
        const STATE = MAIN.FOLD_CELL_2_STATE(FOLD, CELL);
        const svg = SVG.clear("input");
        const slider = document.getElementById("slider");
        slider.value = 0;
        slider.setAttribute("max", FV.length);
        const clicked_groups = new Set();
        const LINE = { line, FG, clicked_groups };
        FS.push([FOLD, CELL]);
        FOLD.line = line_val;
        FOLD.points = Array.from(clicked.keys());
        MAIN.draw_state(svg, FOLD, CELL, STATE, FS, LINE);
        const fold_button = document.getElementById("fold_button");
        fold_button.style.display = "inline";
        fold_button.onclick = async () => {
            if (clicked_groups.size == 0) {
                FS.pop();
                MAIN.update_fold(FOLD_, CELL_, FS);
            } else {
                SVG.clear("input");
                document.getElementById("slider").value = 0;
                MAIN.draw_state(svg, FOLD, CELL, STATE, FS);
                svg.appendChild(line);
                const new_FOLD = await MAIN.make_fold(
                    V, FV_, FV, F_map, FG, FO_, clicked_groups, line_val, FS);
            }
        };
    },
    draw_state: (svg, FOLD, CELL, STATE, FS, LINE) => {
        const { Ff, EF } = FOLD;
        const { P, PP, CP, CF, SP, SC, SE } = CELL;
        const { Ctop, Ccolor, CD, L } = STATE;
        const flip = document.getElementById("flip").checked;
        const m = [0.5, 0.5];
        const Q = P.map(p => (flip ? M.add(M.refX(M.sub(p, m)), m) : p));
        const slider = document.getElementById("slider");
        const cycle = document.getElementById("cycle");
        MAIN.update_cp(FOLD, STATE, LINE);
        if (L == undefined) {
            slider.style.display = "none";
            cycle.style.display = "inline";
        } else {
            cycle.style.display = "none";
            slider.style.display = "inline";
            slider.oninput = () => {
                SVG.clear(svg.id);
                MAIN.draw_state(svg, FOLD, CELL, STATE, FS, LINE);
            };
            const val = +slider.value;
            const n = FOLD.FV.length;
            const F_set = new Set();
            for (let i = 0; i < n; ++i) {
                F_set.add(i);
            }
            if (flip) { L.reverse(); }
            for (let i = L.length - 1; i >= val; --i) {
                const layer = L[i];
                for (const fi of layer) {
                    F_set.delete(fi);
                }
            }
            if (flip) { L.reverse(); }
            for (let i = 0; i < CD.length; ++i) {
                const S = CD[i];
                const D = S.map(a => a);
                if (flip) {
                    D.reverse();
                }
                Ctop[i] = undefined;
                while (D.length > 0) {
                    const fi = D.pop();
                    if (!F_set.has(fi)) {
                        Ctop[i] = fi;
                        break;
                    }
                }
            }
            for (let i = 0; i < Ccolor.length; ++i) {
                const d = Ctop[i];
                let out = undefined;
                if (d == undefined) { out = undefined; }
                else if (Ff[d] != flip) { out = MAIN.color.face.top; }
                else { out = MAIN.color.face.bottom; }
                Ccolor[i] = out;
            }
        }
        const Pvisible = MAIN.PP_Ctop_CP_SC_2_Pvisible(Q, PP, Ctop, CP, SC);
        const SD = X.Ctop_SC_SE_EF_Ff_2_SD(Ctop, SC, SE, EF, Ff);
        const Q_ = M.normalize_points(Q);
        const cells = CP.map(V => M.expand(V, Q_));
        const fold_c = SVG.append("g", svg, { id: "fold_c" });
        const fold_s_crease = SVG.append("g", svg, { id: "fold_s_crease" });
        const fold_s_edge = SVG.append("g", svg, { id: "fold_s_edge" });
        const Lsvg = SVG.append("g", svg, { id: "lines" });
        const fold_p = SVG.append("g", svg, { id: "fold_p" });
        SVG.draw_polygons(fold_c, cells, {
            id: true, fill: Ccolor, stroke: Ccolor
        });
        const lines = SP.map((ps) => M.expand(ps, Q_));
        SVG.draw_segments(fold_s_crease, lines, {
            id: true, stroke: MAIN.color.edge.F,
            filter: (i) => SD[i][0] == "C"
        });
        SVG.draw_segments(fold_s_edge, lines, {
            id: true, stroke: MAIN.color.edge.B,
            filter: (i) => SD[i][0] == "B"
        });
        if (svg.id == "input") {
            if (LINE == undefined) {
                SVG.draw_points(fold_p, Q_, {
                    id: true, filter: (i) => Pvisible[i],
                    fill: MAIN.color.normal, r: MAIN.radius.normal,
                    opacity: MAIN.opacity.normal,
                });
                const clicked = new Map();
                for (let i = 0; i < Q.length; ++i) {
                    const el = document.getElementById(`fold_p${i}`);
                    if (el != undefined) {
                        el.onmouseover = () => MAIN.point_over(el);
                        el.onmouseout = () => MAIN.point_out(i, el, clicked);
                        el.onclick = () => MAIN.point_click(i, el, clicked, Q, FOLD, CELL, FS);
                    }
                }
            } else {
                const { line, FG, clicked_groups } = LINE;
                Lsvg.appendChild(line);
                line.onmouseout = () => {
                    line.setAttribute("stroke", MAIN.color.active);
                    line.setAttribute("stroke-width", MAIN.radius.normal);
                };
                line.onclick = () => { MAIN.update_fold(FOLD, CELL, FS); }
                line.setAttribute("stroke", MAIN.color.active);
                line.setAttribute("stroke-width", MAIN.radius.normal);
                const { Ctop, Ccolor } = STATE;
                for (let i = 0; i < CF.length; ++i) {
                    const el = document.getElementById(`fold_c${i}`);
                    if (el == undefined) { continue; }
                    el.onmouseover = () => MAIN.cell_over(i, Ctop, FG, CF);
                    el.onmouseout = () => MAIN.cell_out(i, Ctop, FG, Ccolor, clicked_groups);
                    el.onclick = () => MAIN.cell_click(i, Ctop, FG, Ccolor, clicked_groups);
                    const g = FG[Ctop[i]];
                    el.setAttribute("fill", clicked_groups.has(g) ? "yellow" : Ccolor[i]);
                }
            }
        }
    },
    make_fold: async (V, FV_, FV, F_map_old, FG, FO_, clicked_groups, line, FS) => {
        const F_map = F_map_old.map(() => []);
        // map only clicked regions
        const FVx = [];
        const FM = [];
        for (let fi = 0; fi < F_map_old.length; ++fi) {
            const F = F_map_old[fi];
            if (F.length == 2) {
                const [f1, f2] = F;
                const g1 = clicked_groups.has(FG[f1]);
                const g2 = clicked_groups.has(FG[f2]);
                if (g1 == g2) {
                    F_map[fi].push(FVx.length);
                    FVx.push(FV_[fi]);
                    FM.push(g1);
                } else {
                    F_map[fi].push(FVx.length);
                    FVx.push(FV[f1]);
                    FM.push(g1);
                    F_map[fi].push(FVx.length);
                    FVx.push(FV[f2]);
                    FM.push(g2);
                }
            } else if (F.length == 1) {
                const g1 = clicked_groups.has(FG[F[0]]);
                F_map[fi].push(FVx.length);
                FVx.push(FV_[fi]);
                FM.push(g1);
            } else {
                throw new Error("malformed FV2");
            }
        }
        const [Vx, FVy] = MAIN.remove_unused_V_FV(V, FVx);
        const Vy = Vx.map(() => undefined);
        const [u, d] = line;
        for (let fi = 0; fi < FVy.length; ++fi) {
            const F = FVy[fi];
            if (!FM[fi]) { continue; }
            for (const vi of F) {
                if (Vy[vi] != undefined) { continue; }
                const v = Vx[vi];
                const d2 = M.dot(v, u) - d;
                Vy[vi] = M.sub(v, M.mul(u, 2 * d2));
            }
        }
        for (let vi = 0; vi < Vy.length; ++vi) {
            if (Vy[vi] == undefined) {
                Vy[vi] = Vx[vi];
            }
        }
        const [FOLD, CELL] = MAIN.V_FV_2_FOLD_CELL(Vy, FVy);
        const { Ff, EF } = FOLD;
        const { P, PP, CP, FC, CF, SE, SC, SP, BF, BI } = CELL;
        const type = document.getElementById("type_select").value;
        const FO = [];
        for (const [f, g, o] of FO_) {
            for (const f_ of F_map[f]) {
                for (const g_ of F_map[g]) {
                    const pair = M.encode_order_pair([f_, g_]);
                    if (BI.has(pair)) {
                        if (type == "pure") {
                            if (FM[f_] == FM[g_]) {
                                FO.push([f_, g_, o]);
                            }
                        } else {
                            if (!FM[f_] && !FM[g_]) {
                                FO.push([f_, g_, o]);
                            }
                        }
                    }
                }
            }
        }
        const FOO = [];
        for (const [f, g, o] of FO_) {
            for (const f_ of F_map[f]) {
                for (const g_ of F_map[g]) {
                    const pair = M.encode_order_pair([f_, g_]);
                    if (BI.has(pair)) {
                        if (FM[f_] && FM[g_]) {
                            FOO.push([f_, g_, o]);
                        }
                    }
                }
            }
        }
        FOLD.FM = FM;
        FOLD.FOO = FOO;
        NOTE.time("Computing edge-edge overlaps");
        const ExE = X.SE_2_ExE(SE);
        NOTE.count(ExE, "edge-edge adjacencies");
        NOTE.lap();
        NOTE.time("Computing edge-face overlaps");
        const ExF = X.SE_CF_SC_2_ExF(SE, CF, SC);
        NOTE.count(ExF, "edge-face adjacencies");
        NOTE.lap();
        NOTE.time("Computing non-transitivity constraints");
        const [BT0, BT1, BT2] = X.BF_BI_EF_ExE_ExF_2_BT0_BT1_BT2(
            BF, BI, EF, ExE, ExF);
        NOTE.count(BT0, "taco-taco", 6);
        NOTE.count(BT1, "taco-tortilla", 3);
        NOTE.count(BT2, "tortilla-tortilla", 2);
        NOTE.lap();
        NOTE.time("Computing excluded (possible) transitivity constraints");
        const BT3x = X.FC_BF_BI_BT0_BT1_2_BT3x(FC, BF, BI, BT0, BT1);
        NOTE.count(BT3x, "exluded (possible) transitivity", 3);
        NOTE.lap();
        NOTE.time("Computing transitivity constraints");
        const [BT3, nx] = X.EF_SP_SE_CP_FC_CF_BF_BT3x_2_BT3(
            EF, SP, SE, CP, FC, CF, BF, BT3x);
        BT3x.length = 0;
        const ni = NOTE.count(BT3, "independent transitivity", 3);
        NOTE.log(`   - Found ${nx + ni} total transitivity`);
        NOTE.lap();
        const BT = BF.map((F, i) => [BT0[i], BT1[i], BT2[i], BT3[i]]);
        NOTE.time("*** Computing states ***");
        const BA = MAIN.FO_Ff_BF_2_BA0(FO, Ff, BF);
        const GB = SOLVER.get_components(BI, BF, BT, BA);
        const GA = SOLVER.solve(BI, BF, BT, BA, GB, Infinity);
        const n = (GA == undefined) ? 0 : GA.reduce((s, A) => {
            return s * BigInt(A.length);
        }, BigInt(1));
        NOTE.time("Solve completed");
        NOTE.count(n, "folded states");
        NOTE.lap();
        if (n == 0) {
            NOTE.end();
            FS.pop();
            cnost[FOLD_, CELL_] = FS[FS.length - 1];
            MAIN.update_fold(FOLD_, CELL_, FS);
            return;
        }
        const GI = GB.map(() => 0);
        document.getElementById("state_controls").style.display = "inline";
        const comp_select = SVG.clear("component_select");
        for (const [i, _] of GB.entries()) {
            const el = document.createElement("option");
            el.setAttribute("value", `${i}`);
            el.textContent = `${i}`;
            if (i == 1) {
                el.setAttribute("selected", true);
            }
            comp_select.appendChild(el);
        }
        const SOLUTION = { GB, GA, GI };
        FS.push([FOLD, CELL]);
        comp_select.onchange = () => {
            NOTE.start("Changing component");
            MAIN.update_component(FS, SOLUTION);
            NOTE.end();
        };
        NOTE.time("Computing state");
        const edges = X.BF_GB_GA_GI_2_edges(BF, GB, GA, GI);
        FOLD.FO = X.edges_Ff_2_FO(edges, Ff);
        const STATE = MAIN.FOLD_CELL_2_STATE(FOLD, CELL);
        NOTE.time("Drawing fold");
        const svg = SVG.clear("output");
        MAIN.draw_state(svg, FOLD, CELL, STATE, FS);
        MAIN.update_component(FS, SOLUTION);
        NOTE.lap();
        stop = Date.now();
        NOTE.end();
    },
    update_component: (FS, SOLUTION) => {
        const [FOLD, CELL] = FS[FS.length - 1];
        const { BF } = CELL;
        const { GB, GA, GI } = SOLUTION;
        const comp_select = document.getElementById("component_select");
        const c = comp_select.value;
        document.getElementById("state_config").style.display = "none";
        const C = [];
        C.push(c);
        const n = GA[c].length;
        document.getElementById("state_config").style.display = "inline";
        const state_label = document.getElementById("state_label");
        const state_select = document.getElementById("state_select");
        state_label.innerHTML = `${n} State${(n == 1) ? "" : "s"}`;
        state_select.setAttribute("min", 1);
        state_select.setAttribute("max", n);
        state_select.value = GI[c] + 1;
        state_select.onchange = () => {
            NOTE.start("Computing new state");
            let j = +state_select.value;
            if (j < 1) { j = 1; }
            if (j > n) { j = n; }
            state_select.value = j;
            GI[c] = j - 1;
            NOTE.time("Computing state");
            const edges = X.BF_GB_GA_GI_2_edges(BF, GB, GA, GI);
            FOLD.FO = X.edges_Ff_2_FO(edges, FOLD.Ff);
            const STATE = MAIN.FOLD_CELL_2_STATE(FOLD, CELL);
            NOTE.time("Drawing fold");
            const svg = SVG.clear("output");
            MAIN.draw_state(svg, FOLD, CELL, STATE, FS);
            const flip_el = document.getElementById("flip");
            flip_el.onchange = () => MAIN.flip_output(FS);
            const replace = document.getElementById("replace");
            replace.style.display = "inline";
            replace.onclick = () => {
                FOLD.V = M.normalize_points(FOLD.V);
                CELL.P = M.normalize_points(CELL.P);
                FOLD.FOO = undefined;
                FOLD.FM = undefined;
                const last = FS.pop();
                const prev = FS.pop();
                last[0].line = prev[0].line;
                last[0].points = prev[0].points;
                FS.push(last);
                const [FOLD_, CELL_] = FS[FS.length - 1];
                MAIN.update_fold(FOLD_, CELL_, FS);
            };
        };
        state_select.onchange();
    },
    flip_output: (FS) => {
        NOTE.start("Flipping model");
        const svg = SVG.clear("output");
        const [FOLD, CELL] = FS[FS.length - 1];
        const STATE = MAIN.FOLD_CELL_2_STATE(FOLD, CELL);
        MAIN.draw_state(svg, FOLD, CELL, STATE, FS);
        NOTE.end();
    },
    FO_Ff_BF_2_BA0: (FO, Ff, BF) => {
        const BA_map = new Map();
        for (let i = 0; i < FO.length; ++i) {
            const [f, g, o] = FO[i];
            const a1 = (Ff[g]
                ? ((o > 0) ? 1 : 2)
                : ((o > 0) ? 2 : 1)
            );
            const a2 = ((f < g)
                ? a1
                : ((a1 == 1) ? 2 : 1)
            );
            const s = M.encode_order_pair([f, g]);
            BA_map.set(s, a2);
        }
        return BF.map(s => {
            const out = BA_map.get(s);
            return (out == undefined) ? 0 : out;
        });
    },
    remove_unused_V_FV: (V, FV) => {
        const V_ = [];
        const n = V.length;
        const Vuse = Array(n).fill(false);
        const V_map = Array(n).fill(undefined);
        for (const F of FV) {
            for (const i of F) {
                Vuse[i] = true;
            }
        }
        for (let i = 0; i < n; ++i) {
            if (Vuse[i]) {
                V_map[i] = V_.length;
                V_.push(V[i]);
            }
        }
        const FV_ = FV.map(F => F.map(i => V_map[i]));
        return [V_, FV_];
    },
    cell_over: (i, Ctop, FG, CF) => {
        const g = FG[Ctop[i]];
        for (let j = 0; j < Ctop.length; ++j) {
            if (g == FG[Ctop[j]]) {
                const el = document.getElementById(`fold_c${j}`);
                el.setAttribute("fill", "lightpink");
            }
        }
        for (let j = 0; j < FG.length; ++j) {
            if (g == FG[j]) {
                const el = document.getElementById(`flat_f${j}`);
                el.setAttribute("fill", "lightpink");
            }
        }
    },
    cell_out: (i, Ctop, FG, Ccolor, clicked) => {
        const g1 = FG[Ctop[i]];
        for (let j = 0; j < Ctop.length; ++j) {
            const g2 = FG[Ctop[j]];
            if (g1 == g2) {
                const el = document.getElementById(`fold_c${j}`);
                el.setAttribute("fill", clicked.has(g2) ? "yellow" : Ccolor[j]);
            }
        }
        for (let j = 0; j < FG.length; ++j) {
            const g2 = FG[j];
            if (g1 == g2) {
                const el = document.getElementById(`flat_f${j}`);
                el.setAttribute("fill", clicked.has(g2) ? "yellow" : "white");
            }
        }
    },
    cell_click: (i, Ctop, FG, Ccolor, clicked) => {
        const g = FG[Ctop[i]];
        if (clicked.has(g)) {
            clicked.delete(g);
        } else {
            clicked.add(g);
        }
    },
    FOLD_2_FS: (doc) => {
        const ex = JSON.parse(doc);
        const properties = [
            "vertices_coords", "faces_vertices",
            "faceOrders", "file_frames",
        ];
        const [V_org, FV, FO, frames] = properties.map(property => {
            const val = ex[property];
            if (val == undefined) {
                NOTE.time(`FOLD file must contain ${property}, but not found`);
                return undefined;
            }
            return val;
        });
        const FS = [];
        if (frames == undefined) {
            const V = M.normalize_points(V_org);
            const [FOLD, CELL] = MAIN.V_FV_2_FOLD_CELL(V, FV);
            FOLD.FO = FO;
            FS.push([FOLD, CELL]);
        } else {
            for (const frame of frames) {
                const [FOLD, CELL] = MAIN.V_FV_2_FOLD_CELL(
                    frame.vertices_coords,
                    frame.faces_vertices
                );
                FOLD.FL = frame["faces_lf:group"];
                FOLD.FO = frame.faceOrders;
                FOLD.line = frame["lf:line"];
                FOLD.points = frame["lf:points"];
                FS.push([FOLD, CELL]);
            }
        }
        return FS;
    },
    V_FV_2_FOLD_CELL: (V, FV) => {
        const Ff = MAIN.FV_V_2_Ff(FV, V);
        const EV_set = new Set();
        for (const fV of FV) {
            let i = fV.length - 1;
            for (let j = 0; j < fV.length; ++j) {
                EV_set.add(M.encode_order_pair([fV[i], fV[j]]));
                i = j;
            }
        }
        const EV = Array.from(EV_set).sort().map(k => M.decode(k));
        const [EF, FE] = X.EV_FV_2_EF_FE(EV, FV);
        const L = EV.map(vs => vs.map(i => V[i]));
        NOTE.time("Constructing points and segments from edges");
        const [P, SP, SE, eps_i] = X.L_2_V_EV_EL(L);
        const eps = M.min_line_length(L) / (2 ** eps_i);
        NOTE.annotate(P, "points_coords");
        NOTE.annotate(SP, "segments_points");
        NOTE.annotate(SE, "segments_edges");
        NOTE.lap();
        NOTE.time("Constructing cells from segments");
        const [PP, CP] = X.V_EV_2_VV_FV(P, SP);
        NOTE.annotate(CP, "cells_points");
        NOTE.lap();
        NOTE.time("Computing segments_cells");
        const [SC, CS] = X.EV_FV_2_EF_FE(SP, CP);
        NOTE.annotate(SC, "segments_cells");
        NOTE.annotate(CS, "cells_segments");
        NOTE.lap();
        NOTE.time("Making face-cell maps");
        const [CF, FC] = X.EF_FV_SP_SE_CP_SC_2_CF_FC(EF, FV, SP, SE, CP, SC);
        const BF = X.EF_SP_SE_CP_CF_2_BF(EF, SP, SE, CP, CF);
        const BI = new Map();
        for (const [i, F] of BF.entries()) { BI.set(F, i); }
        NOTE.annotate(BF, "variables_faces");
        NOTE.lap();
        const FOLD = { V, FV, EV, EF, FE, Ff, eps };
        const CELL = { P, SP, SE, PP, CP, CS, SC, CF, FC, BF, BI };
        return [FOLD, CELL];
    },
    FOLD_CELL_2_STATE: (FOLD, CELL) => {
        const { EF, Ff, FO } = FOLD;
        const { P, SE, PP, CP, SC, CF } = CELL;
        const m = [0.5, 0.5];
        const flip = document.getElementById("flip").checked;
        const Q = P.map(p => (flip ? M.add(M.refX(M.sub(p, m)), m) : p));
        const edges = FO.map(([f1, f2, o]) => {
            return M.encode(((Ff[f2] ? 1 : -1) * o >= 0) ? [f1, f2] : [f2, f1]);
        });
        const L = MAIN.linearize(edges, Ff.length);
        const slider = document.getElementById("slider");
        if (L != undefined) {
            slider.setAttribute("max", L.length);
        }
        const CD = X.CF_edges_2_CD(CF, edges);
        const Ctop = CD.map(S => flip ? S[0] : S[S.length - 1]);
        const Ccolor = Ctop.map(d => {
            if (d == undefined) { return undefined; }
            if (Ff[d] != flip) { return MAIN.color.face.top; }
            else { return MAIN.color.face.bottom; }
        });
        return { Q, CD, Ctop, Ccolor, L, edges };
    },
    linearize: (edges, n) => {
        const Adj = Array(n).fill(0).map(() => []);
        for (const s of edges) {
            const [f1, f2] = M.decode(s);
            Adj[f1].push(f2);
        }
        const L = [];
        const seen = Array(n).fill(false);
        const dfs = (i) => {
            if (seen[i]) { return; }
            seen[i] = true;
            for (const j of Adj[i]) {
                dfs(j);
            }
            L.push(i);
        };
        for (let i = 0; i < n; ++i) {
            dfs(i);
        }
        L.reverse();
        console.assert(L.length == n);
        const idx_map = Array(n).fill(undefined);
        for (let i = 0; i < n; ++i) {
            const fi = L[i];
            idx_map[fi] = i;
        }
        for (const s of edges) {
            const [f1, f2] = M.decode(s);
            if (idx_map[f1] > idx_map[f2]) {
                return undefined; // cycle
            }
        }
        for (let i = 0; i < n; ++i) {
            seen[i] = false;
        }
        const layers = [];
        for (let i = 0; i < n; ++i) {
            const fi = L[i];
            if (seen[fi]) { continue; }
            seen[fi] = true;
            const layer = [fi];
            const Adj_set = new Set();
            for (const fj of Adj[fi]) {
                Adj_set.add(fj);
            }
            for (let j = i + 1; j < L.length; ++j) {
                const fj = L[j];
                if (seen[fj]) { continue; }
                if (!Adj_set.has(fj)) {
                    seen[fj] = true;
                    layer.push(fj);
                }
                for (const fk of Adj[fj]) {
                    Adj_set.add(fk);
                }
            }
            layers.push(layer);
        }
        return layers;
    },
    FV_V_2_Ff: (FV, V) => FV.map(fV => (M.polygon_area2(fV.map(i => V[i])) < 0)),
    PP_Ctop_CP_SC_2_Pvisible: (P, PP, Ctop, CP, SC) => {
        // computes boolean whether each vertex isvisible from top
        const SC_map = new Map();
        for (const [i, C] of CP.entries()) {
            for (const [j, p1] of C.entries()) {
                const p2 = C[(j + 1) % C.length];
                SC_map.set(M.encode([p2, p1]), i);
            }
        }
        return PP.map((V, i) => {
            const F = [];
            const A = V.map(j => M.angle(M.sub(P[j], P[i])));
            for (const j of V) {
                const c = SC_map.get(M.encode([i, j]));
                F.push((c == undefined) ? -1 : Ctop[c]);
            }
            const F_set = new Map();
            for (let i = 0; i < F.length; ++i) {
                const f = F[i];
                let ang = F_set.get(f);
                if (ang == undefined) { ang = 0; }
                ang += A[i] - A[(i - 1) % A.length];
                F_set.set(f, ang);
            }
            if (F_set.size > 2) {
                return true;
            }
            for (const [f, ang] of F_set.entries()) {
                if (Math.abs(Math.abs(ang) - Math.PI) > 0.001) {
                    return true;
                }
            }
            return false;
        });
    },
    get_lines: (P) => {
        const out = [];
        if (P.length == 2) {
            const [a, b] = P;
            const m = M.div(M.add(a, b), 2);
            const v1 = M.sub(b, a); // line through AB
            const v2 = M.perp(v1);  // perpendicular bisector of AB
            for (let v of [v1, v2]) {
                const u = M.unit(v);
                const d = M.dot(m, u);
                out.push([u, d]);
            }
        } else if (P.length == 3) {
            const [a, b, c] = P;
            if (Math.abs(M.area2(a, b, c)) > 0.000001) {
                {   // angle bisector of ABC
                    const ba = M.unit(M.sub(a, b));
                    const bc = M.unit(M.sub(c, b));
                    const u = M.unit(M.add(ba, bc));
                    const v = M.perp(u);
                    const d = M.dot(b, v);
                    out.push([v, d]);
                }
                {   // through A perpendicular to BC
                    const u = M.unit(M.sub(c, b));
                    const d = M.dot(a, u);
                    out.push([u, d]);
                }
            } else {
                {   // through A perpendicular to BC
                    const u = M.unit(M.sub(c, b));
                    const d = M.dot(a, u);
                    out.push([u, d]);
                }
            }
        } else if (P.length == 4) {
            const [a, b, c, d] = P; // angle bisector of AB and CD
            const ba = M.unit(M.sub(a, b));
            const cd = M.unit(M.sub(d, c));
            const perp = M.perp(cd);
            const parallel = Math.abs(M.dot(perp, ba)) < 0.000001;
            const u = parallel ? ba : M.unit(M.add(ba, cd));
            const U = parallel ? [u] : [u, M.perp(u)];
            for (const v of U) {
                const pc = M.dot(c, v);
                const pa = M.dot(a, v);
                const pb = M.dot(b, v);
                const bb = M.add(a, M.mul(M.sub(b, a), (pc - pa) / (pb - pa)));
                const x = M.div(M.add(bb, c), 2);
                const pv = M.perp(v);
                const [aL, bL, cL, dL] = [a, b, c, d].map(p => {
                    return M.dot(M.sub(p, x), pv) < 0;
                });
                if ((aL != bL) || (bL != cL) || (cL != dL)) {
                    out.push([pv, M.dot(pv, x)]);
                }
            }
        }
        return out.map(([u, d]) => {
            return (d < 0) ? [M.mul(u, -1), -d] : [u, d];
        });
    },
    line_2_coords: (line) => {
        const [u, d] = line;
        const p = M.mul(u, d);
        const off = M.mul(M.perp(u), 10);
        const p1 = M.add(p, off);
        const p2 = M.sub(p, off);
        return [p1, p2];
    },
    FV_V_Vf_line_eps_2_FV2_V2_Vf2_VD2: (FV, V, Vf, line, eps) => {
        // assumes convex faces (or line divides a face into at most two pieces
        const [u, d] = line;
        const [a, b] = MAIN.line_2_coords(line);
        const nV = V.length;
        const V2 = V.map(v => v);
        const Vf2 = Vf.map(v => v);
        const VD = V.map(v => {
            const dv = M.dot(u, v) - d;
            return (Math.abs(dv) <= eps) ? 0 : dv;
        });
        const EV_map = new Map();
        const FV2 = FV.map((F) => {
            const pair = [[], []];
            const nF = F.length;
            let [neg, pos] = [false, false];
            for (const v of F) {
                const d = VD[v];
                if (d < 0) { neg = true; }
                if (d > 0) { pos = true; }
            }
            if (!neg && !pos) {
                throw new Exception("face has zero area?");
            }
            if (neg != pos) {
                pair[pos ? 0 : 1] = F.map(i => i);
                return pair;
            }
            let i = 1;
            while ((i < nF) && ((VD[F[i - 1]] < 0) == (VD[F[i]] < 0))) {
                ++i;
            }
            for (let j = 0; j < nF; ++j) {
                const i1 = (i + j) % nF;
                const v1 = F[i1];
                if (Math.abs(VD[v1]) == 0) {
                    pair[0].push(v1);
                    pair[1].push(v1);
                    continue;
                }
                if (VD[v1] > 0) { pair[0].push(v1); }
                if (VD[v1] < 0) { pair[1].push(v1); }
                const i2 = (i1 + 1) % nF;
                const v2 = F[i2];
                if (Math.abs(VD[v2]) == 0) { continue; }
                if ((VD[v1] < 0) != (VD[v2] < 0)) {
                    const s = M.encode_order_pair([v1, v2]);
                    let xi = EV_map.get(s);
                    if (xi == undefined) {
                        const x = M.intersect([V[v1], V[v2]], [a, b], eps);
                        const xf = M.add(Vf[v1],
                            M.mul(
                                M.sub(Vf[v2], Vf[v1]),
                                M.dist(x, V[v1]) / M.dist(V[v1], V[v2])
                            )
                        );
                        xi = V2.length;
                        EV_map.set(s, xi);
                        V2.push(x);
                        Vf2.push(xf);
                        VD.push(0);
                    }
                    pair[0].push(xi);
                    pair[1].push(xi);
                }
            }
            return pair;
        });
        return [FV2, V2, Vf2, VD];
    },
    FV_VD_2_FG: (FV, VD) => {
        const EF_map = new Map();
        for (const [i, F] of FV.entries()) {
            for (const [j, v1] of F.entries()) {
                const v2 = F[(j + 1) % F.length];
                EF_map.set(M.encode([v2, v1]), i);
            }
        }
        const FG = FV.map(() => undefined);
        let g = 0;
        const dfs = (i) => {
            if (FG[i] != undefined) { return; }
            FG[i] = g;
            const F = FV[i];
            for (const [j, v1] of F.entries()) {
                const v2 = F[(j + 1) % F.length];
                if ((VD[v1] == 0) && (VD[v2] == 0)) { continue; }
                const fi = EF_map.get(M.encode([v1, v2]));
                if (fi != undefined) {
                    dfs(fi);
                }
            }
        };
        for (let i = 0; i < FG.length; ++i) {
            if (FG[i] != undefined) { continue; }
            dfs(i);
            ++g;
        }
        return FG;
    },
    write: (FS) => {
        const frames = [];
        for (const [FOLD, _] of FS) {
            const { V, Vf, FV, FO, FL } = FOLD;
            const frame_FOLD = {
                vertices_coords: V,
                faces_vertices: FV,
                faceOrders: FO,
                "faces_lf:group": FL,
                "lf:line": FOLD.line,
                "lf:points": FOLD.points,
            };
            frames.push(frame_FOLD);
        }
        const [FOLD, CELL] = FS[FS.length - 1];
        const { V, Vf, FV, FO, FL } = FOLD;
        const path = document.getElementById("import").value.split("\\");
        const name = path[path.length - 1].split(".")[0];
        const export_FOLD = {
            file_spec: 1.1,
            file_creator: "flat-folder",
            file_title: `${name}_state`,
            file_classes: ["singleModel"],
            vertices_coords: V,
            faces_vertices: FV,
            faceOrders: FO,
            file_frames: frames,
        };
        const data = new Blob([JSON.stringify(export_FOLD, undefined, 2)], {
            type: "application/json"
        });
        const link = document.getElementById("export_anchor");
        link.setAttribute("download", `state.fold`);
        link.setAttribute("href", window.URL.createObjectURL(data));
        link.style.textDecoration = "none";
    },
};
/*  Axioms:
 *     #pts | abbr  | description
 *  1)  2   | TPTP  | line through two points
 *  2)  2   | P2P   | line folding point to point
 *  3) 3,4  | S2S   | line folding segment to segment
 *  4)  3   | RSTP  | line perpendicular to segment through point
 *  5)  4   | P2STP | line folding point to segment through point
 *  6)  5   | P2SRS | line folding point to segment perpendicular to segment
 *  7)  6   | PP2SS | line folding points to segments
 */
