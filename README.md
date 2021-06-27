# xdgl

Example implementation of higher dimensional rendering in [WebGL](https://www.khronos.org/webgl/).

Online demo: [https://oliverkovacs.github.io/demo/xdgl/](https://oliverkovacs.github.io/demo/xdgl/)

## Explanation

Transformation, scaling, rotation, and projection is done on the GPU with the `xdgl.glsl` vertex shader, enabling high performance.

It can theoretically handle any shape in arbitrary high dimensions, however the JavaScript side of this implementation (`xdgl.js`) can currently only generate and draw hypercubes. Separate implementations could be developed, as long as they correctly pass data to the shader.

Vertex, element and transform data are supplied to the vertex shader through textures, as OpenGL/WebGL limit the size of a single vertex attribute to 4.

The dimensionality of the hypercube can be changed in `index.js`.

`vector.js` and `webgl.js` contain helper functions not directly related to higher dimensions.

## Usage

Clone this repository and serve the folder on your localhost. Open it in a browser that supports WebGL.
&nbsp;


Author: [Oliver Kovacs](https://github.com/OliverKovacs)

License: MIT