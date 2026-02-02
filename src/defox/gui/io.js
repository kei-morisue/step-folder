import { PRJ } from "../project.js";
import { IO3 } from "../io.js";


export const GUI_IO = {
    startup: () => {
        document.getElementById("new").onclick = (e) => {
            if (confirm("Are you sure to discard current sequence?")) {
                const input = document.createElement('input');
                input.type = 'file';
                input.accept = 'cp/plain';
                input.multiple = true;
                input.onchange = PRJ.read;
                PRJ.refresh();
                input.click();
            }
        };
        document.getElementById("export").onclick = (e) => {
            const ext = document.getElementById("export_ext").value;
            IO3.write("state3", "step_" + PRJ.current_idx, ext);
        };
        document.getElementById("import0").onclick = PRJ.read;
        document.getElementById("save_proj").onclick = (e) => {
            const pj = document.getElementById("proj_name").value;
            IO3.save(PRJ.steps, pj);
        };
        document.getElementById("import_proj").onclick = PRJ.read_project;

        document.getElementById("remove").onclick = PRJ.remove;
        document.getElementById("duplicate").onclick = PRJ.duplicate;


    },
}