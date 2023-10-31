import { error } from "@sveltejs/kit";
import { getModels, getScenes } from "$lib/data/dataLoader";

export async function load({ params }) {
    const models = await getModels();
    const scenes = await getScenes();

    const scene = scenes.find((scene: any) => scene.slug === params.slug);
    const model = models.find((model: any) => model.slug === scene!.model);

    if (!scene) throw error(404);

    return {
        scene: scene,
        model: model
    };
}