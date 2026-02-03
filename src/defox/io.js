import { IO } from "../flatfolder/io.js";
import { M } from "../flatfolder/math.js";
import { X } from "../flatfolder/conversion.js";
import { N } from "./nath.js";
import { Y } from "./y.js";
import { PRJ } from "./project.js";
import { PAGE } from "./page.js";


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
            let link = document.createElement("a"); // aタグのエレメントを作成
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
            IO3.write_png(svg_id, name, idx);
            return;
        }
        for (let j = 0; j < PAGE.get_pages(PRJ.steps); j++) {
            PAGE.current_idx = j;
            PRJ.redraw_page();
            IO3.write_png(svg_id, name + "_page_", j);
        }
    },
    write_png: (svg_id, name, idx) => {
        var svg = document.getElementById(svg_id);
        var svgData = new XMLSerializer().serializeToString(svg);
        var canvas = document.createElement("canvas");
        canvas.width = svg.width.baseVal.value;
        canvas.height = svg.height.baseVal.value;

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
        const json = new Blob([JSON.stringify(data, undefined, 2)], {
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

    cp_2_V_VV_EV_EA_EF_FV_FE: (doc, L_add = undefined) => {
        let V, EV_, EV, EA_, EA, EF, FE, VV, FV;
        let UV, FU;
        let L, EL;
        L = IO.CP_2_L(doc);
        if (L_add) {
            const L_norm = IO3.normalize_L(L)
            L = L_add.concat(L_norm);
        }
        [V, EV_, EL,] = X.L_2_V_EV_EL(L);
        EA_ = EL.map((ls) => {
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

        V = M.normalize_points(V);
        EV = [];
        UV = [];
        EA = [];
        for (const [ei_, a_] of EA_.entries()) {
            if (a_ == "F") {
                UV.push(EV_[ei_]);
            }
            else {
                EV.push(EV_[ei_]);
                EA.push(a_);
            }
        }

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
        return [V, VV, EV, EA, EF, FV, FE, UV, FU, Vc, UA];
    },
}