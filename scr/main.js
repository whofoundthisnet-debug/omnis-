
// ==========================================
// OMNIS ENGINE 0.001
// Core construction and world renderer
// ==========================================

const canvas = document.getElementById("world");
const ctx = canvas.getContext("2d");

const status = document.getElementById("system-status");
const countDisplay = document.getElementById("component-count");
const zoomDisplay = document.getElementById("zoom-level");
const coordinates = document.getElementById("coordinates");
const worldStatus = document.getElementById("world-status");
const properties = document.getElementById("property-content");

const TILE = 24;

const MATERIALS = {
    structure: { name: "Structure", color: "#83919c", description: "Structural support component." },
    floor: { name: "Flooring", color: "#a47c54", description: "Basic interior flooring." },
    wall: { name: "Wall", color: "#66717e", description: "Interior wall component." },
    generator: { name: "Generator", color: "#d49a3f", description: "Power generation machinery." },
    pipe: { name: "Pipe", color: "#50a6c5", description: "Fluid transport infrastructure." },
    vent: { name: "Ventilation", color: "#75b6a2", description: "Air circulation infrastructure." },
    habitat: { name: "Habitat", color: "#a68bc9", description: "Living space component." }
};

// World data
const world = new Map();

let activeTool = "structure";
let selectedTile = null;
let hoveredTile = null;
let eraseMode = false;
let inspectMode = false;

let camera = {
    x: 0,
    y: 0,
    zoom: 1
};

let mouse = {
    x: 0,
    y: 0,
    down: false,
    panning: false,
    lastX: 0,
    lastY: 0
};

let spaceDown = false;
let nextId = 1;

// ==========================================
// CANVAS SETUP
// ==========================================

function resizeCanvas() {
    const rect = canvas.getBoundingClientRect();
    const ratio = window.devicePixelRatio || 1;

    canvas.width = Math.round(rect.width * ratio);
    canvas.height = Math.round(rect.height * ratio);

    ctx.setTransform(ratio, 0, 0, ratio, 0, 0);

    render();
}

window.addEventListener("resize", resizeCanvas);

// ==========================================
// WORLD COORDINATES
// ==========================================

function screenToWorld(screenX, screenY) {
    return {
        x: (screenX - camera.x) / camera.zoom,
        y: (screenY - camera.y) / camera.zoom
    };
}

function worldToTile(x, y) {
    return {
        x: Math.floor(x / TILE),
        y: Math.floor(y / TILE)
    };
}

function tileKey(x, y) {
    return `${x},${y}`;
}

function getMousePosition(event) {
    const rect = canvas.getBoundingClientRect();

    return {
        x: event.clientX - rect.left,
        y: event.clientY - rect.top
    };
}

function getHoveredTile() {
    if (!hoveredTile) return null;

    return world.get(tileKey(hoveredTile.x, hoveredTile.y));
}

// ==========================================
// CAMERA
// ==========================================

function zoomAt(screenX, screenY, factor) {
    const before = screenToWorld(screenX, screenY);

    camera.zoom = Math.max(
        0.25,
        Math.min(4, camera.zoom * factor)
    );

    camera.x = screenX - before.x * camera.zoom;
    camera.y = screenY - before.y * camera.zoom;

    updateZoomDisplay();
    render();
}

function updateZoomDisplay() {
    zoomDisplay.textContent =
        Math.round(camera.zoom * 100) + "%";
}

canvas.addEventListener("wheel", event => {
    event.preventDefault();

    const pos = getMousePosition(event);
    const factor = event.deltaY < 0 ? 1.12 : 0.89;

    zoomAt(pos.x, pos.y, factor);
}, { passive: false });

// ==========================================
// RENDERING
// ==========================================

function render() {
    const rect = canvas.getBoundingClientRect();

    const width = rect.width;
    const height = rect.height;

    ctx.clearRect(0, 0, width, height);

    ctx.fillStyle = "#111619";
    ctx.fillRect(0, 0, width, height);

    ctx.save();

    ctx.translate(camera.x, camera.y);
    ctx.scale(camera.zoom, camera.zoom);

    drawGrid(width, height);
    drawTiles();
    drawHover();

    ctx.restore();
}

