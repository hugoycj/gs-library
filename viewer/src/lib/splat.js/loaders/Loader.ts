import type { Scene } from "../core/Scene";

class Loader {
    static async LoadAsync(url: string, scene: Scene, onProgress?: (progress: number) => void): Promise<void> {
        const req = await fetch(url, {
            mode: "cors",
            credentials: "omit",
        });

        if (req.status != 200) {
            throw new Error(req.status + " Unable to load " + req.url);
        }

        const reader = req.body!.getReader();
        const contentLength = parseInt(req.headers.get("content-length") as string);
        const data = new Uint8Array(contentLength);

        let bytesRead = 0;

        while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            data.set(value, bytesRead);
            bytesRead += value.length;

            onProgress?.(bytesRead / contentLength);
        }

        const rowLength = 3 * 4 + 3 * 4 + 4 + 4;
        const vertexCount = data.length / rowLength;

        scene.setData(data, vertexCount);
    }
}

export { Loader };
