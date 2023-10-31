export interface IViewer {
    loadScene(url: string, loadingBarCallback?: (progress: number) => void): Promise<void>;
    dispose(): void;
    capture(): Promise<string | null>;
    getStats(): { name: string, value: any }[];
}

export interface ISplatRenderer {
    init(): void;
}