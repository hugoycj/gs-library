import type { IViewer } from "./IViewer";

class OrbitCamera {
    position: number[];
    rotation: number[];
    fy: number;
    fx: number;
    alpha: number;
    beta: number;
    radius: number;
    target: number[];
    desiredAlpha: number;
    desiredBeta: number;
    desiredRadius: number;
    desiredTarget: number[];
    damping: number;

    minBeta = 5 * Math.PI / 180;
    maxBeta = 85 * Math.PI / 180;
    minZoom = 0.5;
    maxZoom = 30;
    orbitSpeed = 0.005;
    panSpeed = 0.01;
    zoomSpeed = 0.05;

    constructor(alpha = 0, beta = 0, radius = 5, target = [0, 0, 0]) {
        this.position = [0, 0, -radius];
        this.rotation = [
            [1, 0, 0],
            [0, 1, 0],
            [0, 0, 1],
        ].flat();
        this.fx = 1132;
        this.fy = 1132;
        this.alpha = alpha;
        this.beta = beta;
        this.radius = radius;
        this.target = target;
        this.desiredAlpha = alpha;
        this.desiredBeta = beta;
        this.desiredRadius = radius;
        this.desiredTarget = target;
        this.damping = 0.4;
        this.updateCameraPositionAndRotation();
    }

    lerp(start: number, end: number, factor: number) {
        return (1 - factor) * start + factor * end;
    }

    pan(dx: number, dy: number) {
        const right = [this.rotation[0], this.rotation[3], this.rotation[6]];
        const up = [this.rotation[1], this.rotation[4], this.rotation[7]];
        for (let i = 0; i < 3; i++) {
            this.desiredTarget[i] += right[i] * dx + up[i] * dy;
        }
    }

    getZoomNorm(): number {
        return 0.1 + 0.9 * (this.desiredRadius - this.minZoom) / (this.maxZoom - this.minZoom);
    }

    update() {
        this.alpha = this.lerp(this.alpha, this.desiredAlpha, this.damping);
        this.beta = this.lerp(this.beta, this.desiredBeta, this.damping);
        this.radius = this.lerp(this.radius, this.desiredRadius, this.damping);
        for (let i = 0; i < 3; i++) {
            this.target[i] = this.lerp(this.target[i], this.desiredTarget[i], this.damping);
        }
        this.updateCameraPositionAndRotation();
    }

    updateCameraPositionAndRotation() {
        const x = this.target[0] + this.radius * Math.sin(this.alpha) * Math.cos(this.beta);
        const y = this.target[1] - this.radius * Math.sin(this.beta);
        const z = this.target[2] - this.radius * Math.cos(this.alpha) * Math.cos(this.beta);
        this.position = [x, y, z];

        const direction = normalize(subtract(this.target, this.position));
        const eulerAngles = directionToEuler(direction);
        this.rotation = eulerToRotationMatrix(eulerAngles[0], eulerAngles[1], eulerAngles[2]);
    }
}

function directionToEuler(direction: number[]) {
    const x = Math.asin(-direction[1]);
    const y = Math.atan2(direction[0], direction[2]);
    return [x, y, 0];
}

function eulerToRotationMatrix(x: number, y: number, z: number) {
    const cx = Math.cos(x);
    const sx = Math.sin(x);
    const cy = Math.cos(y);
    const sy = Math.sin(y);
    const cz = Math.cos(z);
    const sz = Math.sin(z);

    const rotationMatrix = [
        cy * cz + sy * sx * sz, -cy * sz + sy * sx * cz, sy * cx,
        cx * sz, cx * cz, -sx,
        -sy * cz + cy * sx * sz, sy * sz + cy * sx * cz, cy * cx,
    ]

    return rotationMatrix;
}

function normalize(a: number[]) {
    const len = Math.hypot(...a);
    return a.map((v) => v / len);
}

function subtract(a: number[], b: number[]) {
    return a.map((v, i) => v - b[i]);
}

function getProjectionMatrix(fx: number, fy: number, width: number, height: number) {
    const znear = 0.2;
    const zfar = 200;
    return [
        [(2 * fx) / width, 0, 0, 0],
        [0, -(2 * fy) / height, 0, 0],
        [0, 0, zfar / (zfar - znear), 1],
        [0, 0, -(zfar * znear) / (zfar - znear), 0],
    ].flat();
}

