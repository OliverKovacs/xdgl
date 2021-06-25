// Oliver Kovacs 2021 - xdgl

#define PI 3.141592653

attribute float index;

uniform sampler2D tex_vertex;
uniform vec2 tex_vertex_size;
uniform sampler2D tex_edges;
uniform vec2 tex_edges_size;
uniform sampler2D tex_uv;
uniform vec2 tex_uv_size;
uniform sampler2D tex_transform;
uniform vec2 tex_transform_size;

uniform vec2 resolution;
uniform float time;

varying vec3 color;

float canvas_z = 1.0;
float camera_z = 0.0;

const int n = <<<size>>>;
const int axes = n * (n - 1) / 2;

float speed = 4.0;

struct Transform {
    float position[n];
    float scale[n];
    float offset[n];
    float rotation[axes];
};

vec4 texelFetch(sampler2D tex, vec2 tex_size, vec2 pixel_coord) {
    vec2 uv = (pixel_coord + 0.5) / tex_size;
    return texture2D(tex, uv);
}

float texelFetchIndex(sampler2D tex, vec2 tex_size, float index) {

    float block_size = 4.0;
    float idx = floor(index / block_size);
    float offset = mod(index, block_size);
    float column = mod(idx, tex_size.x);
    float row = floor(idx / tex_size.x);

    vec4 element = texelFetch(tex, tex_size, vec2(column, row));
    if (offset == 0.0) return element.x;
    if (offset == 1.0) return element.y;
    if (offset == 2.0) return element.z;
    if (offset == 3.0) return element.w;
}

void arrayAdd(inout float a[n], inout float b[n]) {
    for (int i = 0; i < n; i++) {
        a[i] += b[i];
    }
}

void arraySubtract(inout float a[n], inout float b[n]) {
    for (int i = 0; i < n; i++) {
        a[i] -= b[i];
    }
}

void arrayMultiply(inout float a[n], inout float b[n]) {
    for (int i = 0; i < n; i++) {
        a[i] *= b[i];
    }
}

void arrayDivide(inout float a[n], inout float b[n]) {
    for (int i = 0; i < n; i++) {
        a[i] /= b[i];
    }
}

float arraySum(float a[n]) {
    float o;
    for (int i = 0; i < n; i++) {
        o += a[i];
    }
    return o;
}

void rotate(inout float vertex[n], inout float rotation[axes], inout float scale[n], inout float offset[n]) {
    arrayMultiply(vertex, scale);
    arrayAdd(vertex, offset);
    for (int i = 0; i < n - 1; i++) {
        for (int j = 0; j < n; j++) {
            if (j <= i) continue;
            float a = rotation[axes - int(float((n - i - 1) * (n - i)) / 2.0) + j - i - 1];
            float cos_a = cos(a);
            float sin_a = sin(a);
            float vi = vertex[i];
            float vj = vertex[j];
            vertex[i] = vi *  cos_a + vj * sin_a;
            vertex[j] = vi * -sin_a + vj * cos_a;
        }
    }
    arraySubtract(vertex, offset);
    arrayDivide(vertex, scale);
}

void project(inout float vertex[n]) {
    float z_diff = canvas_z - camera_z;
    for (int i = n - 1; i >= 2; i--) {
        float w = z_diff / (canvas_z - vertex[i]);
        for (int j = 0; j < n; j++) {
            if (j >= i) break;
            vertex[j] *= w;
        }
    }
}

void fetchArray(sampler2D tex, vec2 tex_size, inout float array[n], float idx) {
    for (int i = 0; i < n; i++) {
        array[i] = texelFetchIndex(tex, tex_size, idx * float(n) + float(i));
    }
}

void fetchTransform(
    sampler2D tex,
    vec2 tex_size,
    float pointer,
    inout float position[n],
    inout float rotation[axes],
    inout float scale[n],
    inout float offset[n]
) {
    for (int i = 0; i < n; i++) {
        position[i] = texelFetchIndex(tex, tex_size, pointer + float(i));
        scale[i]    = texelFetchIndex(tex, tex_size, pointer + float(n + i));
        offset[i]   = texelFetchIndex(tex, tex_size, pointer + float(2 * n + i));
    }
    for (int i = 0; i < axes; i++) {
        rotation[i] = texelFetchIndex(tex, tex_size, pointer + float(3 * n + i));
    }
}

vec3 arrayToVec(float pos[n]) {
    return vec3(pos[0], pos[1], pos[2]);
}

void main() {
    color = vec3(0.0, 0.0, 1.0);

    float position[n];
    float rotation[axes];
    float scale[n];
    float offset[n];

    fetchTransform(
        tex_transform, tex_transform_size, 0.0, position, rotation, scale, offset
    );

    float idx = texelFetchIndex(tex_edges, tex_edges_size, index);

    float vertex[n];
    fetchArray(tex_vertex, tex_vertex_size, vertex, idx);

    rotate(vertex, rotation, scale, offset);
    project(vertex);

    vertex[0] *= resolution.y / resolution.x;

    gl_Position = vec4(arrayToVec(vertex), 1.0);

    float edge_data[4];
    for (int i = 0; i < 4; i++) {
        edge_data[i] = texelFetchIndex(tex_uv, tex_uv_size, index * 4.0 + float(i));
    }
    float c = edge_data[1];

    float s = 1.0;
    color = vec3(
        0.5 * (sin(c * s + 0.0 * PI / 3.0) + 1.0),
        0.5 * (sin(c * s + 2.0 * PI / 3.0) + 1.0),
        0.5 * (sin(c * s + 4.0 * PI / 3.0) + 1.0)
    );
}
