<script lang="ts">
    import { onMount, onDestroy } from "svelte";
    import * as BABYLON from "@babylonjs/core";
    import "@babylonjs/loaders/glTF";
    import "@babylonjs/loaders/OBJ";

    export let data: {
        scene: {
            title: string;
            model: string;
            url: string;
            prompt: string;
        };
        model: {
            title: string;
        };
    };

    let overlay: HTMLDivElement | null = null;
    let hud: HTMLDivElement | null = null;
    let hudToggleBtn: HTMLButtonElement | null = null;
    let triangleCount: HTMLSpanElement | null = null;
    let fpsCount: HTMLSpanElement | null = null;
    let engine: BABYLON.Engine | null = null;
    let scene: BABYLON.Scene | null = null;
    let camera: BABYLON.ArcRotateCamera | null = null;
    let container: HTMLDivElement | null = null;
    let canvas: HTMLCanvasElement | null = null;
    let loadingBarFill: HTMLDivElement | null = null;
    let collapsed = false;

    onMount(() => {
        document.body.classList.add("viewer");

        const isMobile = window.innerWidth < 768;
        if (isMobile) {
            collapsed = true;
            hudToggleBtn!.textContent = ")";
            container!.classList.remove("hud-expanded");
        }

        loadModel(data.scene.url);

        hudToggleBtn!.addEventListener("click", () => {
            collapsed = !collapsed;
            hudToggleBtn!.textContent = collapsed ? ")" : "(";
            if (collapsed) {
                container!.classList.remove("hud-expanded");
            } else {
                container!.classList.add("hud-expanded");
            }
        });

        const modeItems = document.querySelectorAll(".mode-item");
        modeItems.forEach((item) => {
            item.addEventListener("click", (event) => {
                const currentTarget = event.currentTarget as HTMLElement;
                const mode = currentTarget.getAttribute("data-mode");

                modeItems.forEach((i) => i.classList.remove("active"));
                currentTarget.classList.add("active");

                switch (mode) {
                    case "wireframe":
                        scene!.forceWireframe = true;
                        break;
                    default:
                        scene!.forceWireframe = false;
                        break;
                }
            });
        });
    });

    onDestroy(() => {
        if (scene) {
            scene.dispose();
            document.body.classList.remove("viewer");
        }
    });

    async function loadModel(url: string) {
        overlay!.style.display = "flex";

        engine = new BABYLON.Engine(canvas, true);

        scene = new BABYLON.Scene(engine);
        scene.clearColor = BABYLON.Color4.FromHexString("#1A1B1EFF");

        await BABYLON.SceneLoader.AppendAsync("", url, scene, (event) => {
            const progress = event.loaded / event.total;
            loadingBarFill!.style.width = `${progress * 100}%`;
        });

        scene.cameras.forEach((camera) => {
            camera.dispose();
        });

        scene.lights.forEach((light) => {
            light.dispose();
        });

        camera = new BABYLON.ArcRotateCamera("camera", Math.PI / 3, Math.PI / 3, 30, BABYLON.Vector3.Zero(), scene);
        camera.angularSensibilityY = 1000;
        camera.panningSensibility = 500;
        camera.wheelPrecision = 5;
        camera.inertia = 0.9;
        camera.panningInertia = 0.9;
        camera.lowerRadiusLimit = 3;
        camera.upperRadiusLimit = 100;
        camera.setTarget(BABYLON.Vector3.Zero());
        camera.attachControl(canvas, true);

        camera.onAfterCheckInputsObservable.add(() => {
            camera!.wheelPrecision = 150 / camera!.radius;
            camera!.panningSensibility = 10000 / camera!.radius;
        });

        const light = new BABYLON.HemisphericLight("hemi", new BABYLON.Vector3(0, 1, 0), scene);
        light.intensity = 1;
        light.diffuse = new BABYLON.Color3(1, 1, 1);
        light.groundColor = new BABYLON.Color3(0.3, 0.3, 0.3);

        const sun = new BABYLON.DirectionalLight("sun", new BABYLON.Vector3(-.5, -1, -.5), scene);
        sun.intensity = 2;
        sun.diffuse = new BABYLON.Color3(1, 1, 1);

        const standardSize = 10;
        let scaleFactor = 1;
        let center = BABYLON.Vector3.Zero();

        if (scene.meshes.length > 0) {
            let bounds = scene.meshes[0].getBoundingInfo().boundingBox;
            let min = bounds.minimumWorld;
            let max = bounds.maximumWorld;

            for (let i = 1; i < scene.meshes.length; i++) {
                bounds = scene.meshes[i].getBoundingInfo().boundingBox;
                min = BABYLON.Vector3.Minimize(min, bounds.minimumWorld);
                max = BABYLON.Vector3.Maximize(max, bounds.maximumWorld);
            }

            const extent = max.subtract(min).scale(0.5);
            const size = extent.length();

            center = BABYLON.Vector3.Center(min, max);

            scaleFactor = standardSize / size;
        }

        const parentNode = new BABYLON.TransformNode("parent", scene);

        let totalTriangles = 0;
        scene.meshes.forEach((mesh) => {
            mesh.setParent(parentNode);
            if (mesh.getTotalVertices() > 0) {
                totalTriangles += mesh.getTotalIndices() / 3;
            }
        });
        triangleCount!.textContent = totalTriangles.toLocaleString();

        parentNode.position = center.scale(-1 * scaleFactor);
        parentNode.scaling.scaleInPlace(scaleFactor);

        engine.runRenderLoop(() => {
            scene!.render();
            if (fpsCount) {
                fpsCount.textContent = engine!.getFps().toFixed();
            }
        });

        window.addEventListener("resize", () => {
            updateCanvasSize();
            engine!.resize();
        });

        updateCanvasSize();
        overlay!.style.display = "none";
    }

    function updateCanvasSize() {
        if (!canvas || !container) return;
        canvas.width = container.clientWidth;
        canvas.height = container.clientHeight;
    }

    function capture() {
        if (!engine || !camera) return;
        const cachedColor = scene!.clearColor;
        scene!.clearColor = BABYLON.Color4.FromHexString("#00000000");
        BABYLON.Tools.CreateScreenshotUsingRenderTarget(engine, camera, 512, (data) => {
            const a = document.createElement("a");
            a.href = data;
            a.download = "screenshot.png";
            a.click();
        });
        scene!.clearColor = cachedColor;
    }

    function exit() {
        window.history.back();
    }
