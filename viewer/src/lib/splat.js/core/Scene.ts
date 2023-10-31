import { Object3D } from "./Object3D";

class Scene extends Object3D {
    data: Uint8Array;
    vertexCount: number;

    constructor() {
        super();

        this.data = new Uint8Array(0);
        this.vertexCount = 0;
    }

    setData(data: Uint8Array, vertexCount: number): void {
        this.data = data;
        this.vertexCount = vertexCount;
        console.log("setData", vertexCount);
    }
}

export { Scene };
