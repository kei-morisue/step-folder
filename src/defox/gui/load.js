
export const LOAD = {
    EL: undefined,
    LEN: 30,
    REPORT: undefined,
    STATUS: undefined,
    CURR: 0,

    report: async () => {
        if (LOAD.REPORT) await LOAD.REPORT();
    },
    status: async (stat) => {
        if (LOAD.STATUS) await LOAD.STATUS(stat);
    },
    startup: async () => {
        LOAD.EL = document.getElementById("loading");
        try {
            const response = await fetch('./resources/loading.xml');
            const xml = await response.text();
            LOAD.EL.innerHTML = xml;

        } catch (error) {
            console.error("loading screen loading error", error);
        }
    },
    set: async (total, taskFunction) => {
        const pr = document.getElementById("progress");
        const rem = document.getElementById("remains");
        const stat = document.getElementById("status");

        const t0 = Date.now();
        let t1 = t0;
        LOAD.CURR = 0;

        LOAD.STATUS = async (status) => {
            if (stat) {
                stat.innerHTML = status ?? "UNKNOWN";
                await new Promise(r => setTimeout(r, 1));
            }
        }

        LOAD.REPORT = async () => {
            const current = LOAD.CURR + 1;
            LOAD.CURR = current;
            if (current > total) current = total;
            const pct = total > 0 ? current / total : 0;
            const bars = Math.floor(pct * LOAD.LEN);
            if (pr) {
                pr.innerHTML = "|".repeat(bars) + "-".repeat(LOAD.LEN - bars);
            }
            if (current > 0 && current < total && rem) {
                const t = Date.now() - t0;
                const est_ms = t * (total - current) / current;
                rem.innerHTML = LOAD.time_str(est_ms);
            }
            const now = Date.now();
            if (now - t1 > 16 || current === total) {
                await new Promise(r => setTimeout(r, 0));
                t1 = now;
            }
        }


        try {
            if (pr) pr.innerHTML = "-".repeat(LOAD.LEN);
            if (rem) rem.innerHTML = "estimating...";
            LOAD.start();
            await new Promise(r => requestAnimationFrame(() => setTimeout(r, 0)));
            await taskFunction();
            if (rem) rem.innerHTML = "completed.";
        } catch (error) {
            console.error("task failed:", error);
        } finally {
            LOAD.end();
        }
    },
    start: () => {
        LOAD.EL.style.visibility = "visible";
    },

    end: () => {
        LOAD.EL.style.visibility = "hidden";
        LOAD.REPORT = undefined;
        LOAD.CURR = 0;
        LOAD.STATUS = undefined;
        document.getElementById("progress").innerHTML = "";
        document.getElementById("remains").innerHTML = "";
        document.getElementById("status").innerHTML = "";

    },

    time_str: (msec) => {
        if (msec < 1000) {
            const milli = Math.ceil(msec);
            return `${milli} millisecs`;
        } else if (msec < 60000) {
            const secs = Math.ceil(msec / 1000);
            return `${secs} secs`;
        } else {
            const mins = Math.floor(msec / 60000);
            const secs = Math.ceil((msec - mins * 60000) / 1000);
            return `${mins} mins ${secs} secs`;
        }
    },
}