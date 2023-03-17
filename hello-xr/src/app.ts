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
  ActionManager,
  Observable,
  Observer,
  Tools,
  WebXRFeaturesManager,
  WebXRDefaultExperience,
  Mesh,
  WebXRFeatureName,
  WebXRMotionControllerTeleportation,
  TransformNode,
  MultiPointerScaleBehavior,
  GizmoManager,
  PointerEventTypes,
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
    scene.actionManager = new ActionManager(scene);

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
    helloSphere.sayHello("this a test.");
    helloSphere.isPickable = true;

    //ground
    const groundMaterial = new StandardMaterial("ground material", scene);
    groundMaterial.backFaceCulling = true;
    groundMaterial.diffuseTexture = new Texture(
      "assets/textures/grass.png",
      scene
    );
    const ground = MeshBuilder.CreateGround(
      "ground",
      { width: 12, height: 12 },
      scene
    );
    ground.material = groundMaterial;
    ground.position.set(0, -1, 8);

    //interactions
    //use behaviors
    const pointerDragBehavior = new PointerDragBehavior({
      dragPlaneNormal: Vector3.Up(),
    });

    pointerDragBehavior.onDragStartObservable.add((evtData) => {
      console.log(
        "drag start: pointer id -" + pointerDragBehavior,
        evtData.pointerId
      );
      console.log(evtData);
    });
    sphere.addBehavior(pointerDragBehavior);

    const helloSphereDragBehavior = new PointerDragBehavior({
      dragPlaneNormal: Vector3.Backward(),
    });
    helloSphere.addBehavior(helloSphereDragBehavior);

    //multiple pointer scale
    const multiPointerScaleBehavior = new MultiPointerScaleBehavior();
    helloSphere.addBehavior(multiPointerScaleBehavior);

    //more behaviors
    //default gizmo
    const gizmoManager = new GizmoManager(scene);
    // gizmoManager.positionGizmoEnabled = true
    // gizmoManager.rotationGizmoEnabled = true
    // gizmoManager.scaleGizmoEnabled = true
    gizmoManager.boundingBoxGizmoEnabled = true;

    //this.createSkybox(scene);
    //this.createVideoSkyDome(scene);

    //use observables (@ Can be shifted to hello-mesh.ts class)
    //1. create an observable for detecting intersections
    const onIntersectObservable = new Observable<boolean>();
    scene.registerBeforeRender(function () {
      const isIntersecting = sphere.intersectsMesh(helloSphere, true, true);
      onIntersectObservable.notifyObservers(isIntersecting);
    });
    helloSphere.onInterectObservable = onIntersectObservable;
    const redColor = Color3.Red();
    const whiteColor = Color3.White();
    helloSphere.onInterectObservable.add((isIntersecting) => {
      const material = helloSphere.mesh.material as StandardMaterial;
      const isRed = material.diffuseColor === redColor;
      if (isIntersecting && !isRed) {
        material.diffuseColor = redColor;
      } else if (!isIntersecting && isRed) {
        material.diffuseColor = whiteColor;
      }
    });

    //2. create an observable for check distance
    const onDistanceChangeObservable = new Observable<number>();
    let previousState: number = null;
    scene.onBeforeRenderObservable.add(() => {
      const currentState = Vector3.Distance(
        sphere.position,
        helloSphere.position
      );
      if (currentState !== previousState) {
        console.log("distance updated!");
        previousState = currentState;
        onDistanceChangeObservable.notifyObservers(currentState);
      }
    });

    helloSphere.onDistanceChangeObservable = onDistanceChangeObservable;
    const blueColor = Color3.Blue();
    helloSphere.onDistanceChangeObservable.add((distance) => {
      const isCloseEnough = distance <= 1.2;
      const material = helloSphere.mesh.material as StandardMaterial;
      const isBlue = material.diffuseColor === blueColor;
      const isRed = material.diffuseColor === redColor;
      if (isCloseEnough && !isBlue && !isRed) {
        material.diffuseColor = blueColor;
      } else if (!isCloseEnough && isBlue) {
        material.diffuseColor = whiteColor;
      }
    });

    //3. create observer (Display distance on text block)
    const observer = new Observer<number>((distance) => {
      helloSphere.label.textBlock.text = "d: " + distance.toFixed(2);
    }, -1);
    //onDistanceChangeObservable.observers.push(observer)

    //4. add observer using coroutine
    const addObserverCoroutine = function* () {
      console.log("frame " + scene.getFrameId() + ": do nothing");
      yield;
      console.log("frame " + scene.getFrameId() + ": add observer");
      onDistanceChangeObservable.observers.push(observer);
      yield;
      console.log("frame " + scene.getFrameId() + ": do nothing");
    };
    scene.onBeforeRenderObservable.runCoroutineAsync(addObserverCoroutine());

    const coroutine = function* () {
      (async function () {
        await Tools.DelayAsync(2000);
        console.log("frame " + scene.getFrameId() + ": fn 1");
      })();
      yield;
      (async function () {
        await Tools.DelayAsync(2000);
        console.log("frame " + scene.getFrameId() + ": fn 2");
      })();
      yield;
      (async function () {
        console.log("frame " + scene.getFrameId() + ": fn 3");
      })();
      yield Tools.DelayAsync(1000);
      (async function () {
        console.log("frame " + scene.getFrameId() + ": fn 4");
      })();
    };
    scene.onBeforeRenderObservable.runCoroutineAsync(coroutine());

    this.addInspectorKeyboardShortcut(scene);

    // XR session
    const xr = await scene.createDefaultXRExperienceAsync({
      uiOptions: {
        sessionMode: "immersive-vr",
        //sessionMode: 'immersive-ar'
      },
    });

    //only for debugging
    (window as any).xr = xr;

    const featureManager = xr.baseExperience.featuresManager;
    console.log(WebXRFeaturesManager.GetAvailableFeatures());

    //locomotion
    const movement = MovementMode.Teleportation; //Teleportation, Contoller, Walk
    this.initLocomotion(movement, xr, featureManager, ground, scene);

    //hand tracking (Requires Oculus Quest 2)
    try {
      featureManager.enableFeature(WebXRFeatureName.HAND_TRACKING, "latest", {
        xrInput: xr.input,
        jointMeshes: {
          disableDefaultHandMesh: false,
          // disableDefaultHandMesh: true,
        },
      });
    } catch (error) {
      console.log(error);
    }

    //hand/controller drag
    let mesh: AbstractMesh;
    xr.input.onControllerAddedObservable.add((controller) => {
      controller.onMotionControllerInitObservable.add((motionController) => {
        // const ids = motionController.getComponentIds()
        // const trigger = motionController.getComponent(ids[0])
        const trigger = motionController.getComponentOfType("trigger");
        trigger.onButtonStateChangedObservable.add(() => {
          if (trigger.changes.pressed) {
            if (
              (mesh = xr.pointerSelection.getMeshUnderPointer(
                controller.uniqueId
              ))
            ) {
              console.log("mesh under controller pointer: " + mesh.name);
              if (mesh.name !== "ground") {
                const distance = Vector3.Distance(
                  motionController.rootMesh.getAbsolutePosition(),
                  mesh.getAbsolutePosition()
                );
                console.log("distance: " + distance);
                if (distance < 1) {
                  mesh.setParent(motionController.rootMesh);
                  console.log("grab mesh: " + mesh.name);
                }
              }
            } else {
              if (mesh && mesh.parent) {
                mesh.setParent(null);
                console.log("release mesh: " + mesh.name);
              }
            }
          }
        });
      });
    });

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

  initLocomotion(
    movement: MovementMode,
    xr: WebXRDefaultExperience,
    featureManager: WebXRFeaturesManager,
    ground: Mesh,
    scene: Scene
  ) {
    switch (movement) {
      case MovementMode.Teleportation:
        console.log("movement mode: teleportation");
        const teleportation = featureManager.enableFeature(
          WebXRFeatureName.TELEPORTATION,
          "stable",
          {
            xrInput: xr.input,
            floorMeshes: [ground],
            timeToTeleport: 2000,
            useMainComponentOnly: true,
            defaultTargetMeshOptions: {
              teleportationFillColor: "#55FF99",
              teleportationBorderColor: "blue",
              torusArrowMaterial: ground.material,
            },
          },
          true,
          true
        ) as WebXRMotionControllerTeleportation;
        teleportation.parabolicRayEnabled = true;
        teleportation.parabolicCheckRadius = 2;
        break;

      case MovementMode.Contoller:
        console.log("movement mode: controller");
        featureManager.disableFeature(WebXRFeatureName.TELEPORTATION);
        featureManager.enableFeature(WebXRFeatureName.MOVEMENT, "latest", {
          xrInput: xr.input,
        });
        break;

      case MovementMode.Walk:
        console.log("movement mode: walk");
        featureManager.disableFeature(WebXRFeatureName.TELEPORTATION);
        const xrRoot = new TransformNode("xr root", scene);
        xr.baseExperience.camera.parent = xrRoot;
        featureManager.enableFeature(
          WebXRFeatureName.WALKING_LOCOMOTION,
          "latest",
          {
            locomotionTarget: xrRoot,
          }
        );
        break;
    }
  }
}

enum MovementMode {
  Teleportation,
  Contoller,
  Walk,
}
