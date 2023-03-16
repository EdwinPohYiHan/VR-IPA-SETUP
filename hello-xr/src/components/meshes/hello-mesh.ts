import {
  AbstractMesh,
  ActionManager,
  Color3,
  ExecuteCodeAction,
  InterpolateValueAction,
  Mesh,
  MeshBuilder,
  Observable,
  PredicateCondition,
  Scene,
  SetValueAction,
  StandardMaterial,
  Vector3,
} from "babylonjs";
import { TextPlane } from "./text-plane";

export interface HelloMesh {
  scene: Scene;
  mesh: Mesh;
  label: TextPlane;
  onDistanceChangeObservable: Observable<number>
  onInterectObservable: Observable<boolean>

  sayHello(message?: string): void;
}

export class HelloSphere extends AbstractMesh implements HelloMesh {
  scene: Scene;
  mesh: Mesh;
  label: TextPlane;
  onDistanceChangeObservable: Observable<number>
  onInterectObservable: Observable<boolean>

  constructor(name: string, options: { diameter: number }, scene: Scene) {
    super(name, scene);
    this.scene = scene;
    this.mesh = MeshBuilder.CreateSphere("hello sphere mesh", options, scene);
    this.mesh.material = new StandardMaterial("hello sphere material", scene);
    this.addChild(this.mesh);
    this.label = new TextPlane(
      "hello sphere label",
      1.5,
      1,
      0,
      options.diameter / 2 + 0.2,
      0,
      "hello sphere",
      "purple",
      "white",
      25,
      scene
    );
    this.addChild(this.label.mesh);
    this.initActions();
  }

  sayHello(message?: string): void {
    console.log("message from hello sphere: " + message);
  }

  private initActions() {
    const actionManager = (this.actionManager = new ActionManager(this.scene));
    actionManager.isRecursive = true;

    const light = this.scene.getLightById("default light");

    //Switch ON/OFF lights
    actionManager
      .registerAction(
        new InterpolateValueAction(
          ActionManager.OnPickDownTrigger,
          light,
          "diffuse",
          Color3.Black(),
          1000
        )
      )
      .then(
        new InterpolateValueAction(
          ActionManager.OnPickDownTrigger,
          light,
          "diffuse",
          Color3.White(),
          1000
        )
      );

    //Scale up sphere
    actionManager.registerAction(
      new InterpolateValueAction(
        ActionManager.OnPickDownTrigger,
        this,
        "scaling",
        new Vector3(2, 2, 2),
        1000,
        new PredicateCondition(actionManager, () => {
          return light.diffuse.equals(Color3.Black());
        })
      )
    );

    //Collision
    const otherMesh = this.scene.getMeshById("sphere");
    actionManager.registerAction(
      new SetValueAction(
        {
          trigger: ActionManager.OnIntersectionEnterTrigger,
          parameter: {
            mesh: otherMesh,
            usePreciseIntersection: true,
          },
        },
        this.mesh.material,
        "wireframe",
        true
      )
    );

    //Reset sphere
    this.scene.actionManager.registerAction(
      new ExecuteCodeAction(
        {
          trigger: ActionManager.OnKeyUpTrigger,
          parameter: "r",
        },
        () => {
          this.scaling.setAll(1);
          this.mesh.material.wireframe = false;
          console.log("r was pressed: reset " + this.name);
        }
      )
    );
  }
}