function getViewMatrix(camera: any) {
    const R = camera.rotation.flat();
    const t = camera.position;
    const camToWorld = [
        [R[0], R[1], R[2], 0],
        [R[3], R[4], R[5], 0],
        [R[6], R[7], R[8], 0],
        [
            -t[0] * R[0] - t[1] * R[3] - t[2] * R[6],
            -t[0] * R[1] - t[1] * R[4] - t[2] * R[7],
            -t[0] * R[2] - t[1] * R[5] - t[2] * R[8],
            1,
        ],
    ].flat();
    return camToWorld;
}

function multiply4(a: number[], b: number[]) {
    return [
        b[0] * a[0] + b[1] * a[4] + b[2] * a[8] + b[3] * a[12],
        b[0] * a[1] + b[1] * a[5] + b[2] * a[9] + b[3] * a[13],
        b[0] * a[2] + b[1] * a[6] + b[2] * a[10] + b[3] * a[14],
        b[0] * a[3] + b[1] * a[7] + b[2] * a[11] + b[3] * a[15],
        b[4] * a[0] + b[5] * a[4] + b[6] * a[8] + b[7] * a[12],
        b[4] * a[1] + b[5] * a[5] + b[6] * a[9] + b[7] * a[13],
        b[4] * a[2] + b[5] * a[6] + b[6] * a[10] + b[7] * a[14],
        b[4] * a[3] + b[5] * a[7] + b[6] * a[11] + b[7] * a[15],
        b[8] * a[0] + b[9] * a[4] + b[10] * a[8] + b[11] * a[12],
        b[8] * a[1] + b[9] * a[5] + b[10] * a[9] + b[11] * a[13],
        b[8] * a[2] + b[9] * a[6] + b[10] * a[10] + b[11] * a[14],
        b[8] * a[3] + b[9] * a[7] + b[10] * a[11] + b[11] * a[15],
        b[12] * a[0] + b[13] * a[4] + b[14] * a[8] + b[15] * a[12],
        b[12] * a[1] + b[13] * a[5] + b[14] * a[9] + b[15] * a[13],
        b[12] * a[2] + b[13] * a[6] + b[14] * a[10] + b[15] * a[14],
        b[12] * a[3] + b[13] * a[7] + b[14] * a[11] + b[15] * a[15],
    ];
}

