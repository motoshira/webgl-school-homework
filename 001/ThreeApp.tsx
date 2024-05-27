import * as THREE from "three";
import { h, render } from "preact";
import { useEffect, useRef } from "preact/hooks";

class CubeParams {
  time: number;
  speed: number;
  rotationSpeed: THREE.Vector3;
  constructor() {}
  reset(cube: THREE.Mesh) {
    const v = Math.random() * 0.4 + 0.1;
    this.speed = v;
    this.rotationSpeed = new THREE.Vector3(
      Math.random() * 0.3,
      Math.random() * 0.3,
      Math.random() * 0.3,
    );
    const r = 4 + Math.random() * 10;
    const theta = Math.random() * 2 * Math.PI;
    cube.position.x = r * Math.cos(theta);
    cube.position.y = r * Math.sin(theta);
    cube.position.z = 0.0;
  }
  updateCube(cube: THREE.Mesh) {
    cube.position.z += this.speed;
    cube.rotation.x += this.rotationSpeed.x;
    cube.rotation.y += this.rotationSpeed.y;
    cube.rotation.z += this.rotationSpeed.z;
    if (cube.position.z > 110.0) {
      this.reset(cube);
    }
  }
}

class ThreeAppRenderer {
  static CAMERA_PARAM = {
    fovy: 60,
    aspect: window.innerWidth / window.innerHeight,
    near: 0.1,
    far: 100.0,
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
    amount: 300,
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
      const params = new CubeParams();
      this.cubeParams.push(params);
      params.reset(cube);
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
    this.camera.rotateZ(0.01);

    for (let i = 0; i < ThreeAppRenderer.CUBE_PARAM.amount; ++i) {
      const cube = this.cubes[i];
      const params = this.cubeParams[i];
      params.updateCube(cube);
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
