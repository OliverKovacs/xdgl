import Vector from "./vector.js";
import WebGL from "./webgl.js";
import XDGL from "./xdgl.js";

const start = Date.now();

let resolution = [ 1000, 500 ];

window.onload = async () => {
    const dimension = 10;

    const gl = WebGL.getWebGL("canvas");
    WebGL.init(gl);
    WebGL.resize(gl, resolution);

    let programInfo = WebGL.createProgramInfo();
    await WebGL.addShader(programInfo, "./shaders/xdgl.glsl", "vertex", "vertex", [ [ "<<<size>>>", dimension ] ]);
    await WebGL.addShader(programInfo, "./shaders/fragment.glsl", "fragment");
    WebGL.locateAttributes(programInfo);
    WebGL.locateUniforms(programInfo);

    const program = WebGL.buildShaderProgram(gl, programInfo);

    let vertices = XDGL.hypercubeVertices(dimension);
    vertices = Vector.scalar(vertices, 0.10);

    const uv = XDGL.hypercubeEdgeIndices(dimension);
    const edges = XDGL.hypercubeEdges(dimension);

    let geometryInfo = {
        vertices,
        uv,
        edges,
    };
    
    const geometry = XDGL.createGeometry(gl, geometryInfo);
    const transform = XDGL.createTransform(dimension);

    gl.useProgram(program.program);

    const loop = () => {
        requestAnimationFrame(loop);

        gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);

        gl.clearColor(0.0, 0.0, 0.0, 1.0);
        gl.clear(gl.DEPTH_BUFFER_BIT | gl.COLOR_BUFFER_BIT);

        gl.enable(gl.CULL_FACE);
        gl.enable(gl.DEPTH_TEST);
        gl.depthFunc(gl.ALWAYS);

        gl.useProgram(program.program);

        XDGL.renderGeometry(gl, geometry, transform, program, resolution, Date.now() - start)
    };

    requestAnimationFrame(loop);
};
