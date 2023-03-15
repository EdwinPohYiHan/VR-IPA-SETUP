import { Engine, Scene, AbstractMesh } from "babylonjs";
import "babylonjs-loaders";
export declare class App {
    private engine;
    private canvas;
    private sound;
    constructor(engine: Engine, canvas: HTMLCanvasElement);
    createScene(): Promise<Scene>;
    createCamera(scene: Scene): void;
    createLights(scene: Scene): void;
    loadModel(scene: Scene): void;
    createAnimation(scene: Scene, model: AbstractMesh): void;
    createParticles(scene: Scene): void;
    addSounds(scene: Scene): void;
    createText(scene: Scene): void;
    createSkybox(scene: Scene): void;
    createVideoSkyDome(scene: Scene): void;
    addInspectorKeyboardShortcut(scene: Scene): void;
}