function createWorker(self: Worker) {
    let buffer: ArrayBuffer;
    let vertexCount = 0;
    let viewProj: Float32Array;
    // 6*4 + 4 + 4 = 8*4
    // XYZ - Position (Float32)
    // XYZ - Scale (Float32)
    // RGBA - colors (uint8)
    // IJKL - quaternion/rot (uint8)
    const rowLength = 3 * 4 + 3 * 4 + 4 + 4;
    let depthIndex = new Uint32Array();

    function processPlyBuffer(inputBuffer: ArrayBuffer) {
        const ubuf = new Uint8Array(inputBuffer);
        // 10KB ought to be enough for a header...
        const header = new TextDecoder().decode(ubuf.slice(0, 1024 * 10));
        const header_end = "end_header\n";
        const header_end_index = header.indexOf(header_end);
        if (header_end_index < 0)
            throw new Error("Unable to read .ply file header");
        const vertexCount = parseInt(/element vertex (\d+)\n/.exec(header)![1]);
        console.log("Vertex Count", vertexCount);
        let row_offset: number = 0;
        let offsets: { [key: string]: number } = {};
        let types: { [key: string]: string } = {};
        const TYPE_MAP: { [key: string]: string } = {
            double: "getFloat64",
            int: "getInt32",
            uint: "getUint32",
            float: "getFloat32",
            short: "getInt16",
            ushort: "getUint16",
            uchar: "getUint8",
        };
        for (let prop of header
            .slice(0, header_end_index)
            .split("\n")
            .filter((k) => k.startsWith("property "))) {
            const [_p, type, name] = prop.split(" ");
            const arrayType = TYPE_MAP[type] || "getInt8";
            types[name] = arrayType;
            offsets[name] = row_offset;
            row_offset += parseInt(arrayType.replace(/[^\d]/g, "")) / 8;
        }

        let dataView = new DataView(
            inputBuffer,
            header_end_index + header_end.length,
        );
        let row: number = 0;
        const attrs: any = new Proxy(
            {},
            {
                get(_target, prop: string) {
                    if (!types[prop]) throw new Error(prop + " not found");
                    const type = types[prop] as keyof DataView;
                    const dataViewMethod = dataView[type] as any;
                    return dataViewMethod(
                        row * row_offset + offsets[prop],
                        true,
                    );
                },
            },
        );

        // 6*4 + 4 + 4 = 8*4
        // XYZ - Position (Float32)
        // XYZ - Scale (Float32)
        // RGBA - colors (uint8)
        // IJKL - quaternion/rot (uint8)
        const rowLength = 3 * 4 + 3 * 4 + 4 + 4;
        const buffer = new ArrayBuffer(rowLength * vertexCount);

        for (let j = 0; j < vertexCount; j++) {
            row = j;

            const position = new Float32Array(buffer, j * rowLength, 3);
            const scales = new Float32Array(buffer, j * rowLength + 4 * 3, 3);
            const rgba = new Uint8ClampedArray(
                buffer,
                j * rowLength + 4 * 3 + 4 * 3,
                4,
            );
            const rot = new Uint8ClampedArray(
                buffer,
                j * rowLength + 4 * 3 + 4 * 3 + 4,
                4,
            );

            if (types["scale_0"]) {
                const qlen = Math.sqrt(
                    attrs.rot_0 ** 2 +
                    attrs.rot_1 ** 2 +
                    attrs.rot_2 ** 2 +
                    attrs.rot_3 ** 2,
                );

                rot[0] = (attrs.rot_0 / qlen) * 128 + 128;
                rot[1] = (attrs.rot_1 / qlen) * 128 + 128;
                rot[2] = (attrs.rot_2 / qlen) * 128 + 128;
                rot[3] = (attrs.rot_3 / qlen) * 128 + 128;

                scales[0] = Math.exp(attrs.scale_0);
                scales[1] = Math.exp(attrs.scale_1);
                scales[2] = Math.exp(attrs.scale_2);
            } else {
                scales[0] = 0.01;
                scales[1] = 0.01;
                scales[2] = 0.01;

                rot[0] = 255;
                rot[1] = 0;
                rot[2] = 0;
                rot[3] = 0;
            }

            position[0] = attrs.x;
            position[1] = attrs.y;
            position[2] = attrs.z;

            if (types["f_dc_0"]) {
                const SH_C0 = 0.28209479177387814;
                rgba[0] = (0.5 + SH_C0 * attrs.f_dc_0) * 255;
                rgba[1] = (0.5 + SH_C0 * attrs.f_dc_1) * 255;
                rgba[2] = (0.5 + SH_C0 * attrs.f_dc_2) * 255;
            } else {
                rgba[0] = attrs.red;
                rgba[1] = attrs.green;
                rgba[2] = attrs.blue;
            }
            if (types["opacity"]) {
                rgba[3] = (1 / (1 + Math.exp(-attrs.opacity))) * 255;
            } else {
                rgba[3] = 255;
            }
        }
        return buffer;
    }

    const runSort = (viewProj: Float32Array) => {
        if (!buffer) return;

        const f_buffer = new Float32Array(buffer);
        const u_buffer = new Uint8Array(buffer);

        const covA = new Float32Array(3 * vertexCount);
        const covB = new Float32Array(3 * vertexCount);

        const center = new Float32Array(3 * vertexCount);
        const color = new Float32Array(4 * vertexCount);

        let maxDepth = -Infinity;
        let minDepth = Infinity;
        let sizeList = new Int32Array(vertexCount);
        for (let i = 0; i < vertexCount; i++) {
            let depth =
                ((viewProj[2] * f_buffer[8 * i + 0] +
                    viewProj[6] * f_buffer[8 * i + 1] +
                    viewProj[10] * f_buffer[8 * i + 2]) *
                    4096) |
                0;
            sizeList[i] = depth;
            if (depth > maxDepth) maxDepth = depth;
            if (depth < minDepth) minDepth = depth;
        }

        // This is a 16 bit single-pass counting sort
        let depthInv = (256 * 256) / (maxDepth - minDepth);
        let counts0 = new Uint32Array(256 * 256);
        for (let i = 0; i < vertexCount; i++) {
            sizeList[i] = ((sizeList[i] - minDepth) * depthInv) | 0;
            counts0[sizeList[i]]++;
        }
        let starts0 = new Uint32Array(256 * 256);
        for (let i = 1; i < 256 * 256; i++) starts0[i] = starts0[i - 1] + counts0[i - 1];
        depthIndex = new Uint32Array(vertexCount);
        for (let i = 0; i < vertexCount; i++) depthIndex[starts0[sizeList[i]]++] = i;


        for (let j = 0; j < vertexCount; j++) {
            const i = depthIndex[j];

            center[3 * j + 0] = f_buffer[8 * i + 0];
            center[3 * j + 1] = f_buffer[8 * i + 1];
            center[3 * j + 2] = f_buffer[8 * i + 2];

            color[4 * j + 0] = u_buffer[32 * i + 24 + 0] / 255;
            color[4 * j + 1] = u_buffer[32 * i + 24 + 1] / 255;
            color[4 * j + 2] = u_buffer[32 * i + 24 + 2] / 255;
            color[4 * j + 3] = u_buffer[32 * i + 24 + 3] / 255;

            let scale = [
                f_buffer[8 * i + 3 + 0],
                f_buffer[8 * i + 3 + 1],
                f_buffer[8 * i + 3 + 2],
            ];
            let rot = [
                (u_buffer[32 * i + 28 + 0] - 128) / 128,
                (u_buffer[32 * i + 28 + 1] - 128) / 128,
                (u_buffer[32 * i + 28 + 2] - 128) / 128,
                (u_buffer[32 * i + 28 + 3] - 128) / 128,
            ];

            const R = [
                1.0 - 2.0 * (rot[2] * rot[2] + rot[3] * rot[3]),
                2.0 * (rot[1] * rot[2] + rot[0] * rot[3]),
                2.0 * (rot[1] * rot[3] - rot[0] * rot[2]),

                2.0 * (rot[1] * rot[2] - rot[0] * rot[3]),
                1.0 - 2.0 * (rot[1] * rot[1] + rot[3] * rot[3]),
                2.0 * (rot[2] * rot[3] + rot[0] * rot[1]),

                2.0 * (rot[1] * rot[3] + rot[0] * rot[2]),
                2.0 * (rot[2] * rot[3] - rot[0] * rot[1]),
                1.0 - 2.0 * (rot[1] * rot[1] + rot[2] * rot[2]),
            ];

            // Compute the matrix product of S and R (M = S * R)
            const M = [
                scale[0] * R[0],
                scale[0] * R[1],
                scale[0] * R[2],
                scale[1] * R[3],
                scale[1] * R[4],
                scale[1] * R[5],
                scale[2] * R[6],
                scale[2] * R[7],
                scale[2] * R[8],
            ];

            covA[3 * j + 0] = M[0] * M[0] + M[3] * M[3] + M[6] * M[6];
            covA[3 * j + 1] = M[0] * M[1] + M[3] * M[4] + M[6] * M[7];
            covA[3 * j + 2] = M[0] * M[2] + M[3] * M[5] + M[6] * M[8];
            covB[3 * j + 0] = M[1] * M[1] + M[4] * M[4] + M[7] * M[7];
            covB[3 * j + 1] = M[1] * M[2] + M[4] * M[5] + M[7] * M[8];
            covB[3 * j + 2] = M[2] * M[2] + M[5] * M[5] + M[8] * M[8];
        }

        self.postMessage({ covA, center, color, covB, viewProj }, [
            covA.buffer,
            center.buffer,
            color.buffer,
            covB.buffer,
        ]);
    };

    const throttledSort = () => {
        if (!sortRunning) {
            sortRunning = true;
            let lastView = viewProj;
            runSort(lastView);
            setTimeout(() => {
                sortRunning = false;
                if (lastView !== viewProj) {
                    throttledSort();
                }
            }, 0);
        }
    };

    let sortRunning: boolean = false;
    self.onmessage = (e) => {
        if (e.data.ply) {
            vertexCount = 0;
            runSort(viewProj);
            buffer = processPlyBuffer(e.data.ply);
            vertexCount = Math.floor(buffer.byteLength / rowLength);
            postMessage({ buffer: buffer });
        } else if (e.data.buffer) {
            buffer = e.data.buffer;
            vertexCount = e.data.vertexCount;
        } else if (e.data.vertexCount) {
            vertexCount = e.data.vertexCount;
        } else if (e.data.view) {
            viewProj = e.data.view;
            throttledSort();
        }
    };
}

