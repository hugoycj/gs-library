<script lang="ts">
    import { onMount } from "svelte";
    import { getScenes } from "$lib/data/dataLoader";
    import placeholderImage from "$lib/placeholder.png";

    let scenes: any[] = [];

    onMount(async () => {
        scenes = await getScenes();
    });

    function handleImageError(event: Event) {
        const image = event.currentTarget as HTMLImageElement;
        image.src = placeholderImage;
    }
</script>

<div class="grid">
    {#each scenes as scene}
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
