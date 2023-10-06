import scenes from "$lib/data/scenes.json";
import models from "$lib/data/models.json";

export async function getScenes() {
    return scenes;
}

export async function getModels() {
    return models;
}