import { IO } from "../flatfolder/io.js";
import { M } from "../flatfolder/math.js";
import { X } from "../flatfolder/conversion.js";
import { SVG } from "../flatfolder/svg.js";
import { N } from "./nath.js";
import { Y } from "./y.js";
import { PRJ } from "./project.js";
import { PAGE } from "./page.js";
import { DIST } from "../distortionfolder/distortion.js";


export const IO3 = {    // INPUT-OUTPUT
    write: (svg_id, name, ext, idx = undefined) => {
        if (ext == "png") {
            return IO3.write_pngs(svg_id, name, idx);
        }
        if (ext == "svg") {
            return IO3.write_svgs(svg_id, name, idx);
        }
        if (ext == "cp") {
            return IO3.write_cps(name, idx);
        }
    },

    format_num: (n) => {
        return ((n + 1) + "").padStart(3, '0');
    },

    write_cps: (name, idx = undefined) => {
        if (idx) {
            const FOLD = PRJ.steps[idx].fold_cp;
            const cp = Y.FOLD_2_CP(FOLD);
            let blob = new Blob([cp], { type: "text/plain" });
            let link = document.createElement("a");
            link.href = window.URL.createObjectURL(blob);
            const num = IO3.format_num(idx);
            link.download = num + ".cp";
            link.click();
            return;
        }

        const zip = new JSZip();

        for (const [idx, step] of PRJ.steps.entries()) {
            if (idx == 0) {
                continue;
            }
            const FOLD = step.fold_cp;
            const cp = Y.FOLD_2_CP(FOLD);
            const num = IO3.format_num(idx);
            zip.file(num + ".cp", cp);
        }
        zip.generateAsync({ type: "blob" }).then(function (content) {
            saveAs(content, name + ".zip");
        });

    },

    write_svgs: (svg_id, name, idx = undefined) => {
        if (idx) {
            PRJ.restore(idx);
            IO3.write_svg(svg_id, name, idx);
            return;
        }
        for (let j = 0; j < PAGE.get_pages(PRJ.steps); j++) {
            PAGE.current_idx = j;
            PRJ.redraw_page();
            IO3.write_svg(svg_id, name + "_page_", j);
        }
    },
    write_svg: (svg_id, name, idx) => {
        const img = new Blob([document.getElementById(svg_id).outerHTML], {
            type: "image/svg+xml"
        });
        const link = document.createElement("a");
        const num = IO3.format_num(idx);
        link.setAttribute("download", `${name}_${num}.svg`);
        link.setAttribute("href", window.URL.createObjectURL(img));
        link.dispatchEvent(new MouseEvent("click"));
    },
    write_pngs: (svg_id, name, idx = undefined) => {
        if (idx) {
            PRJ.restore(idx);
            const width = SVG.SCALE;
            const height = SVG.SCALE;
            const dim = { width, height };
            IO3.write_png(svg_id, name, dim, idx);
            return;
        }
        for (let j = 0; j < PAGE.get_pages(PRJ.steps); j++) {
            PAGE.current_idx = j;
            PRJ.redraw_page();
            const width = PAGE.dim.width;
            const height = PAGE.dim.height;
            const dim = { width, height };
            IO3.write_png(svg_id, name + "_page_", dim, j);
        }
    },
    write_png: (svg_id, name, dim, idx) => {
        var svg = document.getElementById(svg_id);
        var svgData = new XMLSerializer().serializeToString(svg);
        var canvas = document.createElement("canvas");
        canvas.width = dim.width;
        canvas.height = dim.height;

        var ctx = canvas.getContext("2d");
        var image = new Image;
        image.onload = function () {
            ctx.drawImage(image, 0, 0);
            var a = document.createElement("a");
            a.href = canvas.toDataURL("image/png");
            const num = IO3.format_num(idx);
            a.setAttribute("download", `${name}_${num}.png`);
            a.dispatchEvent(new MouseEvent("click"));
        }
        image.src = "data:image/svg+xml;charset=utf-8;base64," + btoa(unescape(encodeURIComponent(svgData)));
    },

    save: (data, name) => {
        const data_ = [];
        for (const d of data) {
            const d_ = {};
            for (const key of ["fold_cp", "cell_cp", "fold", "cell_d", "params", "lin", "symbols"]) {
                d_[key] = d[key];
            }
            data_.push(d_);
        }
        const json = new Blob([JSON.stringify(data_, undefined, 2)], {
            type: "application/json"
        })
        const ext = "defox";
        const link = document.createElement("a");
        const button = document.createElement("input");
        link.appendChild(button);
        link.setAttribute("download", `${name}.${ext}`);
        link.setAttribute("href", window.URL.createObjectURL(json));
        button.setAttribute("type", "button");
        button.click();
    },
    load: (data) => {
        const data_ = data;
        for (const d of data_) {
            d.state_cp = Y.FOLD_CELL_2_STATE(d.fold_cp, d.cell_cp);
            const { Vf, FV, EV, EF, FE, Ff, EA, V, VV, Vc, FU, UV, UA, FO } = d.fold
            PRJ.restore_params(d.params);
            const VD = DIST.FOLD_2_VD(Vf, V);
            d.fold_d = { V, Vf: VD, FV, EV, EF, FE, Ff, EA, VV, Vc, FU, UV, UA, FO };
        }
        return data_;
    },
    normalize_L: (L) => {
        const P = [];
        L.map((l) => {
            P.push(l[0]);
            P.push(l[1]);
        });
        const Q = M.normalize_points(P);

        return L.map((_, l_i) => {
            return [Q[2 * l_i], Q[2 * l_i + 1], L[l_i][2]];
        });
    },

    EL_L_2_EA: (EL, L) => {
        return EL.map((ls) => {
            let a = "F";
            for (const l_i of ls) {
                const b = L[l_i][2];
                if (b != "F") {
                    a = b;
                    break;
                }
            }
            return (a == "M") ? "V" : ((a == "V") ? "M" : a);
        });
    },

    cp_2_V_VV_EV_EA_EF_FV_FE: (doc, L_add = undefined) => {
        let V_, V, UV_, EV, UA_, EA, EF, FE, VV, FV;
        let UV, FU;
        let L, L_, EL, UL_;
        L_ = IO.CP_2_L(doc);
        L_ = IO3.normalize_L(L_)
        if (L_add) {
            L_ = L_add.concat(L_);
        }
        [V_, UV_, UL_,] = X.L_2_V_EV_EL(L_);
        UA_ = IO3.EL_L_2_EA(UL_, L_);

        L = [];
        for (const [p, q, a] of L_) {
            if (a != "F") {
                L.push([p, q, a]);
            }
        }
        [V, EV, EL,] = X.L_2_V_EV_EL(L);
        EA = IO3.EL_L_2_EA(EL, L);


        [VV, FV] = X.V_EV_2_VV_FV(V, EV);

        [EF, FE] = X.EV_FV_2_EF_FE(EV, FV);     // remove holes


        if (FV.length > 1) {
            FV = FV.filter((F, i) => !FE[i].every(e => (EA[e] == "B")));
        }
        if (FV.length != FE.length) {           // recompute face maps
            [EF, FE] = X.EV_FV_2_EF_FE(EV, FV);
        }
        for (const [i, F] of EF.entries()) {    // boundary edge assignment
            if (F.length == 1) {
                EA[i] = "B";
            }
        }

        UV = [];
        for (const [ei_, a_] of UA_.entries()) {
            if (a_ != "F") {
                continue;
            }
            const [pi_, qi_] = UV_[ei_];
            const [p, q] = [V_[pi_], V_[qi_]];
            let pi = -1;
            for (const [vi, v] of V.entries()) {
                if (M.distsq(p, v) < 1e-16) {
                    pi = vi
                    break;
                }
            }
            if (pi < 0) {
                V.push(p);
                pi = V.length - 1;
            }
            let qi = -1;
            for (const [vi, v] of V.entries()) {
                if (M.distsq(q, v) < 1e-16) {
                    qi = vi
                    break;
                }
            }
            if (qi < 0) {
                V.push(q);
                qi = V.length - 1;
            }
            UV.push([pi, qi]);
        }

        FU = FV.map(_ => []);
        for (const [ui, vv] of UV.entries()) {
            const c = M.centroid(M.expand(vv, V));
            for (const [fi, vs] of FV.entries()) {
                if (N.is_inside(c, M.expand(vs, V))) {
                    FU[fi].push(ui);
                    break;
                };
            }
        }

        const Vc = V.map(_ => false);
        for (const vs of FV) {
            for (const v of vs) {
                Vc[v] = true;
            }
        }
        const UA = UV.map(_ => "F");
        for (const [ui, [p_i, q_i]] of UV.entries()) {
            const a = UA[ui];
            if (a != "F") {
                Vc[p_i] = false;
                Vc[q_i] = false;
            }
        }
        return [V, VV, EV, EA, EF, FV, FE, UV, FU, Vc, UA];
    },
}