import type { Renderer } from "../core/Renderer";

export class Loader {
    static async LoadAsync(url: string, renderer: Renderer, onProgress?: (progress: number) => void): Promise<void> {
        const req = await fetch(url, {
            mode: "cors",
            credentials: "omit",
        });

        if (req.status != 200) {
            throw new Error(req.status + " Unable to load " + req.url);
        }

        const rowLength = 3 * 4 + 3 * 4 + 4 + 4;
        const reader = req.body!.getReader();
        const contentLength = parseInt(req.headers.get("content-length") as string);
        const splatData = new Uint8Array(contentLength);

        let bytesRead = 0;
        let lastVertexCount = -1;
        let stopLoading = false;

        while (true) {
            const { done, value } = await reader.read();
            if (done) break;
        }
    }
}
