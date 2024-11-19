#version 300 es

in vec3 position;
out vec2 vTexCoord;

void main(void){
	vec2 uv = position.xy * 0.5 + 0.5;
	vTexCoord = uv;
	gl_Position = vec4(position, 1.0);
}