function drawGrid(width, height) {
    const left = -camera.x / camera.zoom;
    const top = -camera.y / camera.zoom;

    const right = (width - camera.x) / camera.zoom;
    const bottom = (height - camera.y) / camera.zoom;

    const startX = Math.floor(left / TILE);
    const endX = Math.ceil(right / TILE);
    const startY = Math.floor(top / TILE);
    const endY = Math.ceil(bottom / TILE);

    if (camera.zoom >= 0.45) {
        ctx.strokeStyle = "#283238";
        ctx.lineWidth = 1 / camera.zoom;

        ctx.beginPath();

        for (let x = startX; x <= endX; x++) {
            ctx.moveTo(x * TILE, top);
            ctx.lineTo(x * TILE, bottom);
        }

        for (let y = startY; y <= endY; y++) {
            ctx.moveTo(left, y * TILE);
            ctx.lineTo(right, y * TILE);
        }

        ctx.stroke();
    }

    // World origin marker
    ctx.strokeStyle = "#55d6b055";
    ctx.lineWidth = 2 / camera.zoom;

    ctx.beginPath();
    ctx.moveTo(-40, 0);
    ctx.lineTo(40, 0);
    ctx.moveTo(0, -40);
    ctx.lineTo(0, 40);
    ctx.stroke();
}

function drawTiles() {
    for (const tile of world.values()) {
        const x = tile.x * TILE;
        const y = tile.y * TILE;
        const material = MATERIALS[tile.type];

        ctx.fillStyle = material.color;
        ctx.fillRect(x + 1, y + 1, TILE - 2, TILE - 2);

        ctx.fillStyle = "#ffffff20";
        ctx.fillRect(x + 2, y + 2, TILE - 4, 3);

        ctx.fillStyle = "#00000025";
        ctx.fillRect(x + 2, y + TILE - 5, TILE - 4, 3);

        // Pixel-art component details
        if (tile.type === "generator") {
            ctx.fillStyle = "#f6d18a";
            ctx.fillRect(x + 7, y + 7, 10, 10);
            ctx.fillStyle = "#74502a";
            ctx.fillRect(x + 10, y + 10, 4, 4);
        }

        if (tile.type === "pipe") {
            ctx.fillStyle = "#b8e8f5";
            ctx.fillRect(x + 3, y + 9, 18, 6);
        }

        if (tile.type === "vent") {
            ctx.fillStyle = "#d3eee4";
            for (let i = 0; i < 3; i++) {
                ctx.fillRect(x + 6 + i * 5, y + 5, 3, 14);
            }
        }

        if (tile.type === "habitat") {
            ctx.fillStyle = "#e2d2fa";
            ctx.fillRect(x + 7, y + 7, 10, 10);
        }

        if (selectedTile && selectedTile.id === tile.id) {
            ctx.strokeStyle = "#ffffff";
            ctx.lineWidth = 2 / camera.zoom;
            ctx.strokeRect(x + 1, y + 1, TILE - 2, TILE - 2);
        }
    }
}

function drawHover() {
    if (!hoveredTile) return;

    const x = hoveredTile.x * TILE;
    const y = hoveredTile.y * TILE;

    ctx.strokeStyle = eraseMode || inspectMode
        ? "#ffffff"
        : "#55d6b0";

    ctx.lineWidth = 2 / camera.zoom;
    ctx.strokeRect(x + 1, y + 1, TILE - 2, TILE - 2);
}

// ==========================================
// CONSTRUCTION
// ==========================================

function placeTile(x, y) {
    const key = tileKey(x, y);

    if (world.has(key)) return;

    const tile = {
        id: nextId++,
        x,
        y,
        type: activeTool,
        name: MATERIALS[activeTool].name
    };

    world.set(key, tile);

    selectedTile = tile;

    updateProperties();
    updateCount();
    render();
}