function preventDefault(e: Event) {
    e.preventDefault();
    e.stopPropagation();
};

const vertexShaderSource = `
    precision mediump float;
    attribute vec2 position;

    attribute vec4 color;
    attribute vec3 center;
    attribute vec3 covA;
    attribute vec3 covB;

    uniform mat4 projection, view;
    uniform vec2 focal;
    uniform vec2 viewport;

    varying vec4 vColor;
    varying vec2 vPosition;

    mat3 transpose(mat3 m) {
        return mat3(
            m[0][0], m[1][0], m[2][0],
            m[0][1], m[1][1], m[2][1],
            m[0][2], m[1][2], m[2][2]
        );
    }

    void main () {
        vec4 camspace = view * vec4(center, 1);
		vec4 pos2d = projection * camspace;

    	float bounds = 1.2 * pos2d.w;
    	if (pos2d.z < -pos2d.w || pos2d.x < -bounds || pos2d.x > bounds
		   || pos2d.y < -bounds || pos2d.y > bounds) {
            gl_Position = vec4(0.0, 0.0, 2.0, 1.0);
            return;
    	}

    	mat3 Vrk = mat3(
        	covA.x, covA.y, covA.z, 
        	covA.y, covB.x, covB.y,
        	covA.z, covB.y, covB.z
    	);
	
		mat3 J = mat3(
			focal.x / camspace.z, 0., -(focal.x * camspace.x) / (camspace.z * camspace.z), 
			0., -focal.y / camspace.z, (focal.y * camspace.y) / (camspace.z * camspace.z), 
			0., 0., 0.
		);

		mat3 W = transpose(mat3(view));
		mat3 T = W * J;
		mat3 cov = transpose(T) * Vrk * T;
		
		vec2 vCenter = vec2(pos2d) / pos2d.w;

		float diagonal1 = cov[0][0] + 0.3;
		float offDiagonal = cov[0][1];
		float diagonal2 = cov[1][1] + 0.3;

		float mid = 0.5 * (diagonal1 + diagonal2);
		float radius = length(vec2((diagonal1 - diagonal2) / 2.0, offDiagonal));
		float lambda1 = mid + radius;
		float lambda2 = max(mid - radius, 0.1);
		vec2 diagonalVector = normalize(vec2(offDiagonal, lambda1 - diagonal1));
		vec2 v1 = min(sqrt(2.0 * lambda1), 1024.0) * diagonalVector;
		vec2 v2 = min(sqrt(2.0 * lambda2), 1024.0) * vec2(diagonalVector.y, -diagonalVector.x);

		vColor = color;
		vPosition = position;

		gl_Position = vec4(
			vCenter 
			+ position.x * v1 / viewport * 2.0 
			+ position.y * v2 / viewport * 2.0, 0.0, 1.0
		);
  	}
`;

