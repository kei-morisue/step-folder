import { M } from "../flatfolder/math.js";
import { X } from "../flatfolder/conversion.js";
import { Y } from "../defox/y.js";

// import { PAR } from "./parallel.js";

export const Z = {

    segs_assings_2_FOLD_CELL: (segs, assigns) => {
        const doc = Y.segs_EA_2_CP(segs, assigns, 1.0);
        return Y.CP_2_FOLD_CELL(doc);
    },


    get_VK: (EV, EA, V) => {
        const [VV, FV] = X.V_EV_2_VV_FV(V, EV);
        return X.V_VV_EV_EA_2_VK(V, VV, EV, EA);
    },
}