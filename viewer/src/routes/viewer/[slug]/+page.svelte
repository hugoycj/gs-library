<script lang="ts">
    import { onMount, onDestroy } from "svelte";
    import type { IViewer } from "./IViewer";
    import { BabylonViewer } from "./BabylonViewer";
    import { SplatViewer } from "./SplatViewer";

    export let data: {
        scene: {
            title: string;
            model: string;
            type: string;
            url: string;
            prompt: string;
            pipeline: string[];
        };
        model: {
            title: string;
        };
    };

    let stats: { name: string; value: any }[] = [];

    let viewer: IViewer;
    let overlay: HTMLDivElement;
    let container: HTMLDivElement;
    let hudToggleBtn: HTMLButtonElement;
    let canvas: HTMLCanvasElement;
    let loadingBarFill: HTMLDivElement;
    let collapsed = false;

    onMount(initViewer);
    onDestroy(destroyViewer);

    async function initViewer() {
        document.body.classList.add("viewer");
        if (data.scene.type == "mesh") {
            viewer = new BabylonViewer(canvas);
        } else if (data.scene.type == "splat") {
            viewer = new SplatViewer(canvas);
        } else {
            console.error(`Unsupported scene type: ${data.scene.type}`);
        }
        handleMobileView();
        await loadScene(data.scene.url);
        window.addEventListener("resize", () => {
            updateCanvasSize();
        });
        updateStats();
        setInterval(updateStats, 1000);
    }

    function destroyViewer() {
        document.body.classList.remove("viewer");
        viewer.dispose();
    }

    function handleMobileView() {
        const isMobile = window.innerWidth < 768;
        if (isMobile) toggleHUD();
    }

    function toggleHUD() {
        collapsed = !collapsed;
        hudToggleBtn.textContent = collapsed ? ")" : "(";
        if (collapsed) {
            container.classList.remove("hud-expanded");
        } else {
            container.classList.add("hud-expanded");
        }
    }

    function setRenderMode(event: PointerEvent) {
        const babylonViewer = viewer as BabylonViewer;
        if (!babylonViewer) {
            console.error("Can only set render mode for BabylonViewer");
            return;
        }

        document.querySelectorAll(".mode-item").forEach((item) => {
            item.classList.remove("active");
        });

        const modeItem = event.currentTarget as HTMLElement;
        modeItem.classList.add("active");

        const mode = modeItem.dataset.mode as string;
        babylonViewer.setRenderMode(mode);
    }

    async function loadScene(url: string) {
        overlay.style.display = "flex";
        await viewer.loadScene(url, (progress) => {
            loadingBarFill.style.width = `${progress * 100}%`;
        });
        updateCanvasSize();
        overlay.style.display = "none";
    }

    function updateCanvasSize() {
        if (!canvas || !container) return;
        canvas.width = container.clientWidth;
        canvas.height = container.clientHeight;
    }

    async function capture() {
        const data = await viewer.capture();
        if (!data) {
            console.error("Failed to capture screenshot");
            return;
        }
        const a = document.createElement("a");
        a.href = data;
        a.download = "screenshot.png";
        a.click();
    }

    function updateStats() {
        stats = viewer.getStats();
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
    <div class="hud" class:collapsed>
        <button bind:this={hudToggleBtn} on:click={toggleHUD} class="hud-toggle-btn">(</button>
        <div class="section">
            <div class="title">{data.scene.title}</div>
        </div>
        <div class="section">
            <div class="section-title">Model</div>
            <div class="info-panel">
                {#if data.scene.model}
                    <a href={`/models/${data.scene.model}`} class="section-label">{data.model.title}</a>
                    {#if data.scene.pipeline}
                        <ol class="pipeline">
                            {#each data.scene.pipeline as step}
                                <li>{step}</li>
                            {/each}
                        </ol>
                    {/if}
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
        {#if stats.length > 0}
            <div class="section">
                <div class="section-title">Stats</div>
                <div class="info-panel">
                    {#each stats as stat}
                        <div>{stat.name}: {stat.value}</div>
                    {/each}
                </div>
            </div>
        {/if}
        {#if data.scene.type === "mesh"}
            <div class="section">
                <div class="section-title">Render Mode</div>
                <div class="button-group mode-list">
                    <div on:pointerdown={setRenderMode} class="hud-button mode-item active" data-mode="rendered">Rendered</div>
                    <div on:pointerdown={setRenderMode} class="hud-button mode-item" data-mode="wireframe">Wireframe</div>
                </div>
            </div>
        {/if}
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
        padding: 6px 10px 0px 10px;
        color: #ddd;
    }

    .pipeline {
        margin: 0;
        padding: 6px 10px 0px 20px;
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
