import {
  ArcRotateCamera,
  Color3,
  CubeTexture,
  Engine,
  MeshBuilder,
  Scene,
  StandardMaterial,
  Texture,
  Vector3,
  UniversalCamera,
  HemisphericLight,
  PointLight,
  VideoDome,
  SceneLoader,
  AbstractMesh,
  Animation,
  ParticleSystem,
  Color4,
  Sound,
  PointerDragBehavior,
} from "babylonjs";
import { AdvancedDynamicTexture, TextBlock } from "babylonjs-gui";
import "babylonjs-loaders";
import { HelloSphere, TextPlane } from "./components/meshes";

export class App {
  private engine: Engine;
  private canvas: HTMLCanvasElement;
  private sound: Sound;

  constructor(engine: Engine, canvas: HTMLCanvasElement) {
    this.engine = engine;
    this.canvas = canvas;
    console.log("app is running");
  }

  async createScene() {
    const scene = new Scene(this.engine);
    scene.createDefaultCameraOrLight(false, true, true);
    //this.createCamera(scene)
    //this.createLights(scene)

    //simple sphere
    const sphere = MeshBuilder.CreateSphere("sphere", { diameter: 1.3 }, scene);
    sphere.position.y = -0.5;
    sphere.position.z = 5;

    //this.loadModel(scene)
    //this.addSounds(scene)

    this.createText(scene);

    //hello sphere
    const helloSphere = new HelloSphere("hello sphere", { diameter: 1 }, scene);
    helloSphere.position.set(0, 1, 5);

    //ground
    const groundMaterial = new StandardMaterial("ground material",  scene)
    groundMaterial.backFaceCulling = true
    groundMaterial.diffuseTexture = new Texture('assets/textures/grass.png', scene)
    const ground = MeshBuilder.CreateGround("ground", {width: 12, height: 12}, scene)
    ground.material = groundMaterial
    ground.position.set(0, -1, 8)

    //interactions
    //use behaviors
    const pointerDragBehavior = new PointerDragBehavior({
      dragPlaneNormal: Vector3.Up(),
    });
    sphere.addBehavior(pointerDragBehavior);

    //this.createSkybox(scene);
    //this.createVideoSkyDome(scene);

    this.addInspectorKeyboardShortcut(scene);

    const xr = await scene.createDefaultXRExperienceAsync({
      uiOptions: {
        sessionMode: "immersive-vr",
        //sessionMode: 'immersive-ar'
      },
    });

    //only for debugging
    (window as any).xr = xr;

    return scene;
  }

  createCamera(scene: Scene) {
    //const camera = new ArcRotateCamera('arcCamera', -Math.PI/5, -Math.PI/2, 5, Vector3.Zero(), scene)
    const camera = new UniversalCamera(
      "uniCamera",
      new Vector3(0, 0, -5),
      scene
    );
    camera.attachControl(this.canvas, true);
  }

  createLights(scene: Scene) {
    const hemiLight = new HemisphericLight(
      "hemLight",
      new Vector3(-1, 1, 0),
      scene
    );
    hemiLight.intensity = 0.5;
    hemiLight.diffuse = new Color3(1, 1, 1);

    const pointLight = new PointLight(
      "pointLight",
      new Vector3(0, 1.5, 2),
      scene
    );
    pointLight.intensity = 1;
    pointLight.diffuse = new Color3(1, 0, 0);
  }

  loadModel(scene: Scene) {
    SceneLoader.ImportMeshAsync("", "assets/models/", "H2O.glb", scene).then(
      (result) => {
        const root = result.meshes[0];
        root.id = "h2oRoot";
        root.name = "h2oRoot";
        root.position.y = -1;
        root.rotation = new Vector3(0, 0, Math.PI);
        root.scaling.setAll(1.5);

        this.createAnimation(scene, root);
        this.createParticles(scene);
      }
    );
  }

