import type { IViewer } from "./IViewer";
import * as SPLAT from "$lib/splat.js";

export class SplatViewer implements IViewer {
    renderer: SPLAT.Renderer;

    constructor() {
        this.renderer = new SPLAT.WebGLRenderer();
    }

    async loadScene(url: string, onProgress?: (progress: number) => void) {}

    dispose() {}

    async capture(): Promise<string | null> {
        return null;
    }

    getStats(): { name: string; value: any }[] {
        return [];
    }
}
