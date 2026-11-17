import * as THREE from "https://cdn.jsdelivr.net/npm/three@0.170.0/build/three.module.js";

export function createRenderer(container) {
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x080b10);

    const camera = new THREE.PerspectiveCamera(
        60,
        container.clientWidth / container.clientHeight,
        0.1,
        1000
    );

    camera.position.set(8, 6, 10);
    camera.lookAt(0, 3, 0);

    const renderer = new THREE.WebGLRenderer({
        antialias: true
    });

    renderer.setSize(
        container.clientWidth,
        container.clientHeight
    );

    container.innerHTML = "";
    container.appendChild(renderer.domElement);

    const light = new THREE.DirectionalLight(0xffffff, 3);
    light.position.set(5, 10, 7);
    scene.add(light);

    scene.add(new THREE.AmbientLight(0xffffff, 1));

    const floor = new THREE.GridHelper(20, 20, 0x334455, 0x1a2633);
    scene.add(floor);

    function animate() {
        requestAnimationFrame(animate);
        renderer.render(scene, camera);
    }

    animate();

    return { scene, camera, renderer };
}
