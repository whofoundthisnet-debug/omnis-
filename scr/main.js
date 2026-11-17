import { createRenderer } from "./renderer.js";

const bootTask = document.getElementById("boot-task");
const bootPercent = document.getElementById("boot-percent");
const progressBar = document.getElementById("progress-bar");
const bootLog = document.getElementById("boot-log");

function log(message) {
    const line = document.createElement("div");
    line.textContent = "> " + message;
    bootLog.appendChild(line);
}

function progress(percent, task) {
    progressBar.style.width = percent + "%";
    bootPercent.textContent = percent + "%";
    bootTask.textContent = task;
}

function wait(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

async function boot() {
    try {
        progress(10, "Loading core...");
        log("Core initialization started.");
        await wait(300);

        progress(30, "Reading robot architecture...");
        log("OMNIS architecture loaded.");
        await wait(300);

        progress(50, "Preparing simulation...");
        log("Simulation engine ready.");
        await wait(300);

        progress(70, "Starting 3D renderer...");
        log("Connecting visual systems.");

        const viewport = document.getElementById("viewport");
        document.getElementById("boot-screen").hidden = true;
        document.getElementById("app").hidden = false;

        createRenderer(viewport);

        progress(100, "OMNIS ONLINE");
        log("3D renderer online.");

    } catch (error) {
        bootTask.textContent = "INITIALIZATION FAILED";
        log(error.message);
        console.error(error);
    }
}

boot();
