import { WebGLUtility } from "../lib/webgl.js";
import VSBlurSource from "./vert_blur.glsl";
import FSBlurSource from "./frag_blur.glsl";
import BGImage from "./assets/bg.jpg";

const getGaussianWeight = (strength: number, n: number) => {
  const weight = new Array(n);
  let t = 0.0;
  for (let i = 0; i < weight.length; i++) {
    const r = 1.0 + 2.0 * i;
    let w = Math.exp((-0.5 * (r * r)) / strength);
    weight[i] = w;
    if (i > 0) {
      w *= 2.0;
    }
    t += w;
  }
  // normalize
  for (let i = 0; i < weight.length; i++) {
    weight[i] /= t;
  }
  return weight;
};

class ScrollEventTracker {
  private _scrollY = 0;
  private touchStartY: number;
  constructor() {
    const isMobile =
      /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
        navigator.userAgent,
      );
    if (isMobile) {
      window.addEventListener("touchstart", (event) => {
        this.touchStartY = event.touches[0].clientY;
      });
      window.addEventListener("touchmove", (event) => {
        const currentY = event.touches[0].clientY;
        this._scrollY = Math.max(
          0,
          this._scrollY + this.touchStartY - currentY,
        );
        this.touchStartY = currentY;
      });
    } else {
      window.addEventListener("wheel", (e) => {
        this._scrollY = Math.max(0, this._scrollY + e.deltaY);
      });
    }
  }
  get scrollY() {
    return this._scrollY;
  }
}

class ImageResizer {
  private originalImage: HTMLImageElement;
  constructor(image: HTMLImageElement) {
    this.originalImage = image;
  }
  // 縦をカバーするようにリサイズする 中央寄せ
  getCoveringImage(width: number, height: number) {
    return new Promise<HTMLImageElement>((resolve, reject) => {
      const image = new Image();
      image.onload = () => {
        const canvas = document.createElement("canvas");
        const ctx = canvas.getContext("2d")!;
        const { width: originalWidth, height: originalHeight } = image;
        const scale = height / originalHeight;
        canvas.width = width;
        canvas.height = height;
        const sWidth = originalWidth * scale;
        const sx = width / 2 - sWidth / 2;
        const sy = 0;
        ctx.drawImage(image, sx, sy, sWidth, height);
        const imageUrl = canvas.toDataURL();
        WebGLUtility.loadImage(imageUrl).then((res) => resolve(res));
      };
      image.onerror = reject;
      image.src = this.originalImage.src;
    });
  }
}

class RenderTarget {
  private gl: WebGL2RenderingContext;
  private framebuffer: WebGLFramebuffer;
  // カラーバッファはテクスチャとして扱う
  private texture: WebGLTexture;
  // 深度バッファはレンダーバッファとして扱う
  private depthRenderBuffer: WebGLRenderbuffer;
  constructor(
    gl: WebGL2RenderingContext,
    texture: WebGLTexture,
    width: number,
    height: number,
  ) {
    this.gl = gl;
    // configure framebuffer
    this.framebuffer = gl.createFramebuffer()!;
    gl.bindFramebuffer(gl.FRAMEBUFFER, this.framebuffer);

    // configure texture
    this.texture = texture;
    gl.bindTexture(gl.TEXTURE_2D, texture);
    // configure texture as color buffer
    gl.texImage2D(
      gl.TEXTURE_2D,
      0,
      gl.RGBA,
      width,
      height,
      0,
      gl.RGBA,
      gl.UNSIGNED_BYTE,
      null,
    );
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.framebufferTexture2D(
      gl.FRAMEBUFFER,
      gl.COLOR_ATTACHMENT0,
      gl.TEXTURE_2D,
      texture,
      0,
    );
    // configure renderbuffer
    this.depthRenderBuffer = gl.createRenderbuffer()!;
    gl.bindRenderbuffer(gl.RENDERBUFFER, this.depthRenderBuffer);
    gl.framebufferRenderbuffer(
      gl.FRAMEBUFFER,
      gl.DEPTH_ATTACHMENT,
      gl.RENDERBUFFER,
      this.depthRenderBuffer,
    );
    gl.renderbufferStorage(
      gl.RENDERBUFFER,
      gl.DEPTH_COMPONENT16,
      width,
      height,
    );
    gl.bindRenderbuffer(gl.RENDERBUFFER, null);
    this.unbind();
  }
  bind() {
    this.gl.bindFramebuffer(this.gl.FRAMEBUFFER, this.framebuffer);
  }
  unbind() {
    this.gl.bindFramebuffer(this.gl.FRAMEBUFFER, null);
  }
  resize(width: number, height: number) {
    const gl = this.gl;

    this.bind();

    // Update texture size
    gl.bindTexture(gl.TEXTURE_2D, this.texture);
    gl.texImage2D(
      gl.TEXTURE_2D,
      0,
      gl.RGBA,
      width,
      height,
      0,
      gl.RGBA,
      gl.UNSIGNED_BYTE,
      null,
    );

    // Update renderbuffer size
    gl.bindRenderbuffer(gl.RENDERBUFFER, this.depthRenderBuffer);
    gl.renderbufferStorage(
      gl.RENDERBUFFER,
      gl.DEPTH_COMPONENT16,
      width,
      height,
    );

    this.unbind();
  }
}

