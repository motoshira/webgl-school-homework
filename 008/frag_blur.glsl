#version 300 es

precision mediump float;
uniform bool gaussian;
uniform bool horizontal;
uniform float weight[30];
uniform sampler2D texture0;
uniform vec2 texSize;
in vec2 vTexCoord;
out vec4 fragColor;

void main() {
	float tFlag;
	vec3 destColor = vec3(0.0);
	// vec2 fc;
	// vec2 fc = vec2(gl_FragCoord.s, 512.0 - gl_FragCoord.t);
	vec2 uv = vec2(vTexCoord.s, 1.0 - vTexCoord.t);
	if (gaussian) {
		// TODO: Implement Gaussian blur
		if (horizontal) {
			tFlag = 1.0 / texSize.x;
			// invert y
			// fc = vec2(gl_FragCoord.s, 512.0 - gl_FragCoord.t);
			destColor += texture(texture0, uv).rgb * weight[0];
			for (int i = 1; i < 30; i++) {
				destColor += texture(texture0, uv + vec2(i, 0.0) * tFlag).rgb * weight[i];
				destColor += texture(texture0, uv - vec2(i, 0.0) * tFlag).rgb * weight[i];
			}
		} else {
			tFlag = 1.0 / texSize.y;
			// fc = gl_FragCoord.st;
			destColor += texture(texture0, uv).rgb * weight[0];

			for (int i = 1; i < 30; i++) {
				destColor += texture(texture0, uv + vec2(0.0, i) * tFlag).rgb * weight[i];
				destColor += texture(texture0, uv - vec2(0.0, i) * tFlag).rgb * weight[i];
			}
		}
	} else {
		destColor = texture(texture0, uv).rgb;
	}
	fragColor = vec4(destColor, 1.0);
}
