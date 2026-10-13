import * as THREE from "https://cdn.jsdelivr.net/npm/three@0.170.0/build/three.module.js";

const mount = document.getElementById("heroFilm");

if (mount) {
    let renderer;

    try {
        renderer = new THREE.WebGLRenderer({
            antialias: true,
            alpha: false,
            powerPreference: "high-performance",
            preserveDrawingBuffer: true
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
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.75));
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

    const floor = new THREE.Mesh(
        new THREE.PlaneGeometry(80, 80),
        new THREE.MeshStandardMaterial({ color: 0x302a30, roughness: 0.86, metalness: 0.08 })
    );
    floor.rotation.x = -Math.PI / 2;
    floor.position.y = -1.58;
    scene.add(floor);

    const carousel = new THREE.Group();
    scene.add(carousel);

    const platform = new THREE.Mesh(
        new THREE.CylinderGeometry(2.18, 2.3, 0.16, 72),
        new THREE.MeshStandardMaterial({ color: 0x493d42, roughness: 0.38, metalness: 0.62 })
    );
    platform.position.y = -1.45;
    carousel.add(platform);

    const platformTrim = new THREE.Mesh(
        new THREE.TorusGeometry(2.2, 0.025, 10, 96),
        new THREE.MeshStandardMaterial({ color: 0xc49a70, roughness: 0.28, metalness: 0.78 })
    );
    platformTrim.rotation.x = Math.PI / 2;
    platformTrim.position.y = -1.34;
    carousel.add(platformTrim);

    let productDisplays = [];
    let reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let galleryGeneration = 0;

    function disposeDisplays() {
        const disposedTextures = new Set();
        const disposeMaterial = material => {
            if (material.map && !disposedTextures.has(material.map)) {
                material.map.dispose();
                disposedTextures.add(material.map);
            }
            material.dispose();
        };

        productDisplays.forEach(display => {
            display.traverse(object => {
                object.geometry?.dispose();
                if (Array.isArray(object.material)) {
                    object.material.forEach(disposeMaterial);
                } else if (object.material) {
                    disposeMaterial(object.material);
                }
            });
            carousel.remove(display);
        });
        productDisplays = [];
    }

    function getGalleryItems() {
        const images = [...mount.querySelectorAll(".hero-film-column img")];
        const uniqueImages = new Map();
        images.forEach(image => {
            const source = image.currentSrc || image.src;
            if (source && !uniqueImages.has(source)) {
                uniqueImages.set(source, { name: image.alt.replace(/^Article : /, ""), element: image });
            }
        });
        return [...uniqueImages.values()].slice(0, 12);
    }

    function rebuildDisplays() {
        const buildGeneration = ++galleryGeneration;
        disposeDisplays();
        renderer.domElement.dataset.textureCount = "0";
        const galleryItems = getGalleryItems();
        if (!galleryItems.length) return;

        const displayItems = [...galleryItems];
        while (displayItems.length < 6) {
            displayItems.push(galleryItems[displayItems.length % galleryItems.length]);
        }

        const frameMaterial = new THREE.MeshStandardMaterial({ color: 0xb78c68, roughness: 0.3, metalness: 0.72 });
        const supportMaterial = new THREE.MeshStandardMaterial({ color: 0x51444a, roughness: 0.4, metalness: 0.58 });
        const imageMaterial = new THREE.MeshBasicMaterial({ color: 0xffffff, side: THREE.DoubleSide });

        displayItems.forEach((item, index) => {
            const display = new THREE.Group();
            const angle = (index / displayItems.length) * Math.PI * 2;
            const frame = new THREE.Mesh(new THREE.BoxGeometry(1.2, 1.55, 0.09), frameMaterial.clone());
            const image = new THREE.Mesh(new THREE.PlaneGeometry(1.08, 1.39), imageMaterial.clone());
            image.position.z = 0.052;
            const reverseImage = new THREE.Mesh(new THREE.PlaneGeometry(1.08, 1.39), imageMaterial.clone());
            reverseImage.position.z = -0.052;
            reverseImage.rotation.y = Math.PI;

            const stem = new THREE.Mesh(new THREE.BoxGeometry(0.075, 0.68, 0.1), supportMaterial.clone());
            stem.position.y = -1.02;
            const foot = new THREE.Mesh(new THREE.CylinderGeometry(0.29, 0.36, 0.13, 28), supportMaterial.clone());
            foot.position.y = -1.39;

            display.add(frame, image, reverseImage, stem, foot);
            display.position.set(0, 0.08 + Math.sin(angle * 2) * 0.12, 0);
            display.rotation.y = angle;
            display.userData.angle = angle;
            display.userData.baseY = display.position.y;
            carousel.add(display);
            productDisplays.push(display);

            const applyTexture = () => {
                if (buildGeneration !== galleryGeneration || !item.element.naturalWidth) return;
                const texture = new THREE.Texture(item.element);
                texture.colorSpace = THREE.SRGBColorSpace;
                texture.anisotropy = Math.min(4, renderer.capabilities.getMaxAnisotropy());
                texture.needsUpdate = true;
                image.material.map = texture;
                reverseImage.material.map = texture;
                image.material.needsUpdate = true;
                reverseImage.material.needsUpdate = true;
                renderer.domElement.dataset.textureCount = String(Number(renderer.domElement.dataset.textureCount || 0) + 1);
            };

            if (item.element.complete) {
                applyTexture();
            } else {
                item.element.addEventListener("load", applyTexture, { once: true });
            }
        });

        updateLayout();
    }

    function updateLayout() {
        const bounds = mount.getBoundingClientRect();
        if (!bounds.width || !bounds.height) return;

        const mobile = bounds.width < 650;
        camera.aspect = bounds.width / bounds.height;
        camera.fov = mobile ? 58 : 43;
        camera.position.set(mobile ? 0 : 0.3, mobile ? 0.2 : 0.45, mobile ? 8.4 : 8.5);
        camera.lookAt(mobile ? 0 : 0.9, mobile ? -0.55 : 0, 0);
        camera.updateProjectionMatrix();

        carousel.position.set(mobile ? 0 : 1.85, mobile ? 1.15 : 0, 0);
        const radius = mobile ? 1.75 : 2.65;
        const scale = mobile ? 0.72 : 0.98;
        productDisplays.forEach(display => {
            const angle = display.userData.angle;
            display.position.x = Math.sin(angle) * radius;
            display.position.z = Math.cos(angle) * radius;
            display.scale.setScalar(scale);
        });

        renderer.setSize(Math.round(bounds.width), Math.round(bounds.height), false);
        renderer.render(scene, camera);
    }

    rebuildDisplays();
    mount.appendChild(renderer.domElement);
    mount.classList.add("hero-film--3d");

    const resizeObserver = new ResizeObserver(updateLayout);
    resizeObserver.observe(mount);
    window.addEventListener("resize", updateLayout);

    window.addEventListener("storage", event => {
        if (event.key !== "zmProducts") return;
        rebuildDisplays();
    });

    const motionPreference = window.matchMedia("(prefers-reduced-motion: reduce)");
    motionPreference.addEventListener("change", event => {
        reducedMotion = event.matches;
        if (reducedMotion) renderer.render(scene, camera);
    });

    function animate() {
        if (!reducedMotion) requestAnimationFrame(animate);
        const delta = Math.min(clock.getDelta(), 0.05);

        if (!reducedMotion) {
            carousel.rotation.y += delta * 0.12;
        }

        renderer.render(scene, camera);
    }

    updateLayout();
    renderer.domElement.dataset.sceneReady = "true";
    animate();
}
