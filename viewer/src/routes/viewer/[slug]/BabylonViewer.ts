import type { IViewer } from "./IViewer";
import * as BABYLON from '@babylonjs/core';
import "@babylonjs/loaders/glTF";
import "@babylonjs/loaders/OBJ";

export class BabylonViewer implements IViewer {
    engine: BABYLON.Engine;
    scene: BABYLON.Scene;
    camera: BABYLON.ArcRotateCamera;
    canvas: HTMLCanvasElement;
    triangleCount: number = 0;

    constructor(canvas: HTMLCanvasElement) {
        this.canvas = canvas;

        this.engine = new BABYLON.Engine(canvas, true);

        this.scene = new BABYLON.Scene(this.engine);
        this.scene.clearColor = BABYLON.Color4.FromHexString("#1A1B1EFF");

        this.camera = new BABYLON.ArcRotateCamera("camera", Math.PI / 3, Math.PI / 3, 30, BABYLON.Vector3.Zero(), this.scene);
        this.camera.angularSensibilityY = 1000;
        this.camera.panningSensibility = 500;
        this.camera.wheelPrecision = 5;
        this.camera.inertia = 0.9;
        this.camera.panningInertia = 0.9;
        this.camera.lowerRadiusLimit = 3;
        this.camera.upperRadiusLimit = 100;
        this.camera.setTarget(BABYLON.Vector3.Zero());
        this.camera.attachControl(this.canvas, true);
        this.camera.onAfterCheckInputsObservable.add(() => {
            this.camera.wheelPrecision = 150 / this.camera.radius;
            this.camera.panningSensibility = 10000 / this.camera.radius;
        });

        this.handleResize = this.handleResize.bind(this);
        window.addEventListener("resize", this.handleResize);
    }

    handleResize() {
        this.engine.resize();
    }

    async loadModel(url: string, loadingBarCallback?: (progress: number) => void) {
        // Load scene
        await BABYLON.SceneLoader.AppendAsync("", url, this.scene, (event) => {
            const progress = event.loaded / event.total;
            loadingBarCallback?.(progress);
        });

        // Dispose of all cameras and lights
        this.scene.cameras.forEach((camera) => {
            if (camera !== this.camera) {
                camera.dispose();
            }
        });
        this.scene.lights.forEach((light) => {
            light.dispose();
        });

        // Add lights
        const light = new BABYLON.HemisphericLight("hemi", new BABYLON.Vector3(0, 1, 0), this.scene);
        light.intensity = 1;
        light.diffuse = new BABYLON.Color3(1, 1, 1);
        light.groundColor = new BABYLON.Color3(0.3, 0.3, 0.3);

        const sun = new BABYLON.DirectionalLight("sun", new BABYLON.Vector3(-0.5, -1, -0.5), this.scene);
        sun.intensity = 2;
        sun.diffuse = new BABYLON.Color3(1, 1, 1);

        // Center and scale model
        const parentNode = new BABYLON.TransformNode("parent", this.scene);
        const standardSize = 10;
        let scaleFactor = 1;
        let center = BABYLON.Vector3.Zero();
        if (this.scene.meshes.length > 0) {
            let bounds = this.scene.meshes[0].getBoundingInfo().boundingBox;
            let min = bounds.minimumWorld;
            let max = bounds.maximumWorld;

            for (let i = 1; i < this.scene.meshes.length; i++) {
                bounds = this.scene.meshes[i].getBoundingInfo().boundingBox;
                min = BABYLON.Vector3.Minimize(min, bounds.minimumWorld);
                max = BABYLON.Vector3.Maximize(max, bounds.maximumWorld);
            }

            const extent = max.subtract(min).scale(0.5);
            const size = extent.length();

            center = BABYLON.Vector3.Center(min, max);

            scaleFactor = standardSize / size;
        }
        this.triangleCount = 0;
        this.scene.meshes.forEach((mesh) => {
            mesh.setParent(parentNode);
            if (mesh.getTotalVertices() > 0) {
                this.triangleCount += mesh.getTotalIndices() / 3;
            }
        });
        parentNode.position = center.scale(-1 * scaleFactor);
        parentNode.scaling.scaleInPlace(scaleFactor);

        // Run render loop
        this.engine.runRenderLoop(() => {
            this.scene.render();
        });
    }

    dispose() {
        if (this.scene) {
            this.scene.dispose();
        }
        if (this.engine) {
            this.engine.dispose();
        }
        window.removeEventListener("resize", this.handleResize);
    }

    async capture(): Promise<string | null> {
        if (!this.engine || !this.camera) return null;
        const cachedColor = this.scene.clearColor;
        this.scene.clearColor = BABYLON.Color4.FromHexString("#00000000");
        let data = await new Promise<string>((resolve) => {
            BABYLON.Tools.CreateScreenshotUsingRenderTarget(this.engine, this.camera, 512, (result) => {
                resolve(result);
            });
        });
        this.scene.clearColor = cachedColor;
        return data;
    }

    setRenderMode(mode: string) {
        this.scene.forceWireframe = mode === "wireframe";
    }

    getStats(): { name: string, value: any }[] {
        const fps = this.engine.getFps().toFixed();
        const triangleCount = this.triangleCount.toLocaleString();
        return [
            { name: "FPS", value: fps },
            { name: "Triangles", value: triangleCount },
        ];
    }
}