  createAnimation(scene: Scene, model: AbstractMesh) {
    const animation = new Animation(
      "rotationAnima",
      "rotation",
      30,
      Animation.ANIMATIONTYPE_VECTOR3,
      Animation.ANIMATIONLOOPMODE_CYCLE
    );

    const keyFrames = [
      { frame: 0, value: new Vector3(0, 0, 0) },
      { frame: 30, value: new Vector3(0, 2 * Math.PI, 0) },
    ];
    animation.setKeys(keyFrames);

    model.animations = [];
    model.animations.push(animation);
    scene.beginAnimation(model, 0, 30, true);
  }

  createParticles(scene: Scene) {
    const particleSystem = new ParticleSystem("particles", 5000, scene);
    particleSystem.particleTexture = new Texture(
      "assets/textures/flare.png",
      scene
    );

    particleSystem.emitter = new Vector3(0, 0, 0);
    particleSystem.minEmitBox = new Vector3(0, 0, 0);
    particleSystem.maxEmitBox = new Vector3(0, 0, 0);

    particleSystem.color1 = new Color4(0.7, 0.8, 1.0, 1.0);
    particleSystem.color2 = new Color4(0.3, 0.5, 1.0, 1.0);
    particleSystem.blendMode = ParticleSystem.BLENDMODE_ONEONE;

    particleSystem.minSize = 0.01;
    particleSystem.maxSize = 0.05;

    particleSystem.minLifeTime = 0.3;
    particleSystem.maxLifeTime = 1.5;

    particleSystem.emitRate = 1500;

    particleSystem.direction1 = new Vector3(-1, 8, 1);
    particleSystem.direction2 = new Vector3(1, 8, -1);

    particleSystem.minEmitPower = 0.2;
    particleSystem.maxEmitPower = 0.8;
    particleSystem.updateSpeed = 0.01;

    particleSystem.gravity = new Vector3(0, -9.8, 0);
    particleSystem.start();
  }

  addSounds(scene: Scene) {
    const music = new Sound(
      "music",
      "assets/sounds/hello-xr.mp3",
      scene,
      null,
      {
        loop: true,
        autoplay: false,
      }
    );
    this.sound = new Sound("sound", "assets/sounds/button.mp3", scene, null);
  }

  createText(scene: Scene) {
    const helloPlane = new TextPlane(
      "hello plane",
      3,
      1,
      0,
      2,
      5,
      "Hello XR",
      "white",
      "purple",
      60,
      scene
    );

    helloPlane.textBlock.onPointerUpObservable.add((evtData) => {
      alert("Hello Text at: \n x: " + evtData.x + " y:" + evtData.y);
    });

    helloPlane.textBlock.onPointerDownObservable.add(() => {
      this.sound.play();
    });
  }

  createSkybox(scene: Scene) {
    const skybox = MeshBuilder.CreateBox("skybox", { size: 1000 }, scene);
    const skyboxMaterial = new StandardMaterial("skybox-mat");

    skyboxMaterial.backFaceCulling = false;
    skyboxMaterial.reflectionTexture = new CubeTexture(
      "assets/textures/skybox",
      scene
    );
    skyboxMaterial.reflectionTexture.coordinatesMode = Texture.SKYBOX_MODE;
    skyboxMaterial.diffuseColor = new Color3(0, 0, 0);
    skyboxMaterial.specularColor = new Color3(0, 0, 0);
    skybox.material = skyboxMaterial;
  }

  createVideoSkyDome(scene: Scene) {
    const dome = new VideoDome(
      "videoDome",
      "assets/videos/bridge-360.mp4",
      {
        resolution: 32,
        size: 1000,
      },
      scene
    );
  }

  addInspectorKeyboardShortcut(scene: Scene) {
    window.addEventListener("keydown", (e) => {
      if (e.ctrlKey && e.key === "i") {
        if (scene.debugLayer.isVisible()) scene.debugLayer.hide();
        else scene.debugLayer.show();
      }
    });
  }
}
