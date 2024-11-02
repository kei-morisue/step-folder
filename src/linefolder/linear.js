import { M } from "../flatfolder/math.js";


export const LIN = {

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
}
