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
    );
    brandRing.rotation.x = 0.28;
    orbitSystem.add(brandRing);

    const orbitRings = [
        { parent: outerOrbit, radius: 2.75, tilt: 1.48 },
        { parent: innerOrbit, radius: 2.08, tilt: 1.1 }
    ];
    orbitRings.forEach(({ parent, radius, tilt }) => {
        const ring = new THREE.Mesh(
            new THREE.TorusGeometry(radius, 0.012, 8, 128),
            new THREE.MeshBasicMaterial({ color: 0xcda77e, transparent: true, opacity: 0.66 })
        );
        ring.rotation.x = tilt;
        parent.add(ring);
    });

    let productDisplays = [];
    let reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let galleryGeneration = 0;

    function createPlanetTexture() {
        const canvas = document.createElement("canvas");
        canvas.width = 1024;
        canvas.height = 512;
        const context = canvas.getContext("2d");
        const ocean = context.createLinearGradient(0, 0, 0, canvas.height);
        ocean.addColorStop(0, "#2c7880");
        ocean.addColorStop(0.5, "#15515d");
        ocean.addColorStop(1, "#103943");
        context.fillStyle = ocean;
        context.fillRect(0, 0, canvas.width, canvas.height);

        context.strokeStyle = "rgba(221, 196, 157, 0.22)";
        context.lineWidth = 2;
        for (let latitude = -60; latitude <= 60; latitude += 30) {
            const y = canvas.height / 2 - (latitude / 180) * canvas.height;
            context.beginPath();
            context.ellipse(canvas.width / 2, y, canvas.width * 0.49, canvas.height * 0.13, 0, 0, Math.PI * 2);
            context.stroke();
        }
        for (let longitude = 0; longitude < 180; longitude += 30) {
            const x = (longitude / 360) * canvas.width;
            context.beginPath();
            context.ellipse(x, canvas.height / 2, canvas.width * 0.075, canvas.height * 0.48, 0, 0, Math.PI * 2);
            context.stroke();
        }

        context.fillStyle = "#8b9c72";
        const continents = [
            [[155, 132], [210, 94], [288, 106], [324, 150], [286, 183], [258, 232], [220, 216], [185, 175]],
            [[286, 245], [334, 237], [366, 281], [351, 347], [322, 396], [296, 342], [278, 287]],
            [[438, 130], [484, 103], [520, 124], [514, 159], [478, 174], [456, 155]],
            [[457, 177], [520, 170], [553, 214], [536, 275], [500, 339], [468, 305], [447, 236]],
            [[535, 111], [610, 97], [679, 125], [718, 158], [686, 193], [635, 181], [610, 219], [566, 195], [541, 159]],
            [[655, 261], [717, 246], [750, 275], [727, 311], [686, 302]],
            [[784, 191], [832, 176], [860, 201], [847, 233], [808, 224]]
        ];
        continents.forEach(points => {
            context.beginPath();
            context.moveTo(points[0][0], points[0][1]);
            points.slice(1).forEach(point => context.lineTo(point[0], point[1]));
            context.closePath();
            context.fill();
        });

        context.textAlign = "center";
        context.fillStyle = "rgba(246, 224, 190, 0.9)";
        context.font = "600 38px Manrope, sans-serif";
        context.fillText("ZM BEAUTY FRANCE", canvas.width / 2, canvas.height - 42);

        const texture = new THREE.CanvasTexture(canvas);
        texture.colorSpace = THREE.SRGBColorSpace;
        return texture;
    }

    function createSourceTexture(item) {
        const canvas = document.createElement("canvas");
        canvas.width = 512;
        canvas.height = 128;
        const context = canvas.getContext("2d");
        context.fillStyle = "#30252a";
        context.fillRect(0, 0, canvas.width, canvas.height);
        context.strokeStyle = "#d5b58c";
        context.lineWidth = 6;
        context.strokeRect(4, 4, canvas.width - 8, canvas.height - 8);
        context.textAlign = "center";
        context.textBaseline = "middle";
        context.fillStyle = "#f3d9b5";
        context.font = "700 42px 'DM Sans', sans-serif";
        context.fillText(item.source.toUpperCase(), canvas.width / 2, 49);
        context.fillStyle = "#fff8f2";
        context.font = "500 25px 'DM Sans', sans-serif";
        const productName = item.name.length > 24 ? `${item.name.slice(0, 22)}…` : item.name;
        context.fillText(productName, canvas.width / 2, 91);
        const texture = new THREE.CanvasTexture(canvas);
        texture.colorSpace = THREE.SRGBColorSpace;
        return texture;
    }

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
            display.parent?.remove(display);
        });
        productDisplays = [];
    }

    function getGalleryItems() {
        const images = [...mount.querySelectorAll(".hero-film-column img")];
        const uniqueImages = new Map();
        images.forEach(image => {
            const source = image.currentSrc || image.src;
            if (source && !uniqueImages.has(source)) {
                uniqueImages.set(source, {
                    name: image.alt.replace(/^Article : /, ""),
                    source: image.dataset.source || "Local",
                    element: image
                });
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
        const imageMaterial = new THREE.MeshBasicMaterial({ color: 0xffffff, side: THREE.DoubleSide });
        const orbitCounts = [Math.ceil(displayItems.length / 2), Math.floor(displayItems.length / 2)];

        displayItems.forEach((item, index) => {
            const display = new THREE.Group();
            const orbitIndex = index % 2;
            const orbitPosition = Math.floor(index / 2);
            const angle = (orbitPosition / orbitCounts[orbitIndex]) * Math.PI * 2 + orbitIndex * 0.32;
            const frame = new THREE.Mesh(new THREE.BoxGeometry(1.22, 1.82, 0.09), frameMaterial.clone());
            const image = new THREE.Mesh(new THREE.PlaneGeometry(1.08, 1.34), imageMaterial.clone());
            image.position.y = 0.19;
            image.position.z = 0.052;
            const reverseImage = new THREE.Mesh(new THREE.PlaneGeometry(1.08, 1.34), imageMaterial.clone());
            reverseImage.position.y = 0.19;
            reverseImage.position.z = -0.052;
            reverseImage.rotation.y = Math.PI;
            const sourceTexture = createSourceTexture(item);
            const sourceBadge = new THREE.Mesh(
                new THREE.PlaneGeometry(1.08, 0.31),
                new THREE.MeshBasicMaterial({ map: sourceTexture, side: THREE.DoubleSide })
            );
            sourceBadge.position.y = -0.65;
            sourceBadge.position.z = 0.053;
            const reverseBadge = new THREE.Mesh(
                new THREE.PlaneGeometry(1.08, 0.31),
                new THREE.MeshBasicMaterial({ map: sourceTexture, side: THREE.DoubleSide })
            );
            reverseBadge.position.y = -0.65;
            reverseBadge.position.z = -0.053;
            reverseBadge.rotation.y = Math.PI;

            display.add(frame, image, reverseImage, sourceBadge, reverseBadge);
            display.position.set(0, 0, 0);
            display.rotation.y = angle;
            display.userData.angle = angle;
            display.userData.orbitIndex = orbitIndex;
            (orbitIndex === 0 ? outerOrbit : innerOrbit).add(display);
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
        camera.fov = mobile ? 52 : 42;
        camera.position.set(mobile ? 0 : 0.35, mobile ? 0.2 : 0.35, mobile ? 10.2 : 9.6);
        camera.lookAt(mobile ? 0 : 0.7, mobile ? 0.2 : 0.05, 0);
        camera.updateProjectionMatrix();

        orbitSystem.position.set(mobile ? 0 : 2, mobile ? 2.55 : 0.12, 0);
        outerOrbit.scale.setScalar(mobile ? 0.82 : 1);
        innerOrbit.scale.setScalar(mobile ? 0.86 : 1);
        const scale = mobile ? 0.72 : 0.9;
        productDisplays.forEach(display => {
            const angle = display.userData.angle;
            const radius = display.userData.orbitIndex === 0 ? 2.75 : 2.08;
            display.position.set(Math.sin(angle) * radius, display.userData.orbitIndex === 0 ? 0.1 : -0.08, Math.cos(angle) * radius);
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
            outerOrbit.rotation.y += delta * 0.12;
            innerOrbit.rotation.y -= delta * 0.18;
            globe.rotation.y += delta * 0.035;
            brandRing.rotation.y -= delta * 0.09;
        }

        renderer.render(scene, camera);
    }

    updateLayout();
    renderer.domElement.dataset.sceneReady = "true";
    animate();
}