</script>

<div bind:this={container} class="canvas-container hud-expanded">
    <div bind:this={overlay} class="loading-overlay">
        <div class="loading-bar">
            <div bind:this={loadingBarFill} class="loading-bar-fill" />
        </div>
    </div>
    <canvas bind:this={canvas} width="512" height="512" />
    <div class="exit-button" on:pointerdown={exit}>x</div>
    <div bind:this={hud} class="hud" class:collapsed>
        <button bind:this={hudToggleBtn} class="hud-toggle-btn">(</button>
        <div class="section">
            <div class="title">{data.scene.title}</div>
        </div>
        <div class="section">
            <div class="section-title">Model</div>
            <div class="info-panel">
                {#if data.scene.model}
                    <a href={`/models/${data.scene.model}`} class="section-label">{data.model.title}</a>
                {:else}
                    <div class="section-label">None</div>
                {/if}
            </div>
        </div>
        {#if data.scene.prompt}
            <div class="section">
                <div class="section-title">Prompt</div>
                <div class="info-panel">
                    <div class="section-label">{data.scene.prompt}</div>
                </div>
            </div>
        {/if}
        <div class="section">
            <div class="section-title">Stats</div>
            <div class="info-panel">
                <div>FPS: <span bind:this={fpsCount}>0</span></div>
                <div>Triangles: <span bind:this={triangleCount}>0</span></div>
            </div>
        </div>
        <div class="section">
            <div class="section-title">Render Mode</div>
            <div class="button-group mode-list">
                <div class="hud-button mode-item active" data-mode="rendered">Rendered</div>
                <div class="hud-button mode-item" data-mode="wireframe">Wireframe</div>
            </div>
        </div>
        <div class="section">
            <div class="section-title">Actions</div>
            <div class="button-group">
                <div class="hud-button" on:pointerdown={capture}>Capture</div>
            </div>
        </div>
    </div>
</div>

<style>
    .canvas-container {
        position: relative;
        box-sizing: border-box;
        transition: padding-left 0.2s ease;
        display: flex;
        flex-direction: column;
        justify-content: center;
        align-items: center;
        width: 100wh;
        height: 100vh;
        overflow: hidden;
    }

    .canvas-container.hud-expanded {
        padding-left: 256px;
    }

    .loading-overlay {
        position: absolute;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background-color: #1a1b1e;
        display: flex;
        flex-direction: column;
        justify-content: center;
        align-items: center;
        z-index: 100;
        gap: 10px;
    }

    .loading-overlay::before {
        content: "Loading...";
        color: white;
        font-size: 16px;
    }

    .loading-bar {
        position: relative;
        width: 256px;
        height: 20px;
        border: 2px solid #aaa;
        background-color: #1a1b1e;
    }

    .loading-bar-fill {
        position: absolute;
        top: 0;
        left: 0;
        width: 0%;
        height: 100%;
        background-color: #555;
        transition: width 0.2s ease;
    }

    canvas {
        max-width: 100%;
        max-height: 100%;
    }

    canvas:focus {
        outline: none;
    }

    .hud {
        position: absolute;
        top: 0;
        left: 0;
        width: 286px;
        height: 100%;
        box-sizing: border-box;
        font-size: 14px;
        background-color: #1a1b1e;
        box-shadow: 0px 2px 5px rgba(0, 0, 0, 0.3);
        transition: transform 0.2s ease;
        margin: 0;
        padding: 0 30px 0 0;
        overflow-x: hidden;
        overflow-y: auto;

        @media (max-width: 768px) {
            width: 100%;
        }
    }

    .hud-toggle-btn {
        position: absolute;
        right: 0;
        top: 50%;
        transform: translateY(-50%);
        background-color: #1a1b1e;
        border: none;
        color: #aaa;
        font-size: 16px;
        cursor: pointer;
        outline: none;
        width: 29px;
        height: 100%;
        box-sizing: border-box;
        transition: background-color 0.2s ease;
        border-left: 1px solid #444;
    }

    .hud-toggle-btn:hover {
        background-color: #444;
    }

    .hud.collapsed {
        transform: translateX(calc(-100% + 30px));
    }

    .section {
        width: 100%;
        padding: 10px;
        box-sizing: border-box;
    }

    .title {
        font-size: 16px;
        color: #aaa;
        font-weight: bold;
        padding: 4px;
        padding-top: 10px;
    }

    .section-title {
        font-size: 11px;
        font-weight: light;
        text-transform: uppercase;
        color: #aaa;
        width: 100%;
        padding: 4px;
    }

    .section-label {
        font-size: 14px;
        color: #ddd;
    }

    .info-panel {
        padding: 10px 10px 0px 10px;
        color: #ddd;
    }

    .button-group {
        border: none;
        background-color: transparent;
        box-sizing: border-box;
    }

    .hud-button {
        padding: 10px 15px;
        cursor: pointer;
        background-color: #1a1b1e;
        border-bottom: 1px solid #444;
        transition: background-color 0.2s ease;
        box-sizing: border-box;
    }

    .hud-button:last-child {
        border-bottom: none;
    }

    .hud-button:hover {
        background-color: #555;
    }

    .hud-button.active {
        background-color: #444;
        color: white;
    }
</style>