window.addEventListener(
  "DOMContentLoaded",
  async () => {
    const app = new App();
    app.init();
    await app.load();
    app.setupGeometry();
    app.setupLocation();
    app.start();
  },
  false,
);

class App {
  canvas: HTMLCanvasElement;
  gl: WebGL2RenderingContext;
  scrollEventTracker: ScrollEventTracker;
  imageResizer: ImageResizer;
  renderTarget: RenderTarget;
  resizedImage: HTMLImageElement;
  bgTexture: WebGLTexture;
  tempTexture: WebGLTexture;
  textureSize: Float32Array;
  weight: number[];

  blurProgram: WebGLProgram;
  // 本体 板ポリにrender
  program: WebGLProgram;

  attributeLocation: GLint[];
  attributeStride: GLint[];
  planePoints: number[];
  planeVBO: WebGLBuffer;
  uniformLocation: {
    gaussian: WebGLUniformLocation;
    horizontal: WebGLUniformLocation;
    weight: WebGLUniformLocation;
    texture0: WebGLUniformLocation;
    texSize: WebGLUniformLocation;
  };

  constructor() {
    // this を固定するためのバインド処理
    this.resize = this.resize.bind(this);
    this.render = this.render.bind(this);
    this.renderLoop = this.renderLoop.bind(this);
  }

  init() {
    this.canvas = document.getElementById("webgl-canvas") as HTMLCanvasElement;
    const gl = this.canvas.getContext("webgl2")!;
    this.gl = gl;

    this.resize();

    this.gl.enable(this.gl.CULL_FACE);
    this.gl.enable(this.gl.DEPTH_TEST);
  }

  resize() {
    this.canvas.width = window.innerWidth;
    this.canvas.height = window.innerHeight;
  }

  async load() {
    const gl = this.gl;
    if (!gl) {
      throw new Error("not initialized");
    }

    // vertex shader
    const vertexBlurShader = gl.createShader(gl.VERTEX_SHADER);
    if (!vertexBlurShader) {
      throw new Error("failed to create vertex shader");
    }
    gl.shaderSource(vertexBlurShader, VSBlurSource);
    gl.compileShader(vertexBlurShader);
    if (!gl.getShaderParameter(vertexBlurShader, gl.COMPILE_STATUS)) {
      throw new Error(gl.getShaderInfoLog(vertexBlurShader)!);
    }

    // fragment shader
    const fragmentBlurShader = gl.createShader(gl.FRAGMENT_SHADER);
    if (!fragmentBlurShader) {
      throw new Error("failed to create fragment shader");
    }
    gl.shaderSource(fragmentBlurShader, FSBlurSource);
    gl.compileShader(fragmentBlurShader);
    if (!gl.getShaderParameter(fragmentBlurShader, gl.COMPILE_STATUS)) {
      throw new Error(gl.getShaderInfoLog(fragmentBlurShader)!);
    }

    // load images
    const image: HTMLImageElement = await WebGLUtility.loadImage(BGImage);
    this.imageResizer = new ImageResizer(image);
    this.resizedImage = await this.imageResizer.getCoveringImage(
      this.canvas.width,
      this.canvas.height,
    );
    this.bgTexture = WebGLUtility.createTexture(gl, this.resizedImage);
    this.textureSize = new Float32Array([
      this.resizedImage.width,
      this.resizedImage.height,
    ]);

    // compile program
    const program = gl.createProgram();
    if (!program) {
      throw new Error("failed to create webgl program");
    }
    gl.attachShader(program, vertexBlurShader);
    gl.attachShader(program, fragmentBlurShader);
    gl.linkProgram(program);
    gl.deleteShader(vertexBlurShader);
    gl.deleteShader(fragmentBlurShader);
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
      throw new Error(gl.getProgramInfoLog(program)!);
    }
    gl.useProgram(program);
    this.blurProgram = program;