function removeTile(x, y) {
    const key = tileKey(x, y);
    const tile = world.get(key);

    if (!tile) return;

    if (selectedTile && selectedTile.id === tile.id) {
        selectedTile = null;
    }

    world.delete(key);

    updateProperties();
    updateCount();
    render();
}

function inspectTile(x, y) {
    const tile = world.get(tileKey(x, y));

    selectedTile = tile || null;

    updateProperties();
    render();
}

function interactWithTile(x, y) {
    if (eraseMode) {
        removeTile(x, y);
        return;
    }

    if (inspectMode) {
        inspectTile(x, y);
        return;
    }

    placeTile(x, y);
}

// ==========================================
// MOUSE INPUT
// ==========================================

canvas.addEventListener("contextmenu", event => {
    event.preventDefault();
});

canvas.addEventListener("mousemove", event => {
    const pos = getMousePosition(event);

    mouse.x = pos.x;
    mouse.y = pos.y;

    if (mouse.panning) {
        camera.x += pos.x - mouse.lastX;
        camera.y += pos.y - mouse.lastY;
    }

    mouse.lastX = pos.x;
    mouse.lastY = pos.y;

    const worldPos = screenToWorld(pos.x, pos.y);
    hoveredTile = worldToTile(worldPos.x, worldPos.y);

    coordinates.textContent =
        `X: ${hoveredTile.x} | Y: ${hoveredTile.y}`;

    render();
});

canvas.addEventListener("mousedown", event => {
    const pos = getMousePosition(event);

    mouse.lastX = pos.x;
    mouse.lastY = pos.y;

   if (event.button === 1 || spaceDown) {
        mouse.panning = true;
        return;
    }

    const worldPos = screenToWorld(pos.x, pos.y);
    const tile = worldToTile(worldPos.x, worldPos.y);

    if (event.button === 2) {
        removeTile(tile.x, tile.y);
        return;
    }

    if (event.button === 0) {
        interactWithTile(tile.x, tile.y);
    }
});

window.addEventListener("mouseup", () => {
    mouse.panning = false;
});

canvas.addEventListener("mouseleave", () => {
    if (!mouse.panning) {
        hoveredTile = null;
        render();
    }
});

canvas.addEventListener("mousedown", event => {
    if (event.button === 2) {
        event.preventDefault();
        const pos = getMousePosition(event);
        const point = screenToWorld(pos.x, pos.y);
        const tile = worldToTile(point.x, point.y);
        removeTile(tile.x, tile.y);
    }
});

// ==========================================
// KEYBOARD
// ==========================================

window.addEventListener("keydown", event => {
    if (event.code === "Space") {
        spaceDown = true;
        event.preventDefault();
    }

    if (event.code === "Escape") {
        eraseMode = false;
        inspectMode = false;
        updateToolButtons();
    }

    if (event.key.toLowerCase() === "e") {
        eraseMode = true;
        inspectMode = false;
        updateToolButtons();
    }

    if (event.key.toLowerCase() === "i") {
        inspectMode = true;
        eraseMode = false;
        updateToolButtons();
    }
});

window.addEventListener("keyup", event => {
    if (event.code === "Space") {
        spaceDown = false;
    }
});

// ==========================================
// TOOLBAR
// ==========================================

function updateToolButtons() {
    document.querySelectorAll(".tool").forEach(button => {
        button.classList.toggle(
            "active",
            !eraseMode &&
            !inspectMode &&
            button.dataset.tool === activeTool
        );
    });

    document.getElementById("erase-btn")
        .classList.toggle("active", eraseMode);

    document.getElementById("inspect-btn")
        .classList.toggle("active", inspectMode);
}

document.querySelectorAll(".tool").forEach(button => {
    button.addEventListener("click", () => {
        activeTool = button.dataset.tool;
        eraseMode = false;
        inspectMode = false;
        updateToolButtons();

        worldStatus.textContent =
            `SELECTED TOOL: ${MATERIALS[activeTool].name.toUpperCase()}`;
    });
});

