<script lang="ts">
    import { onMount } from "svelte";
    import { getModels, getScenes } from "$lib/dataLoader";
    import placeholderImage from "$lib/placeholder.png";

    let models: any[] = [];
    let sceneMap: any = {};

    onMount(async () => {
        models = await getModels();
        const scenes = await getScenes();
        for (let model of models) {
            for (let scene of scenes) {
                if (scene.model === model.slug) {
                    sceneMap[model.slug] = scene.slug;
                    break;
                }
            }
        }
    });

    function handleImageError(event: Event) {
        const image = event.currentTarget as HTMLImageElement;
        image.src = placeholderImage;
    }
</script>

<div class="grid">
    {#each models as model}
        <a href={`/models/${model.slug}`} class="grid-item">
            <img
                src={`/thumbnails/${sceneMap[model.slug]}.png`}
                alt={model.title}
                class="thumbnail"
                on:error={(event) => handleImageError(event)}
            />
            <div class="title">{model.title}</div>
        </a>
    {/each}
</div>
