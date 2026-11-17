import { createRenderer } from "./renderer.js";

console.log("OMNIS systems online.");

const OMNIS = {
    name: "OMNIS",
    version: "0.001",
    time: 0,
    paused: true,

    robot: {
        height: 100,
        width: 30,
        depth: 20,
        components: [],
        systems: []
    }
};

const viewport = document.getElementById("viewport");

const world = createRenderer(viewport);

console.log("3D viewport online.");
console.log(OMNIS);