document.getElementById("erase-btn").addEventListener("click", () => {
    eraseMode = !eraseMode;
    inspectMode = false;
    updateToolButtons();
});

document.getElementById("inspect-btn").addEventListener("click", () => {
    inspectMode = !inspectMode;
    eraseMode = false;
    updateToolButtons();
});

// ==========================================
// PROPERTIES PANEL
// ==========================================

function updateProperties() {
    if (!selectedTile) {
        properties.innerHTML = `
            <div class="empty-selection">
                <span>◇</span>
                <p>Nothing selected</p>
                <small>Select a constructed component to inspect it.</small>
            </div>
        `;
        return;
    }

    const material = MATERIALS[selectedTile.type];

    properties.innerHTML = `
        <div class="property-card">
            <h3>${material.name.toUpperCase()}</h3>
            <p>COMPONENT ID: ${selectedTile.id}</p>
            <p>TYPE: ${selectedTile.type}</p>
            <p>POSITION X: ${selectedTile.x}</p>
            <p>POSITION Y: ${selectedTile.y}</p>
            <p>${material.description}</p>
            <button id="delete-component">REMOVE COMPONENT</button>
        </div>
    `;

    document.getElementById("delete-component")
        .addEventListener("click", () => {
            removeTile(selectedTile.x, selectedTile.y);
        });
}

// ==========================================
// COMPONENT COUNT
// ==========================================

function updateCount() {
    countDisplay.textContent = `COMPONENTS: ${world.size}`;
}

// ==========================================
// SAVE SYSTEM
// ==========================================

function saveWorld() {
    const data = {
        version: 1,
        nextId,
        tiles: Array.from(world.values())
    };

    try {
        localStorage.setItem("OMNIS_WORLD", JSON.stringify(data));

        status.textContent = "PROJECT SAVED";
        worldStatus.textContent = "SAVE COMPLETE";
    } catch (error) {
        status.textContent = "SAVE FAILED";
        console.error(error);
    }
}

function loadWorld() {
    const saved = localStorage.getItem("OMNIS_WORLD");

    if (!saved) {
        status.textContent = "NO SAVE FOUND";
        return;
    }

    try {
        const data = JSON.parse(saved);

        if (!Array.isArray(data.tiles)) {
            throw new Error("Invalid project data");
        }

        world.clear();

        for (const tile of data.tiles) {
            if (
                !Number.isInteger(tile.x) ||
                !Number.isInteger(tile.y) ||
                !MATERIALS[tile.type]
            ) continue;

            world.set(tileKey(tile.x, tile.y), tile);
        }

        nextId = Math.max(
            Number(data.nextId) || 1,
            ...Array.from(world.values(), tile => tile.id + 1),
            1
        );

        selectedTile = null;

        updateProperties();
        updateCount();
        render();

        status.textContent = "PROJECT LOADED";
        worldStatus.textContent = "LOAD COMPLETE";
    } catch (error) {
        status.textContent = "LOAD FAILED";
        console.error(error);
    }
}

document.getElementById("save-btn")
    .addEventListener("click", saveWorld);

document.getElementById("load-btn")
    .addEventListener("click", loadWorld);

document.getElementById("clear-btn")
    .addEventListener("click", () => {
        if (!confirm("Clear the entire constructed world?")) return;

        world.clear();
        selectedTile = null;

        updateProperties();
        updateCount();
        render();

        status.textContent = "WORLD CLEARED";
    });

// ==========================================
// STARTUP
// ==========================================

function initialize() {
    resizeCanvas();
    updateCount();
    updateZoomDisplay();
    updateProperties();

    status.textContent = "SYSTEM ONLINE";
    worldStatus.textContent = "WORLD READY";

    console.log("OMNIS ENGINE 0.001 INITIALIZED");
}

initialize();

