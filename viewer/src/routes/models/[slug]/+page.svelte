<script lang="ts">
    import placeholderImage from "$lib/placeholder.png";

    export let data: {
        model: {
            title: string;
            paper: string;
        };
        scenes: {
            slug: string;
            title: string;
        }[];
    };

    function handleImageError(event: Event) {
        const image = event.currentTarget as HTMLImageElement;
        image.src = placeholderImage;
    }
</script>

<div class="container">
    <div class="header">{data.model.title}</div>
    <div class="model-container">
        <div class="grid-container">
            <div class="grid">
                {#each data.scenes as scene}
                    <a href={`/viewer/${scene.slug}`} class="grid-item">
                        <img
                            src={`/thumbnails/${scene.slug}.png`}
                            alt={scene.title}
                            class="thumbnail"
                            on:error={(event) => handleImageError(event)}
                        />
                        <div class="title">{scene.title}</div>
                    </a>
                {/each}
            </div>
        </div>
        <div class="model-info">
            <p class="model-header">Info</p>
            <table class="table">
                {#if data.model.paper}
                    <tr>
                        <td>Paper</td>
                        <td><a href={data.model.paper} target="_blank">Link</a></td>
                    </tr>
                {/if}
            </table>
        </div>
    </div>
</div>

<style>
    .model-header {
        padding: 10px;
        font-size: 16px;
        color: #aaa;
        margin: 0;
    }

    .table {
        width: auto;
    }

    .table td {
        margin: 0;
        padding: 10px;
        border-top: 1px solid #333;
        white-space: nowrap;
    }

    .table td:first-child {
        min-width: 128px;
        background-color: #222;
        border-right: 1px solid #333;
        font-size: 16px;
        font-weight: bold;
        color: #aaa;
    }

    .table td:last-child {
        width: 100%;
        font-size: 16px;
    }

    .table a {
        color: #6d90b6;
    }

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

    .model-info {
        border: 1px solid #333;
        box-sizing: border-box;
        width: 100%;
        margin: 10px;

        @media (min-width: 576px) {
            width: 384px;
            margin-top: 0;
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
</style>
