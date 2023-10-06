import { error } from "@sveltejs/kit";
import { getScenes } from "$lib/dataLoader";

export async function load({ params }) {
    const scenes = await getScenes();
    const scene = scenes.find((scene: any) => scene.slug === params.slug);

    if (!scene) throw error(404);

    return {
        scene
    };
}