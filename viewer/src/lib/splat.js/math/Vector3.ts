export class Vector3 {
    x: number;
    y: number;
    z: number;

    constructor(x: number = 0, y: number = 0, z: number = 0) {
        this.x = x;
        this.y = y;
        this.z = z;
    }

    set(x: number, y: number, z: number): Vector3 {
        this.x = x;
        this.y = y;
        this.z = z;

        return this;
    }
}
