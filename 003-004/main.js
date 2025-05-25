import * as THREE from "three";

window.addEventListener(
  "DOMContentLoaded",
  async () => {
    const wrapper = document.querySelector("#webgl");
    const app = new ThreeApp();
    await app.init(wrapper);
    app.render();
  },
  false,
);

class ThreeApp {
  static CAMERA_PARAM = {
    fovy: 60,
    aspect: window.innerWidth / window.innerHeight,
    near: 0.01,
    far: 20.0,
    position: new THREE.Vector3(0.0, 0.0, 0.9),
    lookAt: new THREE.Vector3(0.0, 0.5, 0.0),
  };
  static DIRECTIONAL_LIGHT_PARAM = {
    color: 0xffffff,
    intensity: 1.0,
    position: new THREE.Vector3(0.0, 0.2, 1.0),
    targetPosition:new THREE.Vector3(0.0, 0.0, 0.0),
  };
  static RENDERER_PARAM = {
    clearColor: 0x666666,
    width: window.innerWidth,
    height: window.innerHeight,
  };
  static AMBIENT_LIGHT_PARAM = {
    color: 0xffffff,
    intensity: 0.5,
  };
  static MATERIAL_PARAM = {
    color: 0xdddddd,
  };
  static EARTH_PARAM = {
    radius: 0.5,
    widthSegments: 32,
    heightSegments: 32,
  }
  static CONE_PARAM = {
    color: 0xffffff,
    height: 0.01,
    radius: 0.01,
    // init position/rotation
    position: new THREE.Vector3(0, 0.0, 0.55),
    rotation: new THREE.Vector3(0, 0, 0),
    speed: 0.1,
    // turnScale: 0.0015,
    distance: 0.55,
  };

  renderer;
  scene;
  camera;
  clock;
  directionalLight;
  ambientLight;
  earth;
  cone;
  coneDirection;
  prevConeDirection;
  axesHelper;

  static loadTexture(path) {
    return new Promise((resolve) => {
      // 地球用画像の読み込みとテクスチャ生成 @@@
      const loader = new THREE.TextureLoader();
      loader.load(path, resolve);
    });
  }

  static createCone() {
    const { color, height, radius } = ThreeApp.CONE_PARAM;
    const geometry = new THREE.ConeGeometry( radius, height, 32 );
    const material = new THREE.MeshLambertMaterial( {color} );
    const cone = new THREE.Mesh(geometry, material);
    return cone;
  }

  async init(wrapper) {
    this.clock = new THREE.Clock({autoStart: true})
    const color = new THREE.Color(ThreeApp.RENDERER_PARAM.clearColor);
    this.renderer = new THREE.WebGLRenderer();
    this.renderer.setClearColor(color);
    this.renderer.setSize(
      ThreeApp.RENDERER_PARAM.width,
      ThreeApp.RENDERER_PARAM.height,
    );
    wrapper.appendChild(this.renderer.domElement);

    this.scene = new THREE.Scene();

    this.camera = new THREE.PerspectiveCamera(
      ThreeApp.CAMERA_PARAM.fovy,
      ThreeApp.CAMERA_PARAM.aspect,
      ThreeApp.CAMERA_PARAM.near,
      ThreeApp.CAMERA_PARAM.far,
    );
    this.camera.position.copy(ThreeApp.CAMERA_PARAM.position);
    this.camera.lookAt(ThreeApp.CAMERA_PARAM.lookAt);

    this.directionalLight = new THREE.DirectionalLight(
      ThreeApp.AMBIENT_LIGHT_PARAM.color,
      ThreeApp.AMBIENT_LIGHT_PARAM.intensity,
    );

    // this.directionalLight.position.set(ThreeApp.DIRECTIONAL_LIGHT_PARAM.position);
    this.directionalLight.position.copy(ThreeApp.DIRECTIONAL_LIGHT_PARAM.position);
    this.directionalLight.target.position.copy(ThreeApp.DIRECTIONAL_LIGHT_PARAM.targetPosition);
    this.scene.add(this.directionalLight);

    this.ambientLight = new THREE.AmbientLight(
      ThreeApp.AMBIENT_LIGHT_PARAM.color,
      ThreeApp.AMBIENT_LIGHT_PARAM.intensity,
    );
    this.scene.add(this.ambientLight);

    // earth
    const sphereGeometry = new THREE.SphereGeometry(ThreeApp.EARTH_PARAM.radius, ThreeApp.EARTH_PARAM.widthSegments, ThreeApp.EARTH_PARAM.heightSegments)
      const earthTexture = await ThreeApp.loadTexture("./earth.jpg");
      const earthMaterial = new THREE.MeshPhongMaterial(ThreeApp.MATERIAL_PARAM);
    earthMaterial.map = earthTexture;
    this.earth = new THREE.Mesh(sphereGeometry, earthMaterial);
    this.scene.add(this.earth);

    // cone
    const cone = ThreeApp.createCone();
    cone.position.copy(ThreeApp.CONE_PARAM.position);
    this.cone = cone;
    this.scene.add(cone);

    this.coneDirection = new THREE.Vector3(1.0, 0.0);

    // this のバインド
    this.render = this.render.bind(this);

    window.addEventListener(
      "resize",
      () => {
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.camera.aspect = window.innerWidth / window.innerHeight;
        this.camera.updateProjectionMatrix();
      },
      false,
    );
  }

  updateConePositionAndRotation() {
    // const direction = this.coneDirection.clone();
    const elapsed = this.clock.getElapsedTime();
    /* const sub = new THREE.Vector3().subVectors(this.earth.position, this.cone.position);
     * sub.normalize();
     * this.coneDirection.add(sub.multiplyScalar(ThreeApp.CONE_PARAM.turnScale));
     * this.coneDirection.normalize();
     * this.cone.position.add(this.coneDirection.clone().multiplyScalar(ThreeApp.CONE_PARAM.speed)); */

    const theta = elapsed * ThreeApp.CONE_PARAM.speed;
    const newX = 0.0;
    const newY = Math.cos(theta) * ThreeApp.CONE_PARAM.distance;
    const newZ = Math.sin(theta) * ThreeApp.CONE_PARAM.distance;
    this.cone.position.set(newX, newY, newZ);
    // TODO update cone rotation
  }

  render() {
    requestAnimationFrame(this.render);
    const elapsed = this.clock.getElapsedTime();
    this.earth.rotation.y = elapsed * 0.04; // 地球の自転

    this.updateConePositionAndRotation();
    // TODO update camera position

    this.renderer.render(this.scene, this.camera);
  }
}
