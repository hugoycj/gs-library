import { getModels, getScenes } from "$lib/data/dataLoader";

export async function load({ params }) {
    console.log(params);
    const models = await getModels();
    const scenes = await getScenes();
    
    const selectedScenes = scenes.filter((scene: any) => scene.slug === params.slug);
    const sceneModels = selectedScenes.map((scene: any) => {
        return models.find((model: any) => model.slug === scene.model);
      });
    return {
        models: sceneModels,
        scenes: selectedScenes,
    };
}
