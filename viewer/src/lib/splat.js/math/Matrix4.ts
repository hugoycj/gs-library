class Matrix4 {
    elements: number[];

    // prettier-ignore
    constructor(n11: number = 1, n12: number = 0, n13: number = 0, n14: number = 0, 
                n21: number = 0, n22: number = 1, n23: number = 0, n24: number = 0, 
                n31: number = 0, n32: number = 0, n33: number = 1, n34: number = 0, 
                n41: number = 0, n42: number = 0, n43: number = 0, n44: number = 1) {
        this.elements = new Array(16);

        this.set(
            n11, n12, n13, n14, 
            n21, n22, n23, n24, 
            n31, n32, n33, n34, 
            n41, n42, n43, n44
        );
    }

    // prettier-ignore
    set(n11: number, n12: number, n13: number, n14: number,
        n21: number, n22: number, n23: number, n24: number,
        n31: number, n32: number, n33: number, n34: number,
        n41: number, n42: number, n43: number, n44: number) : Matrix4 {
        const e = this.elements;

        e[0] = n11; e[4] = n12; e[8] = n13; e[12] = n14;
        e[1] = n21; e[5] = n22; e[9] = n23; e[13] = n24;
        e[2] = n31; e[6] = n32; e[10] = n33; e[14] = n34;
        e[3] = n41; e[7] = n42; e[11] = n43; e[15] = n44;

        return this;
    }
}

export { Matrix4 };
