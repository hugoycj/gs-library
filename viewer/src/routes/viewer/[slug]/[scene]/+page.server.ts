import { error } from "@sveltejs/kit";
import { getModels, getScenes } from "$lib/data/dataLoader";

export async function load({ params }) {
    const models = await getModels();
    const scenes = await getScenes();

    const model = models.find((model: any) => model.slug === params.slug);
    const modelScenes = scenes.filter((scene: any) => scene.model === params.slug);
    const scene = modelScenes.find((scene: any) => scene.slug === params.scene);
    console.log(scene);
    if (!scene) throw error(404);

    return {
        scene: scene,
        model: model,
    };
}