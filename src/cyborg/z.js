import { M } from "../flatfolder/math.js";
import { X } from "../flatfolder/conversion.js";
// import { PAR } from "./parallel.js";

export const Z = {
    get_VK: (EV, EA, V) => {
        const [VV, FV] = X.V_EV_2_VV_FV(V, EV);
        return X.V_VV_EV_EA_2_VK(V, VV, EV, EA);
    },
}