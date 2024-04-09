<script lang="ts">
    import { activeTab } from "./store.js";
    import ModelsView from "./components/ModelsView.svelte";
    import ScenesView from "./components/ScenesView.svelte";

    function goHome() {
        window.location.href = "/";
    }
</script>

<div class="container">
    <div on:pointerdown={goHome} class="banner">
        <h1>3DGS-libary</h1>
        <p>An awesome 3DGS models library</p>
    </div>
    <div class="tabs">
        <button on:click={() => activeTab.set("Models")} class={$activeTab === "Models" ? "active" : ""}>Models</button>
        <button on:click={() => activeTab.set("Scenes")} class={$activeTab === "Scenes" ? "active" : ""}>Scenes</button>
    </div>
    {#if $activeTab === "Models"}
        <ModelsView />
    {:else}
        <ScenesView />
    {/if}
</div>

<style>
    .tabs {
        display: flex;
        justify-content: left;
        margin-top: 10px;
        margin-bottom: 10px;
        gap: 10px;
        width: 100%;
    }

    .tabs button {
        background-color: #1a1b1e;
        color: #ddd;
        border: none;
        outline: none;
        padding: 10px 10px 10px 10px;
        font-family: "Roboto", sans-serif;
        font-size: 14px;
        font-weight: 600;
        transition: background-color 0.2s ease;
    }

    .tabs button:hover {
        cursor: pointer;
        background-color: #555;
    }

    .tabs button.active {
        background-color: #444;
    }
</style>
