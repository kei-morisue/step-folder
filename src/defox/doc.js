export const DOC = {
    process_doc: (e) => {
        if (e.target.files.length == 1) {
            const file_reader = new FileReader();
            file_reader.onload = (e2) => {
                NOTE.clear_log();
                NOTE.start("*** Starting File Import ***");
                const doc = e2.target.result;
                const file_name = e.target.files[0].name;
                const parts = file_name.split(".");
                const type = parts[parts.length - 1].toLowerCase();
                if (type == "cp") {
                    return MAIN.process_cp(doc, file_name)
                }
                if (type == "fold") {
                    return MAIN.process_fold(doc, file_name)
                }
                console.log(`Found file with extension ${type}, FOLD format required`);
                return;
            };
            file_reader.readAsText(e.target.files[0]);
        }


    },
    process_cp: (doc, file_name) => {
        NOTE.time(`Importing from file ${file_name}`);
        [MAIN.FOLD1, MAIN.CELL1] = Y.CP_2_FOLD_CELL(doc, true)
        MAIN.update_states();
    },

    process_fold: (doc, file_name) => {
        NOTE.time(`Importing from file ${file_name}`);
        [MAIN.FOLD0, MAIN.CELL0] = Y.JSON_2_FOLD_CELL(doc);
        MAIN.update_states();
    },


}