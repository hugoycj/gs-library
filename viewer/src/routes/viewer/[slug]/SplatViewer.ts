import type { IViewer } from "./IViewer";
import * as SPLAT from "$lib/splat.js";

export class SplatViewer implements IViewer {
    canvas: HTMLCanvasElement;
    gl: WebGLRenderingContext;
    ext: ANGLE_instanced_arrays;
    camera: SPLAT.Camera;
    orbitControls: SPLAT.OrbitControls;

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
        this.camera = new SPLAT.Camera();
        this.orbitControls = new SPLAT.OrbitControls(this.camera, this.canvas);

        this.splatData = new Uint8Array();
        this.vertexCount = 0;

        this.worker = new Worker(
            URL.createObjectURL(
                new Blob(["(", SPLAT.createWorker.toString(), ")(self)"], {
                    type: "application/javascript",
                })
            )
        );

        const gl = this.gl;

        this.canvas.width = innerWidth;
        this.canvas.height = innerHeight;
        gl.viewport(0, 0, this.canvas.width, this.canvas.height);
        this.camera.updateProjectionMatrix(this.canvas.width, this.canvas.height);

        let viewMatrix = SPLAT.getViewMatrix(this.camera);

        this.vertexShader = gl.createShader(gl.VERTEX_SHADER) as WebGLShader;
        gl.shaderSource(this.vertexShader, SPLAT.vertex);
        gl.compileShader(this.vertexShader);
        if (!gl.getShaderParameter(this.vertexShader, gl.COMPILE_STATUS)) {
            console.error(gl.getShaderInfoLog(this.vertexShader));
        }

        this.fragmentShader = gl.createShader(gl.FRAGMENT_SHADER) as WebGLShader;
        gl.shaderSource(this.fragmentShader, SPLAT.frag);
        gl.compileShader(this.fragmentShader);
        if (!gl.getShaderParameter(this.fragmentShader, gl.COMPILE_STATUS)) {
            console.error(gl.getShaderInfoLog(this.fragmentShader));
        }

        this.program = gl.createProgram() as WebGLProgram;
        gl.attachShader(this.program, this.vertexShader);
        gl.attachShader(this.program, this.fragmentShader);
        gl.linkProgram(this.program);
        gl.useProgram(this.program);

        if (!gl.getProgramParameter(this.program, gl.LINK_STATUS)) {
            console.error(gl.getProgramInfoLog(this.program));
        }

        gl.disable(gl.DEPTH_TEST); // Disable depth testing

        // Enable blending
        gl.enable(gl.BLEND);

        // Set blending function
        gl.blendFuncSeparate(gl.ONE_MINUS_DST_ALPHA, gl.ONE, gl.ONE_MINUS_DST_ALPHA, gl.ONE);

        // Set blending equation
        gl.blendEquationSeparate(gl.FUNC_ADD, gl.FUNC_ADD);

        // projection
        const u_projection = gl.getUniformLocation(this.program, "projection");
        gl.uniformMatrix4fv(u_projection, false, this.camera.projectionMatrix.buffer);

        // viewport
        const u_viewport = gl.getUniformLocation(this.program, "viewport");
        gl.uniform2fv(u_viewport, new Float32Array([this.canvas.width, this.canvas.height]));

        // focal
        const u_focal = gl.getUniformLocation(this.program, "focal");
        gl.uniform2fv(u_focal, new Float32Array([this.camera.fx, this.camera.fy]));

        // view
        const u_view = gl.getUniformLocation(this.program, "view");
        gl.uniformMatrix4fv(u_view, false, viewMatrix.buffer);

