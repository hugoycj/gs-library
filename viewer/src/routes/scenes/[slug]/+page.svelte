<script lang="ts">
    import placeholderImage from "$lib/placeholder.png";

    export let data: {
        models: {
            title: string;
            paper: string;
            project: string;
            code: string;
            slug: string;
        }[];
        scenes: {
            slug: string;
            title: string;
        }[];
    };

    function handleImageError(event: Event) {
        const image = event.currentTarget as HTMLImageElement;
        image.src = placeholderImage;
    }

    function goHome() {
        window.location.href = "/";
    }
</script>

<div class="container">
    <div on:pointerdown={goHome} class="banner">
        <h1>3DGS-libary</h1>
        <p>An awesome 3DGS models library</p>
    </div>
    <div class="header">{data.scenes[0].title}</div>
    <div class="model-container">
        <div class="grid-container">
            {#if data.scenes.length > 0}
                <div class="grid">
                    {#each data.scenes as scene, i}
                        {#if i < data.models.length}
                            <a href={`/viewer/${data.models[i].title}/${scene.slug}`} class="grid-item">
                                <img
                                    src={`/scenes/${data.models[i].title}/${scene.slug}/thumbnail.png`}
                                    alt={scene.title}
                                    class="thumbnail"
                                    on:error={(event) => handleImageError(event)}
                                />
                                <div class="title">{data.models[i].title}</div>
                            </a>
                        {/if}
                    {/each}
                </div>
            {:else}
                <div class="grid">
                    <div class="warning">No scenes found</div>
                </div>
            {/if}
        </div>
    </div>
</div>

<style>
    .model-container {
        display: flex;
        flex-wrap: wrap;
        align-items: flex-start;
    }

    .grid-container {
        flex: 1;
        display: flex;
        flex-wrap: wrap;
        justify-content: center;
    }

    .grid {
        margin-top: 10px;
        margin-left: 0;

        @media (min-width: 576px) {
            margin-top: 0;
            margin-left: 10px;
        }
    }

    .grid-item {
        @media (min-width: 576px) {
            width: 100%;
        }

        @media (min-width: 768px) {
            width: calc(50% - 10px);
        }

        @media (min-width: 992px) {
            width: calc(33.333% - 10px);
        }

        @media (min-width: 1200px) {
            width: calc(25% - 10px);
        }
    }

    .warning {
        width: 100%;
        margin-top: 20px;
        text-align: center;
        color: #aaa;
    }
</style>
