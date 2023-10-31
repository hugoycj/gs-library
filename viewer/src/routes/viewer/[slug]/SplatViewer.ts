import type { IViewer } from "./IViewer";
import * as SPLAT from "$lib/splat.js";

export class SplatViewer implements IViewer {
    renderer: SPLAT.Renderer;

    constructor(canvas: HTMLCanvasElement) {
        this.renderer = new SPLAT.WebGLRenderer(canvas);
    }

    async loadScene(url: string, onProgress?: (progress: number) => void) {
        await SPLAT.Loader.LoadAsync(url, this.renderer, onProgress);
    }

    dispose() {}

    async capture(): Promise<string | null> {
        return null;
    }

    getStats(): { name: string; value: any }[] {
        return [];
    }
}
