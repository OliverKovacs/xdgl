// Oliver Kovacs 2021 - xdgl

import WebGL from "./webgl.js";

export default class XDGL {

    static renderGeometry = (gl, geometry, transform, program, resolution, time) => {

        gl.bindBuffer(gl.ARRAY_BUFFER, geometry.indices);
    
        gl.enableVertexAttribArray(program.attributes.index);
    
        {
            const size = 1;
            const type = gl.FLOAT;
            const normalize = false;
            const stride = 0;
            const offset = 0;
            gl.vertexAttribPointer(program.attributes.index, size, type, normalize, stride, offset);
        }
    
        const speed = 0.2;
        for (let i = 0; i < transform.rotation.length; i++) {
            transform.rotation[i] += speed * (0.01 + 0.001 * i);
        }
    
        transform.scale[0] = 1;
    
        let tf = XDGL.flattenTransform(transform);
        tf.push(...Array(4 - tf.length % 4));
        const tex_transform = WebGL.createDataTexture(gl, tf);

        this.bindTexture(gl, geometry.vertices, program.uniforms, "tex_vertex", 0);
        this.bindTexture(gl, geometry.edges, program.uniforms, "tex_edges", 1);
        this.bindTexture(gl, tex_transform, program.uniforms, "tex_transform", 2);
        this.bindTexture(gl, geometry.uv, program.uniforms, "tex_uv", 3);
    
        gl.uniform2fv(program.uniforms.resolution, resolution);
        gl.uniform1f(program.uniforms.time, time);
    
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, geometry.element_buffer);
        gl.drawElements(gl.LINES, geometry.edges_length, gl.UNSIGNED_SHORT, 0);
    };

    static bindTexture(gl, texture, uniforms, name, index) {
        gl.activeTexture(gl.TEXTURE0 + index);
        gl.bindTexture(gl.TEXTURE_2D, texture.texture);
        gl.uniform1i(uniforms[name], index);
        gl.uniform2fv(uniforms[`${name}_size`], texture.size);
    }
    
    static createGeometry(gl, geometryInfo) {
        const indices = this.indexArray(geometryInfo.vertices.length);

        return {
            vertices: WebGL.createDataTexture(gl, geometryInfo.vertices),
            uv: WebGL.createDataTexture(gl, geometryInfo.uv),
            edges: WebGL.createDataTexture(gl, geometryInfo.edges),
            edges_length: geometryInfo.edges.length,
            indices: WebGL.createArrayBuffer(gl, new Float32Array(indices)),
            element_buffer: WebGL.createElementBuffer(gl, new Uint16Array(indices)),
        };
    }

    static indexArray(n) {
        let out = [];
        for (let i = 0; i < n; i++) {
            out[i] = i;
        }
        return out;
    };

    static hypercubeVertices(dimension) {
        let out = [];
        for (let i = 0; i < 2 ** dimension; i++) {
            for (let j = 0; j < dimension; j++) {
                out[i * dimension + j] = 1 - (Math.floor(i / 2 ** j) % 2) * 2;
            }
        }
        return out;
    }

    static hypercubeEdges(dimension) {
        let out = [];
        const block = 2;
        const stride = 2 ** (dimension - 1);
        for (let i = 0; i < dimension; i++) {
            for (let j = 0; j < stride; j++) {
                const base = (j % (2 ** i)) + (2 ** (i + 1)) * Math.floor(j / 2 ** i);
                const index = i * stride + j;
                out[index * block]     = base;
                out[index * block + 1] = base + 2 ** i;
            }
        }
        return out;
    }

    static hypercubeEdgeIndices(dimension) {
        let out = [];
        const block = 8;
        const stride = 2 ** (dimension - 1);
        for (let i = 0; i < dimension; i++) {
            for (let j = 0; j < stride; j++) {
                const index = i * stride + j;
                out[index * block]     = index;
                out[index * block + 1] = i;
                out[index * block + 2] = j;
                out[index * block + 3] = 0;
                out[index * block + 4] = index;
                out[index * block + 5] = i;
                out[index * block + 6] = j;
                out[index * block + 7] = 1;
            }
        }
        return out;
    }

    static createTransform(dimension) {
        return {
            position: Array(dimension).fill(0),
            rotation: Array(this.getAxisCount(dimension)).fill(0),
            scale: Array(dimension).fill(1),
            offset: Array(dimension).fill(0),
        };
    }

    static flattenTransform(transform) {
        return [
            ...transform.position,
            ...transform.scale,
            ...transform.offset,
            ...transform.rotation,
        ];
    }

    static getTransformSize(dimension) {
        return 3 * dimension + this.getAxisCount(dimension);
    }

    static getAxisCount(dimension) {
        return dimension * (dimension - 1) / 2;
    }
};