        // positions
        const triangleVertices = new Float32Array([-2, -2, 2, -2, 2, 2, -2, 2]);
        this.vertexBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, this.vertexBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, triangleVertices, gl.STATIC_DRAW);

        this.a_position = gl.getAttribLocation(this.program, "position");
        gl.enableVertexAttribArray(this.a_position);
        gl.vertexAttribPointer(this.a_position, 2, gl.FLOAT, false, 0, 0);

        // center
        this.centerBuffer = gl.createBuffer();
        this.a_center = gl.getAttribLocation(this.program, "center");
        gl.enableVertexAttribArray(this.a_center);
        gl.bindBuffer(gl.ARRAY_BUFFER, this.centerBuffer);
        gl.vertexAttribPointer(this.a_center, 3, gl.FLOAT, false, 0, 0);
        this.ext.vertexAttribDivisorANGLE(this.a_center, 1); // Use the extension here

        // color
        this.colorBuffer = gl.createBuffer();
        this.a_color = gl.getAttribLocation(this.program, "color");
        gl.enableVertexAttribArray(this.a_color);
        gl.bindBuffer(gl.ARRAY_BUFFER, this.colorBuffer);
        gl.vertexAttribPointer(this.a_color, 4, gl.FLOAT, false, 0, 0);
        this.ext.vertexAttribDivisorANGLE(this.a_color, 1); // Use the extension here

        // cov
        this.covABuffer = gl.createBuffer();
        this.a_covA = gl.getAttribLocation(this.program, "covA");
        gl.enableVertexAttribArray(this.a_covA);
        gl.bindBuffer(gl.ARRAY_BUFFER, this.covABuffer);
        gl.vertexAttribPointer(this.a_covA, 3, gl.FLOAT, false, 0, 0);
        this.ext.vertexAttribDivisorANGLE(this.a_covA, 1); // Use the extension here

        this.covBBuffer = gl.createBuffer();
        this.a_covB = gl.getAttribLocation(this.program, "covB");
        gl.enableVertexAttribArray(this.a_covB);
        gl.bindBuffer(gl.ARRAY_BUFFER, this.covBBuffer);
        gl.vertexAttribPointer(this.a_covB, 3, gl.FLOAT, false, 0, 0);
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

                gl.bindBuffer(gl.ARRAY_BUFFER, this.centerBuffer);
                gl.bufferData(gl.ARRAY_BUFFER, center, gl.DYNAMIC_DRAW);

                gl.bindBuffer(gl.ARRAY_BUFFER, this.colorBuffer);
                gl.bufferData(gl.ARRAY_BUFFER, color, gl.DYNAMIC_DRAW);

                gl.bindBuffer(gl.ARRAY_BUFFER, this.covABuffer);
                gl.bufferData(gl.ARRAY_BUFFER, covA, gl.DYNAMIC_DRAW);

                gl.bindBuffer(gl.ARRAY_BUFFER, this.covBBuffer);
                gl.bufferData(gl.ARRAY_BUFFER, covB, gl.DYNAMIC_DRAW);
            }
        };

        let vertexCount = 0;

        const frame = () => {
            this.orbitControls.update();

            this.camera.updateProjectionMatrix(this.canvas.width, this.canvas.height);
            viewMatrix = SPLAT.getViewMatrix(this.camera);

            const viewProj = this.camera.projectionMatrix.multiply(viewMatrix);
            this.worker.postMessage({ view: viewProj.buffer });

            if (vertexCount > 0) {
                gl.uniformMatrix4fv(u_view, false, viewMatrix.buffer);
                this.ext.drawArraysInstancedANGLE(gl.TRIANGLE_FAN, 0, 4, vertexCount);
            } else {
                gl.clear(gl.COLOR_BUFFER_BIT);
            }

            if (!this.disposed) {
                this.animationFrameId = requestAnimationFrame(frame);
            }
        };

        this.animationFrameId = requestAnimationFrame(frame);

        document.addEventListener("dragenter", this.preventDefault);
        document.addEventListener("dragover", this.preventDefault);
        document.addEventListener("dragleave", this.preventDefault);
        document.addEventListener("contextmenu", this.preventDefault);

        this.handleDrop = this.handleDrop.bind(this);
        this.handleResize = this.handleResize.bind(this);

        this.canvas.addEventListener("drop", this.handleDrop);

        window.addEventListener("resize", this.handleResize);
    }

    initWebGL(): WebGLRenderingContext {
        const gl = this.canvas.getContext("webgl") || this.canvas.getContext("experimental-webgl");
        if (!gl) {
            alert("WebGL is not supported on your browser!");
        }
        return gl as WebGLRenderingContext;
    }

    preventDefault(e: Event) {
        e.preventDefault();
        e.stopPropagation();
    }

    async loadScene(url: string, onProgress?: (progress: number) => void) {
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

            if (onProgress) {
                onProgress(bytesRead / this.splatData.length);
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

    handleDrop(e: DragEvent) {
        e.preventDefault();
        e.stopPropagation();
        this.selectFile(e.dataTransfer!.files[0]);
    }

    selectFile(file: File) {
        const reader = new FileReader();
        reader.onload = () => {
            this.splatData = new Uint8Array(reader.result as ArrayBuffer);
            if (
                this.splatData[0] !== 112 ||
                this.splatData[1] !== 108 ||
                this.splatData[2] !== 121 ||
                this.splatData[3] !== 10
            ) {
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
        this.camera.updateProjectionMatrix(this.canvas.width, this.canvas.height);

        const u_projection = this.gl.getUniformLocation(this.program, "projection");
        this.gl.uniformMatrix4fv(u_projection, false, this.camera.projectionMatrix.buffer);

        const u_viewport = this.gl.getUniformLocation(this.program, "viewport");
        this.gl.uniform2fv(u_viewport, new Float32Array([this.canvas.width, this.canvas.height]));
    }

    dispose() {
        this.worker.terminate();
        this.orbitControls.dispose();

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

        document.removeEventListener("dragenter", this.preventDefault);
        document.removeEventListener("dragover", this.preventDefault);
        document.removeEventListener("dragleave", this.preventDefault);
        document.removeEventListener("contextmenu", this.preventDefault);

        this.canvas.removeEventListener("drop", this.handleDrop);

        window.removeEventListener("resize", this.handleResize);
    }

    async capture(): Promise<string | null> {
        return new Promise((resolve) => {
            requestAnimationFrame(() => {
                const offscreenCanvas = document.createElement("canvas");
                offscreenCanvas.width = 512;
                offscreenCanvas.height = 512;
                const offscreenContext = offscreenCanvas.getContext("2d")!;

                const x = (this.canvas.width - offscreenCanvas.width) / 2;
                const y = (this.canvas.height - offscreenCanvas.height) / 2;

                offscreenContext.drawImage(
                    this.canvas,
                    x,
                    y,
                    offscreenCanvas.width,
                    offscreenCanvas.height,
                    0,
                    0,
                    offscreenCanvas.width,
                    offscreenCanvas.height
                );
                const dataURL = offscreenCanvas.toDataURL("image/png");
                offscreenCanvas.remove();

                resolve(dataURL);
            });
        });
    }

    getStats(): { name: string; value: any }[] {
        return [];
    }
}
