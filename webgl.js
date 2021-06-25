export default class WebGl {

    static getWebGL(id) {
        const canvas = document.querySelector(id);
        const gl = canvas.getContext("webgl");
        if (!gl) {
            return alert("WebGL not supported!");
        }

        const ext = gl.getExtension("OES_texture_float");
        if (!ext) {
            return alert("OES_texture_float not supported!");
        }

        return gl;
    }

    static init(gl) {
        this.maxTextureSize = gl.getParameter(gl.MAX_TEXTURE_SIZE);

        this.shader = {
            [gl.VERTEX_SHADER]: "vertex",
            [gl.FRAGMENT_SHADER]: "fragment",
            vertex: gl.VERTEX_SHADER,
            fragment: gl.FRAGMENT_SHADER,
        };
    }

    static resize(gl, resolution) {
        gl.canvas.width = resolution[0];
        gl.canvas.height = resolution[1];
        gl.canvas.style.width = resolution[0];
        gl.canvas.style.height = resolution[1];
    }

    static async downloadShader(path) {
        const response = await fetch(path);
        return response.text();
    }

    static createProgramInfo() {
        return {
            shaders: [],
            uniforms: [],
            attributes: [],
        };
    }

    static async addShader(programInfo, path, type, name, replace = []) {
        let code = await this.downloadShader(path);

        replace.forEach(rule => {
            code = code.replace(...rule);
        });

        programInfo.shaders.push({
            code,
            type,
            name,
        });

        return this;
    }

    static compileShader(gl, code, type) {
        let shader = gl.createShader(type);

        gl.shaderSource(shader, code);
        gl.compileShader(shader);

        if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
            console.error(`Error compiling ${this.shader[type]} shader:\n${gl.getShaderInfoLog(shader)}`);
        }

        return shader;
    }

    static buildShaderProgram(gl, programInfo) {
        let program = gl.createProgram();
    
        programInfo.shaders.forEach(({ code, type }) => {
            let shader = this.compileShader(gl, code, this.shader[type]);
            if (shader) gl.attachShader(program, shader);
        });
    
        gl.linkProgram(program);
        if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
            console.error(`Error linking shader program:\n${gl.getProgramInfoLog(program)}`);
        }
    
        let uniforms = Object.fromEntries(programInfo.uniforms.map(name => [ name, gl.getUniformLocation(program, name) ]));
        let attributes = Object.fromEntries(programInfo.attributes.map(name => [ name, gl.getAttribLocation(program, name) ]));

        return { program, uniforms, attributes };
    }

    static locateAttributes(programInfo) {
        this.locate(programInfo, "attribute");
    }

    static locateUniforms(programInfo) {
        this.locate(programInfo, "uniform");
    }

    static locate(programInfo, type) {
        programInfo.shaders.forEach(({ code }) => {
            code.match(new RegExp(`(?<=\n${type} ).*(?=;)`, "g"))?.forEach(match => {
                programInfo[`${type}s`].push(match.split(" ")[1]);
            });
        });
    }

    static createArrayBuffer(gl, data) {
        const buffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
        gl.bufferData(gl.ARRAY_BUFFER, data, gl.STATIC_DRAW);
        return buffer;
    }

    static createElementBuffer(gl, data) {
        const buffer = gl.createBuffer();
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, buffer);
        gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, data, gl.STATIC_DRAW);
        return buffer;
    }

    static createDataTexture(gl, data, maxWidth = this.maxTextureSize) {

        const block = 4;
        const count = Math.ceil(data.length / block);

        const width = Math.min(maxWidth, count);
        const height = Math.ceil(count / width);
        const size = [ width, height ];

        const diff = block * width * height - data.length;
        if (diff) data = data.concat(Array(diff).fill(null));
        const array = new Float32Array(data);

        const texture = gl.createTexture();
        gl.bindTexture(gl.TEXTURE_2D, texture);
        gl.texImage2D(
            gl.TEXTURE_2D,
            0,
            gl.RGBA,
            width,
            height,
            0,
            gl.RGBA,
            gl.FLOAT,
            array,
        );

        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);

        return { texture, size };
    }
}
