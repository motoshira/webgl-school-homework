import * as THREE from "three";
import { h, render } from "preact";
import { useEffect, useRef } from "preact/hooks";

class CubeParams {
  time: number;
  speed: Float32Array;
  rotationSpeed: Float32Array;
  constructor() {
    this.reset();
  }
  reset() {
    this.speed = new Float32Array([
      Math.random() * 0.2 - 0.1,
      Math.random() * 0.2 - 0.1,
      Math.random() * 1.0,
    ]);
    this.rotationSpeed = new Float32Array([
      Math.random() * 0.3,
      Math.random() * 0.3,
      Math.random() * 0.3,
    ]);
  }
}

class ThreeAppRenderer {
  static CAMERA_PARAM = {
    fovy: 60,
    aspect: window.innerWidth / window.innerHeight,
    near: 0.1,
    far: 110.0,
    position: new THREE.Vector3(0.0, 0.0, 100.0),
    lookAt: new THREE.Vector3(0.0, 0.0, 0.0),
  };
  static RENDERER_PARAM = {
    clearColor: 0x666666,
    width: window.innerWidth,
    height: window.innerHeight,
  };
  static DIRECTIONAL_LIGHT_PARAM = {
    color: 0xffffff,
    intensity: 1.0,
    position: new THREE.Vector3(1.0, 1.0, 1.0), // 光の向き
  };
  static MATERIAL_PARAM = {
    color: 0x3399ff,
  };
  static CUBE_PARAM = {
    amount: 100,
  };

  renderer: THREE.WebGLRenderer;
  scene: THREE.Scene;
  camera: THREE.PerspectiveCamera;
  directionalLight: THREE.DirectionalLight;
  material: THREE.Material;
  cubes: THREE.Mesh[];
  cubeParams: CubeParams[];
  axesHelper: THREE.AxesHelper;
  inRenderLoop: boolean;

  constructor(wrapper: HTMLElement) {
    // Renderer
    const color = new THREE.Color(ThreeAppRenderer.RENDERER_PARAM.clearColor);
    this.renderer = new THREE.WebGLRenderer();
    this.renderer.setClearColor(color);
    this.renderer.setSize(
      ThreeAppRenderer.RENDERER_PARAM.width,
      ThreeAppRenderer.RENDERER_PARAM.height,
    );
    wrapper.appendChild(this.renderer.domElement);

    // Scehe
    this.scene = new THREE.Scene();

    // Camera
    this.camera = new THREE.PerspectiveCamera(
      ThreeAppRenderer.CAMERA_PARAM.fovy,
      ThreeAppRenderer.CAMERA_PARAM.aspect,
      ThreeAppRenderer.CAMERA_PARAM.near,
      ThreeAppRenderer.CAMERA_PARAM.far,
    );
    this.camera.position.copy(ThreeAppRenderer.CAMERA_PARAM.position);
    this.camera.lookAt(ThreeAppRenderer.CAMERA_PARAM.lookAt);
    // Directional Light
    this.directionalLight = new THREE.DirectionalLight(
      ThreeAppRenderer.DIRECTIONAL_LIGHT_PARAM.color,
      ThreeAppRenderer.DIRECTIONAL_LIGHT_PARAM.intensity,
    );
    this.directionalLight.position.copy(
      ThreeAppRenderer.DIRECTIONAL_LIGHT_PARAM.position,
    );
    this.scene.add(this.directionalLight);

    // Material
    this.material = new THREE.MeshLambertMaterial(
      ThreeAppRenderer.MATERIAL_PARAM,
    );

    const cubeGeometry = new THREE.BoxGeometry(1.0, 1.0, 1.0);
    this.cubes = [];
    this.cubeParams = [];
    for (let i = 0; i < ThreeAppRenderer.CUBE_PARAM.amount; ++i) {
      const cube = new THREE.Mesh(cubeGeometry, this.material);
      cube.position.x = 0;
      cube.position.y = 0;
      cube.position.z = 0.0;
      const params = new CubeParams();
      this.cubeParams.push(params);
      this.cubes.push(cube);
      this.scene.add(cube);
    }

    // this のバインド
    this.render = this.render.bind(this);
    this.inRenderLoop = false;

    window.addEventListener(
      "resize",
      () => {
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        const aspect = window.innerWidth / window.innerHeight;
        this.camera.left = -10.0 * aspect;
        this.camera.right = 10.0 * aspect;
        this.camera.updateProjectionMatrix();
      },
      false,
    );
  }
  render() {
    if (!this.inRenderLoop) {
      return;
    }

    for (let i = 0; i < ThreeAppRenderer.CUBE_PARAM.amount; ++i) {
      const cube = this.cubes[i];
      const params = this.cubeParams[i];
      cube.position.x += params.speed[0];
      cube.position.y += params.speed[1];
      cube.position.z += params.speed[2];
      cube.rotation.x += params.rotationSpeed[0];
      cube.rotation.y += params.rotationSpeed[1];
      cube.rotation.z += params.rotationSpeed[2];
      if (cube.position.z > 110.0) {
        // reset
        cube.position.x = 0.0;
        cube.position.y = 0.0;
        cube.position.z = 0.0;
        this.cubeParams[i].reset();
      }
    }

    this.renderer.render(this.scene, this.camera);
    requestAnimationFrame(this.render);
  }
}

const ThreeApp = () => {
  const wrapperRef = useRef(null);
  useEffect(() => {
    const wrapper = wrapperRef.current!;
    const app = new ThreeAppRenderer(wrapper);
    app.inRenderLoop = true;
    app.render();
    return () => {
      app.inRenderLoop = false;
    };
  }, []);
  return <div ref={wrapperRef} />;
};

export default ThreeApp;