const fragmentShaderSource = `
    precision mediump float;

    varying vec4 vColor;
    varying vec2 vPosition;

    void main () {    
	    float A = -dot(vPosition, vPosition);
        if (A < -4.0) discard;
        float B = exp(A) * vColor.a;
        gl_FragColor = vec4(B * vColor.rgb, B);
    }
`;

export class SplatViewer implements IViewer {
    canvas: HTMLCanvasElement;
    gl: WebGLRenderingContext;
    ext: ANGLE_instanced_arrays;
    camera: OrbitCamera;

    splatData: Uint8Array;
    vertexCount: number;
    worker: Worker;

    vertexShader: WebGLShader;
    fragmentShader: WebGLShader;
    program: WebGLProgram;
    a_position: number;
    a_center: number;
    a_color: number;
    a_covA: number;
    a_covB: number;
    vertexBuffer: WebGLBuffer | null;
    centerBuffer: WebGLBuffer | null;
    colorBuffer: WebGLBuffer | null;
    covABuffer: WebGLBuffer | null;
    covBBuffer: WebGLBuffer | null;

    dragging = false;
    panning = false;
    lastX: number = 0;
    lastY: number = 0;

    animationFrameId: number | null = null;
    disposed: boolean = false;

    constructor(canvas: HTMLCanvasElement) {
        this.disposed = false;
        this.canvas = canvas;
        this.gl = this.initWebGL();
        this.ext = this.gl.getExtension("ANGLE_instanced_arrays") as ANGLE_instanced_arrays;
        this.camera = new OrbitCamera();

        this.splatData = new Uint8Array();
        this.vertexCount = 0;

        this.worker = new Worker(
            URL.createObjectURL(
                new Blob(["(", createWorker.toString(), ")(self)"], {
                    type: "application/javascript",
                }),
            ),
        );

        this.canvas.width = innerWidth;
        this.canvas.height = innerHeight;
        this.gl.viewport(0, 0, this.canvas.width, this.canvas.height);

        let projectionMatrix = getProjectionMatrix(
            this.camera.fx,
            this.camera.fy,
            this.canvas.width,
            this.canvas.height,
        );

        let viewMatrix = getViewMatrix(this.camera);

        this.vertexShader = this.gl.createShader(this.gl.VERTEX_SHADER) as WebGLShader;
        this.gl.shaderSource(this.vertexShader, vertexShaderSource);
        this.gl.compileShader(this.vertexShader);
        if (!this.gl.getShaderParameter(this.vertexShader, this.gl.COMPILE_STATUS)) {
            console.error(this.gl.getShaderInfoLog(this.vertexShader));
        }

        this.fragmentShader = this.gl.createShader(this.gl.FRAGMENT_SHADER) as WebGLShader;
        this.gl.shaderSource(this.fragmentShader, fragmentShaderSource);
        this.gl.compileShader(this.fragmentShader);
        if (!this.gl.getShaderParameter(this.fragmentShader, this.gl.COMPILE_STATUS)) {
            console.error(this.gl.getShaderInfoLog(this.fragmentShader));
        }

        this.program = this.gl.createProgram() as WebGLProgram;
        this.gl.attachShader(this.program, this.vertexShader);
        this.gl.attachShader(this.program, this.fragmentShader);
        this.gl.linkProgram(this.program);
        this.gl.useProgram(this.program);

        if (!this.gl.getProgramParameter(this.program, this.gl.LINK_STATUS)) {
            console.error(this.gl.getProgramInfoLog(this.program));
        }

        this.gl.disable(this.gl.DEPTH_TEST); // Disable depth testing

        // Enable blending
        this.gl.enable(this.gl.BLEND);

        // Set blending function
        this.gl.blendFuncSeparate(
            this.gl.ONE_MINUS_DST_ALPHA,
            this.gl.ONE,
            this.gl.ONE_MINUS_DST_ALPHA,
            this.gl.ONE,
        );

        // Set blending equation
        this.gl.blendEquationSeparate(this.gl.FUNC_ADD, this.gl.FUNC_ADD);

        // projection
        const u_projection = this.gl.getUniformLocation(this.program, "projection");
        this.gl.uniformMatrix4fv(u_projection, false, projectionMatrix);

        // viewport
        const u_viewport = this.gl.getUniformLocation(this.program, "viewport");
        this.gl.uniform2fv(u_viewport, new Float32Array([this.canvas.width, this.canvas.height]));

        // focal
        const u_focal = this.gl.getUniformLocation(this.program, "focal");
        this.gl.uniform2fv(
            u_focal,
            new Float32Array([this.camera.fx, this.camera.fy]),
        );

        // view
        const u_view = this.gl.getUniformLocation(this.program, "view");
        this.gl.uniformMatrix4fv(u_view, false, viewMatrix);

        // positions
        const triangleVertices = new Float32Array([-2, -2, 2, -2, 2, 2, -2, 2]);
        this.vertexBuffer = this.gl.createBuffer();
        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.vertexBuffer);
        this.gl.bufferData(this.gl.ARRAY_BUFFER, triangleVertices, this.gl.STATIC_DRAW);
        this.a_position = this.gl.getAttribLocation(this.program, "position");
        this.gl.enableVertexAttribArray(this.a_position);
        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.vertexBuffer);
        this.gl.vertexAttribPointer(this.a_position, 2, this.gl.FLOAT, false, 0, 0);

        // center
        this.centerBuffer = this.gl.createBuffer();
        this.a_center = this.gl.getAttribLocation(this.program, "center");
        this.gl.enableVertexAttribArray(this.a_center);
        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.centerBuffer);
        this.gl.vertexAttribPointer(this.a_center, 3, this.gl.FLOAT, false, 0, 0);
        this.ext.vertexAttribDivisorANGLE(this.a_center, 1); // Use the extension here

        // color
        this.colorBuffer = this.gl.createBuffer();
        this.a_color = this.gl.getAttribLocation(this.program, "color");
        this.gl.enableVertexAttribArray(this.a_color);
        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.colorBuffer);
        this.gl.vertexAttribPointer(this.a_color, 4, this.gl.FLOAT, false, 0, 0);
        this.ext.vertexAttribDivisorANGLE(this.a_color, 1); // Use the extension here

        // cov
        this.covABuffer = this.gl.createBuffer();
        this.a_covA = this.gl.getAttribLocation(this.program, "covA");
        this.gl.enableVertexAttribArray(this.a_covA);
        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.covABuffer);
        this.gl.vertexAttribPointer(this.a_covA, 3, this.gl.FLOAT, false, 0, 0);
        this.ext.vertexAttribDivisorANGLE(this.a_covA, 1); // Use the extension here

        this.covBBuffer = this.gl.createBuffer();
        this.a_covB = this.gl.getAttribLocation(this.program, "covB");
        this.gl.enableVertexAttribArray(this.a_covB);
        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.covBBuffer);
        this.gl.vertexAttribPointer(this.a_covB, 3, this.gl.FLOAT, false, 0, 0);
        this.ext.vertexAttribDivisorANGLE(this.a_covB, 1); // Use the extension here

        this.worker.onmessage = (e) => {
            if (e.data.buffer) {
                this.splatData = new Uint8Array(e.data.buffer);
                const blob = new Blob([this.splatData.buffer], {
                    type: "application/octet-stream",
                });
                const link = document.createElement("a");
                link.download = "model.splat";
                link.href = URL.createObjectURL(blob);
                document.body.appendChild(link);
                link.click();
            } else {
                let { covA, covB, center, color } = e.data;
                vertexCount = center.length / 3;

                this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.centerBuffer);
                this.gl.bufferData(this.gl.ARRAY_BUFFER, center, this.gl.DYNAMIC_DRAW);

                this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.colorBuffer);
                this.gl.bufferData(this.gl.ARRAY_BUFFER, color, this.gl.DYNAMIC_DRAW);

                this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.covABuffer);
                this.gl.bufferData(this.gl.ARRAY_BUFFER, covA, this.gl.DYNAMIC_DRAW);

                this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.covBBuffer);
                this.gl.bufferData(this.gl.ARRAY_BUFFER, covB, this.gl.DYNAMIC_DRAW);
            }
        };

        let vertexCount = 0;

        const frame = () => {
            this.camera.update();
            viewMatrix = getViewMatrix(this.camera);

            const viewProj = multiply4(projectionMatrix, viewMatrix);
            this.worker.postMessage({ view: viewProj });

            if (vertexCount > 0) {
                this.gl.uniformMatrix4fv(u_view, false, viewMatrix);
                this.ext.drawArraysInstancedANGLE(this.gl.TRIANGLE_FAN, 0, 4, vertexCount);
            } else {
                this.gl.clear(this.gl.COLOR_BUFFER_BIT);
            }

            if (!this.disposed) {
                this.animationFrameId = requestAnimationFrame(frame);
            }
        };

        this.animationFrameId = requestAnimationFrame(frame);

        document.addEventListener("dragenter", preventDefault);
        document.addEventListener("dragover", preventDefault);
        document.addEventListener("dragleave", preventDefault);
        document.addEventListener("contextmenu", preventDefault);

        this.handleMouseDown = this.handleMouseDown.bind(this);
        this.handleMouseUp = this.handleMouseUp.bind(this);
        this.handleMouseMove = this.handleMouseMove.bind(this);
        this.handleMouseWheel = this.handleMouseWheel.bind(this);
        this.handleDrop = this.handleDrop.bind(this);
        this.handleResize = this.handleResize.bind(this);

        this.canvas.addEventListener("mousedown", this.handleMouseDown);
        this.canvas.addEventListener("mouseup", this.handleMouseUp);
        this.canvas.addEventListener("mousemove", this.handleMouseMove);
        this.canvas.addEventListener("wheel", this.handleMouseWheel);
        this.canvas.addEventListener("drop", this.handleDrop);

        window.addEventListener("resize", this.handleResize);
    }

    initWebGL(): WebGLRenderingContext {
        const gl = this.canvas.getContext('webgl') || this.canvas.getContext('experimental-webgl');
        if (!gl) {
            alert('WebGL is not supported on your browser!');
        }
        return gl as WebGLRenderingContext;
    }

    async loadModel(url: string, loadingBarCallback?: (progress: number) => void) {
        const req = await fetch(url, {
            mode: "cors",
            credentials: "omit",
        });
        console.log(req);
        if (req.status != 200) {
            throw new Error(req.status + " Unable to load " + req.url);
        }

        const rowLength = 3 * 4 + 3 * 4 + 4 + 4;
        const reader = req.body!.getReader();
        this.splatData = new Uint8Array(req.headers.get("content-length") as any);

        console.log("Vertex Count", this.splatData.length / rowLength);

        let bytesRead = 0;
        let lastVertexCount = -1;
        let stopLoading = false;

        while (true) {
            const { done, value } = await reader.read();
            if (done || stopLoading) break;

            this.splatData.set(value, bytesRead);
            bytesRead += value.length;

            if (loadingBarCallback) {
                loadingBarCallback(bytesRead / this.splatData.length);
            }

            if (this.vertexCount > lastVertexCount) {
                this.worker.postMessage({
                    buffer: this.splatData.buffer,
                    vertexCount: Math.floor(bytesRead / rowLength),
                });
                lastVertexCount = this.vertexCount;
            }
        }
        if (!stopLoading) {
            this.worker.postMessage({
                buffer: this.splatData.buffer,
                vertexCount: Math.floor(bytesRead / rowLength),
            });
        }
    }

    handleMouseDown(e: MouseEvent) {
        this.dragging = true;
        this.panning = e.button === 2;
        this.lastX = e.clientX;
        this.lastY = e.clientY;
    }

    handleMouseUp(e: MouseEvent) {
        this.dragging = false;
        this.panning = false;
    }

    handleMouseMove(e: MouseEvent) {
        if (!this.dragging) return;
        const dx = e.clientX - this.lastX;
        const dy = e.clientY - this.lastY;
        const zoomNorm = this.camera.getZoomNorm();

        if (this.panning) {
            this.camera.pan(-dx * this.camera.panSpeed * zoomNorm, -dy * this.camera.panSpeed * zoomNorm);
        } else {
            this.camera.desiredAlpha -= dx * this.camera.orbitSpeed;
            this.camera.desiredBeta += dy * this.camera.orbitSpeed;
            this.camera.desiredBeta = Math.min(Math.max(this.camera.desiredBeta, this.camera.minBeta), this.camera.maxBeta);
        }

        this.lastX = e.clientX;
        this.lastY = e.clientY;
    }

    handleMouseWheel(e: WheelEvent) {
        const zoomNorm = this.camera.getZoomNorm();
        this.camera.desiredRadius += e.deltaY * this.camera.zoomSpeed * zoomNorm;
        this.camera.desiredRadius = Math.min(Math.max(this.camera.desiredRadius, this.camera.minZoom), this.camera.maxZoom);
    }

    handleDrop(e: DragEvent) {
        e.preventDefault();
        e.stopPropagation();
        this.selectFile(e.dataTransfer!.files[0]);
    }

    selectFile(file: File) {
        const reader = new FileReader();
        reader.onload = () => {
            this.splatData = new Uint8Array(reader.result as ArrayBuffer);
            if (this.splatData[0] !== 112 || this.splatData[1] !== 108 || this.splatData[2] !== 121 || this.splatData[3] !== 10) {
                alert("Invalid file format");
                return;
            }
            this.worker.postMessage({ ply: this.splatData.buffer });
        };
        reader.readAsArrayBuffer(file);
    }

    handleResize() {
        this.canvas.width = innerWidth;
        this.canvas.height = innerHeight;
        this.gl.viewport(0, 0, this.canvas.width, this.canvas.height);
    }

    dispose() {
        this.worker.terminate();

        this.gl.disableVertexAttribArray(this.a_position);
        this.gl.disableVertexAttribArray(this.a_center);
        this.gl.disableVertexAttribArray(this.a_color);
        this.gl.disableVertexAttribArray(this.a_covA);
        this.gl.disableVertexAttribArray(this.a_covB);

        this.gl.deleteBuffer(this.vertexBuffer);
        this.gl.deleteBuffer(this.centerBuffer);
        this.gl.deleteBuffer(this.colorBuffer);
        this.gl.deleteBuffer(this.covABuffer);
        this.gl.deleteBuffer(this.covBBuffer);

        this.gl.detachShader(this.program, this.vertexShader);
        this.gl.detachShader(this.program, this.fragmentShader);
        this.gl.deleteShader(this.vertexShader);
        this.gl.deleteShader(this.fragmentShader);

        this.gl.deleteProgram(this.program);

        this.vertexBuffer = null;
        this.centerBuffer = null;
        this.colorBuffer = null;
        this.covABuffer = null;
        this.covBBuffer = null;

        this.splatData = new Uint8Array();

        if (this.animationFrameId) {
            cancelAnimationFrame(this.animationFrameId);
        }

        this.disposed = true;

        document.removeEventListener("dragenter", preventDefault);
        document.removeEventListener("dragover", preventDefault);
        document.removeEventListener("dragleave", preventDefault);
        document.removeEventListener("contextmenu", preventDefault);

        this.canvas.removeEventListener("mousedown", this.handleMouseDown);
        this.canvas.removeEventListener("mouseup", this.handleMouseUp);
        this.canvas.removeEventListener("mousemove", this.handleMouseMove);
        this.canvas.removeEventListener("wheel", this.handleMouseWheel);
        this.canvas.removeEventListener("drop", this.handleDrop);

        window.removeEventListener("resize", this.handleResize);
    }

    async capture() {
        return null;
    }

    getStats(): { name: string, value: any }[] {
        return [];
    }
}