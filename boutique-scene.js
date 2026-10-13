+
import * as THREE from "https://cdn.jsdelivr.net/npm/three@0.170.0/build/three.module.js";

const mount = document.getElementById("heroFilm");

if (mount) {
    let renderer;

    try {
        renderer = new THREE.WebGLRenderer({
            antialias: true,
            alpha: false,
            powerPreference: "high-performance"

        });
    } catch (error) {
        console.warn("The animated product scene is unavailable in this browser.", error);
    }

    if (renderer) startBoutiqueScene(mount, renderer);
}

function startBoutiqueScene(mount, renderer) {
    const sceneColor = 0x282328;
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(sceneColor);
    scene.fog = new THREE.Fog(sceneColor, 13, 30);

    const camera = new THREE.PerspectiveCamera(43, 1, 0.1, 60);
    const clock = new THREE.Clock();
    renderer.setPixelRatio(Math.min(Math.max(window.devicePixelRatio || 1, 1.5), 2));
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.15;
    renderer.domElement.className = "boutique-canvas";
    renderer.domElement.setAttribute("aria-hidden", "true");

    scene.add(new THREE.HemisphereLight(0xf7e8dc, 0x282328, 2.1));

    const keyLight = new THREE.DirectionalLight(0xffe6cd, 3.2);
    keyLight.position.set(-3, 6, 7);
    scene.add(keyLight);

    const roseLight = new THREE.PointLight(0xc77978, 18, 17, 2);
    roseLight.position.set(3.5, 2.4, 3.5);
    scene.add(roseLight);

    const leafLight = new THREE.PointLight(0x9bab91, 11, 15, 2);
    leafLight.position.set(-3.5, 1.8, -1);
    scene.add(leafLight);

    const orbitSystem = new THREE.Group();
    const outerOrbit = new THREE.Group();
    const innerOrbit = new THREE.Group();
    outerOrbit.rotation.x = 0.48;
    outerOrbit.rotation.z = -0.12;
    innerOrbit.rotation.x = -0.62;
    innerOrbit.rotation.z = 0.16;
    orbitSystem.add(outerOrbit, innerOrbit);
    scene.add(orbitSystem);

    const globeTexture = createPlanetTexture();
    const globe = new THREE.Mesh(
        new THREE.SphereGeometry(0.78, 72, 56),
        new THREE.MeshStandardMaterial({ map: globeTexture, roughness: 0.54, metalness: 0.18 })
    );
    orbitSystem.add(globe);



    const brandRing = new THREE.Mesh(
        new THREE.TorusGeometry(0.92, 0.014, 10, 100),
        new THREE.MeshStandardMaterial({ color: 0xe4bf91, roughness: 0.26, metalness: 0.76 })
