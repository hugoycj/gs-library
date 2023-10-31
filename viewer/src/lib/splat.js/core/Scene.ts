import { Object3D } from "./Object3D";

class Scene extends Object3D {
    data: Uint8Array;

    constructor() {
        super();

        this.data = new Uint8Array(0);
    }

    setData(data: Uint8Array): void {
        this.data = data;
        console.log(data);
    }
}

export { Scene };
