export const Pointer = () => {
    let id1;
    let x1;
    let y1;
    let id2;
    let x2;
    let y2;
    
    const add_point = (e) => {
        if (id1 == undefined || id1 == e.pointerId) {
            id1 = e.pointerId;
            x1 = e.clientX;
            y1 = e.clientY;
        } else if (id2 == undefined || id2 == e.pointerId) {
            id2 = e.pointerId;
            x2 = e.clientX;
            y2 = e.clientY;
        }
    }
    
    const count = () => {
        return (id1 != undefined) + (id2 != undefined);
    }
    
    const get_distance = () => {
        if (count() == 2) return Math.sqrt(Math.pow(x1 - x2, 2) + Math.pow(y1 - y2, 2));
        else return 0;
    }
    
    const get_middle = (v1, v2) => {
        switch (count()) {
            case 1:
                return v1;
            case 2:
                return (v1+v2)/2;
            default:
                return 0;
        }
    }
    
    const get_middle_x = () => {
        return get_middle(x1,x2);
    }
    
    const get_middle_y = () => {
        return get_middle(y1,y2);
    }
    
    const has_id = (e) => {
        return id1 == e.pointerId || id2 == e.pointerId;
    }
    
    const clear = () => {
        id1 = undefined;
        x1 = undefined;
        y1 = undefined;
        id2 = undefined;
        x2 = undefined;
        y2 = undefined;
    }
    
    return {
        add_point,
        count,
        get_distance,
        get_middle_x,
        get_middle_y,
        has_id,
        clear
    }
}