    this.tempTexture = gl.createTexture()!;

    this.renderTarget = new RenderTarget(
      this.gl,
      // texture
      this.tempTexture,
      // width
      this.canvas.width,
      // height
      this.canvas.height,
    );

    window.addEventListener(
      "resize",
      () => {
        this.resize();
        this.renderTarget.resize(this.canvas.width, this.canvas.height);
      },
      false,
    );
    this.scrollEventTracker = new ScrollEventTracker();
  }

  setupGeometry() {
    const gl = this.gl;
    const [sy, sx, gy, gx] = [-1, -1, 1, 1];
    const cs0 = [
      sx,
      sy,
      0,
      gx,
      gy,
      0,
      sx,
      gy,
      0,
      gx,
      gy,
      0,
      sx,
      sy,
      0,
      gx,
      sy,
      0,
    ];
    const planeVBO = gl.createBuffer()!;
    gl.bindBuffer(gl.ARRAY_BUFFER, planeVBO);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(cs0), gl.STATIC_DRAW);
    gl.bindBuffer(gl.ARRAY_BUFFER, null);
    this.planeVBO = planeVBO;
    this.planePoints = cs0;
  }

  setupLocation() {
    const gl = this.gl;
    this.attributeLocation = [
      gl.getAttribLocation(this.blurProgram, "position"),
    ];
    this.attributeStride = [3];
    // uniform location の取得
    this.uniformLocation = {
      gaussian: gl.getUniformLocation(this.blurProgram, "gaussian")!,
      horizontal: gl.getUniformLocation(this.blurProgram, "horizontal")!,
      weight: gl.getUniformLocation(this.blurProgram, "weight")!,
      texture0: gl.getUniformLocation(this.blurProgram, "texture0")!,
      texSize: gl.getUniformLocation(this.blurProgram, "texSize")!,
    };
  }
  setupRendering(bindToRenderTarget: boolean) {
    const gl = this.gl;
    if (bindToRenderTarget) {
      this.renderTarget.bind();
    } else {
      this.renderTarget.unbind();
    }
    gl.viewport(0, 0, this.canvas.width, this.canvas.height);
    gl.clearColor(0.3, 0.3, 0.3, 1.0);
    gl.clearDepth(1.0);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
  }

  setupWeight() {
    const scrollY = this.scrollEventTracker.scrollY;
    const weight = getGaussianWeight(scrollY * 0.3 + 1.0, 31);
    this.weight = weight;
  }

  start() {
    this.renderLoop();
  }

  renderLoop() {
    this.setupWeight();
    this.render(true, true);
    this.render(false, false);
    requestAnimationFrame(this.renderLoop);
  }

  render(bindToRenderTarget: boolean, horizontal: boolean) {
    const gl = this.gl;
    this.setupRendering(bindToRenderTarget);

    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, this.bgTexture);

    gl.useProgram(this.blurProgram);
    gl.uniform1i(this.uniformLocation.gaussian, 1);
    gl.uniform1i(this.uniformLocation.horizontal, horizontal ? 1 : 0);
    gl.uniform1fv(this.uniformLocation.weight, this.weight);
    gl.uniform1i(this.uniformLocation.texture0, 0);
    gl.uniform2fv(this.uniformLocation.texSize, this.textureSize);

    // configure VBO
    gl.bindBuffer(gl.ARRAY_BUFFER, this.planeVBO);
    gl.enableVertexAttribArray(this.attributeLocation[0]);
    gl.vertexAttribPointer(
      this.attributeLocation[0],
      this.attributeStride[0],
      gl.FLOAT,
      false,
      0,
      0,
    );
    gl.drawArrays(
      gl.TRIANGLES,
      0,
      this.planePoints.length / this.attributeStride[0],
    );
  }
}
