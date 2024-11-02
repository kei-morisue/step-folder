import { M } from "../flatfolder/math.js"
export const N = {
    is_inside: (c, vs) => {
        let wind = 0
        let d0 = M.sub(vs[vs.length - 1], c)
        for (let i = 0; i < vs.length; ++i) {
            const d1 = M.sub(vs[i], c)
            const dot = M.dot(d1, d0)
            const cos = dot / M.mag(d1) / M.mag(d0)
            const theta = Math.acos(cos)

            wind = wind + theta
            d0 = d1
        }
        return M.near_zero((wind + 2 * Math.PI) % (2 * Math.PI))
    },
}