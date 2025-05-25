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
    lookAt: new THREE.Vector3(0.0, 0.51, 0.0),
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
    intensity: 1.0,
  };
  static MATERIAL_PARAM = {
    color: 0xdddddd,
  };
  static CIRCLE_OBJECT_PARAM = {
    ballRadius: 0.3,
    ballAmount: 30,
    circleRadius: 4.5,
    rotationAcceleration: 0.001,
    maxRotationSpeed: 0.1,
    shakeHeadInterval: 10.0,
  };

  renderer;
  scene;
  camera;
  startTime;
  directionalLight;
  ambientLight;
  earth;
  cone;
  axesHelper;

  static loadTexture(path) {
    return new Promise((resolve) => {
      // 地球用画像の読み込みとテクスチャ生成 @@@
      const loader = new THREE.TextureLoader();
      loader.load(path, resolve);
    });
  }

  static createCone() {
    const geometry = new THREE.ConeGeometry( 5, 20, 32 );
    const material = new THREE.MeshBasicMaterial( {color: 0xffff00} );
    return new THREE.Mesh(geometry, material);
  }

  async init(wrapper) {
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
    // this.scene.add(this.ambientLight);

    // earth
    const sphereGeometry = new THREE.SphereGeometry(0.5, 32, 32);
    const earthTexture = await ThreeApp.loadTexture("./earth.jpg");
    const earthMaterial = new THREE.MeshPhongMaterial(ThreeApp.MATERIAL_PARAM);
    earthMaterial.map = earthTexture;
    this.earth = new THREE.Mesh(sphereGeometry, earthMaterial);
    this.scene.add(this.earth);

    // cone
    const cone = ThreeApp.createCone();
    cone.position.set(0, 0.55, 0);
    this.cone = cone;
    // this.scene.add(cone);

    // this のバインド
    this.render = this.render.bind(this);

    this.isTouched = false;
    this.isKeyDown = false;

    window.addEventListener(
      "resize",
      () => {
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.camera.aspect = window.innerWidth / window.innerHeight;
        this.camera.updateProjectionMatrix();
      },
      false,
    );
    this.startTime = performance.now();
  }

  render() {
    requestAnimationFrame(this.render);


    const currentTime = performance.now();
    const elapsed = (currentTime - this.startTime) / 1000.0;
    this.earth.rotation.y = elapsed * 0.04; // 地球の自転
    this.renderer.render(this.scene, this.camera);
  }
}
