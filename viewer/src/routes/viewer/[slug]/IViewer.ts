export interface IViewer {
    loadScene(url: string, onProgress?: (progress: number) => void): Promise<void>;
    dispose(): void;
    capture(): Promise<string | null>;
    getStats(): { name: string; value: any }[];
}
