import { M } from "../flatfolder/math.js"
import { N } from "../defox/nath.js"


export const K = {
    find_v: (p0, candiadtes, bind_radius, cond = (e) => true) => {
        let min_l = Infinity;
        let idx = -1;
        for (const [i, v] of candiadtes.entries()) {
            if (!cond(v)) {
                continue;
            }
            const l = M.mag(M.sub(p0, v));
            if (min_l > l) {
                min_l = l;
                idx = i;
            }
        }
        if (min_l < bind_radius) {
            return idx;
        }
        return idx;
    },

}