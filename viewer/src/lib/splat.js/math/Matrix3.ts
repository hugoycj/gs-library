class Matrix3 {
    buffer: number[];

    // prettier-ignore
    constructor(n11: number = 1, n12: number = 0, n13: number = 0,
        n21: number = 0, n22: number = 1, n23: number = 0,
        n31: number = 0, n32: number = 0, n33: number = 1) {
        this.buffer = new Array(9);

        this.set(
            n11, n12, n13,
            n21, n22, n23,
            n31, n32, n33
        );
    }

    // prettier-ignore
    set(n11: number, n12: number, n13: number,
        n21: number, n22: number, n23: number,
        n31: number, n32: number, n33: number): Matrix3 {
        const e = this.buffer;

        e[0] = n11; e[1] = n12; e[2] = n13;
        e[3] = n21; e[4] = n22; e[5] = n23;
        e[6] = n31; e[7] = n32; e[8] = n33;

        return this;
    }
}

export { Matrix3 };