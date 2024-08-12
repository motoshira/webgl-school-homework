precision mediump float;
uniform float progress;
uniform vec2 resolution;
uniform sampler2D texture0;
uniform vec2 originalImageSize0;
uniform vec2 texSize0;
uniform sampler2D texture1;
uniform vec2 originalImageSize1;
uniform vec2 texSize1;

// object-fit: contain; っぽくする
// 2つの画像をrippleっぽくtransitionさせる

const float PI = 3.14159265359;
const vec2 CENTER = vec2(0.5);

vec2 resizedImageSize(vec2 imageSize, vec2 containerSize) {
	float aspect = imageSize.x / imageSize.y;
	float width = min(containerSize.x, containerSize.y * aspect);
	float height = width / aspect;
	return vec2(width, height);
}

vec2 invert_y(vec2 uv) {
	return vec2(uv.x, 1.0 - uv.y);
}

mat3 scale(vec2 scale) {
	return mat3(scale.x, 0.0, 0.0, 0.0, scale.y, 0.0, 0.0, 0.0, 1.0);
}

mat3 translate(vec2 translate) {
	return mat3(1.0, 0.0, 0.0, 0.0, 1.0, 0.0, translate.x, translate.y, 1.0);
}

vec3 getColor(sampler2D tex, vec2 uv, vec2 imgSize, vec2 texSize) {
	vec2 resized = resizedImageSize(imgSize, resolution);
	vec2 ratio = resolution / resized;
	// uv座標を画像上の座標に変換
	mat3 m = translate(vec2(0.5)) * scale(ratio) * translate(vec2(-0.5));
	vec2 uv_new = (m * vec3(uv, 1.0)).xy;
	if (uv_new.x < 0.0 || uv_new.x > 1.0 || uv_new.y < 0.0 || uv_new.y > 1.0) {
		return vec3(0.0);
	} else {
    float dist = distance(uv, CENTER);
		// progressで強さを変える・外側に広がる
    float ripple = (0.5 - 0.5 * cos(2.0 * PI * progress)) * sin(dist * 30.0 - progress * 10.0) * 0.02;
		// textureにはpaddingがあるので、その分を考慮して座標を変換
		return texture2D(tex, uv_new * (imgSize / texSize) + ripple).rgb;
	}
}

void main() {
	vec2 c = invert_y(gl_FragCoord.xy / resolution);
	vec3 col0 = getColor(texture0, c, originalImageSize0, texSize0);
	vec3 col1 = getColor(texture1, c, originalImageSize1, texSize1);
	vec3 col = mix(col0, col1, progress);
  gl_FragColor = vec4(col, 1.0);
}
