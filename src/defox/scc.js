import { M } from "../flatfolder/math.js";
import { X } from "../flatfolder/conversion.js";
import { Y } from "./y.js";

export const SCC = {
    extract: (edges, n) => {//Kosaraju's Algorithm
        const Adj = Array(n).fill(0).map(() => []);
        const jdA = Array(n).fill(0).map(() => []);

        for (const s of edges) {
            const [f1, f2] = M.decode(s);
            Adj[f1].push(f2);
            jdA[f2].push(f1);
        }

        const S = [];
        const seen = Array(n).fill(false);
        const dfs1 = (i) => {
            if (seen[i]) return;
            seen[i] = true;
            for (const j of Adj[i]) dfs1(j);
            S.push(i);
        };

        for (let i = 0; i < n; ++i) dfs1(i);

        seen.fill(false);
        const sccList = [];

        const dfs2 = (i, component) => {
            seen[i] = true;
            component.push(i);
            for (const j of jdA[i]) {
                if (!seen[j]) dfs2(j, component);
            }
        };

        while (S.length > 0) {
            const i = S.pop();
            if (!seen[i]) {
                const component = [];
                dfs2(i, component);
                sccList.push(component);
            }
        }

        return sccList;
    },

    FOLD_2_CELL: (FOLD, faces) => {
        const { Vf, EV, EF, FV, FE } = FOLD;
        if (faces.size == 0) {
            const P = Vf;
            const CP = FV;
            const SP = EV;
            const SC = EF;
            const CS = FE;
            const SE = EV.map((eId) => [eId]);
            const FC = FV.map((_, fId) => [fId]);
            const CF = FC;
            return { P, CP, SP, SC, CS, SE, FC, CF };
        }

        const added = EV.map(() => false);
        const EV_ = [];
        const EE_map = [];
        for (const fId of faces) {
            for (const e of FE[fId]) {
                if (!added[e]) {
                    added[e] = true;
                    EV_.push(EV[e]);
                    EE_map.push(e);
                }
            }
        }
        const L = EV_.map((vs) => M.expand(vs, Vf));
        const [P, SP, SE_, eps_i] = X.L_2_V_EV_EL(L);
        const SE = SE_.map(es => es.map(e => EE_map[e]));

        const [PP, CP] = X.V_EV_2_VV_FV(P, SP);
        const [SC, CS] = X.EV_FV_2_EF_FE(SP, CP);
        let [CF, FC] = X.EF_FV_P_SP_SE_CP_SC_2_CF_FC(EF, FV, P, SP, SE, CP, SC);

        const n_cells = CF.length;
        const ES = EV.map(() => undefined);
        const VP = Vf.map(() => undefined);
        for (const [fId, eIds] of FE.entries()) {
            if (!faces.has(fId)) {
                const cell_id = CP.length;
                CF.push([fId]);//one to one
                FC[fId] = [cell_id];
                CP.push([]);
                for (const vId of FV[fId]) {
                    let p_id = VP[vId];
                    if (!p_id) {
                        p_id = P.length;
                        VP[vId] = p_id;
                        P.push(Vf[vId]);
                    }
                    CP[cell_id].push(p_id);
                }
                CS[cell_id] = [];
                for (const eId of eIds) {
                    let seg_id = ES[eId];
                    if (!seg_id) {
                        seg_id = SE.length;
                        ES[eId] = seg_id;
                        SE.push([eId]);//one to one
                        SP.push(EV[eId].map((v) => VP[v]));
                        SC.push([cell_id]);
                    }
                    else {
                        SC[seg_id].push(cell_id);
                    }
                    CS[cell_id].push(seg_id);
                }


            }
        }

        return { P, CP, SP, SC, CS, SE, FC, CF, n_cells };
    },


    getSubdivisionTargets: (FOLD, edges, FO, n) => {
        const sccList = SCC.extract(edges, n);

        const cyclicComponents = sccList.filter(scc => scc.length > 1);

        const dismiss = new Set();
        const total_back_edges = new Set();
        for (const scc of cyclicComponents) {
            const bes = SCC.extractBackEdges(edges, n, scc);
            for (const be of bes) {
                total_back_edges.add(be);
            }
        }

        for (const be of total_back_edges) {
            const [f1, f2] = M.decode(edges[be]);
            dismiss.add(f2);
        }

        const smaller_edges = [];
        for (const edge of edges) {
            if (total_back_edges.has(edge)) {
                continue;
            }
            const [f1, f2] = M.decode(edge);
            smaller_edges.push(M.encode([f1, f2]));

        }

        const S = SCC.dfs(smaller_edges, n);

        return { L: { S, cycle: [] }, dismiss };
    },
    dfs: (edges, n) => {
        const Adj = Array(n).fill(0).map(() => []);
        for (const s of edges) {
            const [f1, f2] = M.decode(s);
            Adj[f1].push(f2);
        }

        const S = [];
        const seen = Array(n).fill(false);
        const dfs1 = (i) => {
            if (seen[i]) return;
            seen[i] = true;
            for (const j of Adj[i]) dfs1(j);
            S.push(i);
        };

        for (let i = 0; i < n; ++i) dfs1(i);
        return S.toReversed();
    },
    extractBackEdges: (edges, n, faces = null) => {
        const targetSet = faces ? new Set(faces) : null;

        const Adj = Array(n).fill(0).map(() => []);
        const Adj_map = new Map();
        for (const [ei, s] of edges.entries()) {
            const [f1, f2] = M.decode(s);
            if (targetSet && (!targetSet.has(f1) || !targetSet.has(f2))) continue;
            Adj[f1].push(f2);
            Adj_map.set(M.encode([f1, f2]), ei);
        }

        const state = Array(n).fill(0);
        const backEdges = new Set();

        const dfs = (i) => {
            // 0: not yet, 1: visiting, 2: done
            state[i] = 1;

            for (const j of Adj[i]) {
                if (state[j] === 1) {
                    const key = M.encode([i, j]);
                    backEdges.add(Adj_map.get(key));
                } else if (state[j] === 0) {
                    dfs(j);
                }
            }
            state[i] = 2;
        };

        for (const i of faces) {
            if (state[i] === 0) {
                dfs(i);
            }
        }
        return backEdges;
    },
};