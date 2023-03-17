import { Mesh, MeshBuilder, Scene } from "babylonjs";
import { AdvancedDynamicTexture, TextBlock } from "babylonjs-gui";

export class TextPlane {
  public mesh: Mesh
  public textBlock: TextBlock;

  constructor(
    name: string,
    width: number,
    height: number,
    x: number,
    y: number,
    z: number,
    text: string,
    backgroundColor: string,
    textColor: string,
    fontSize: number,
    scene: Scene
  ) {
    const textPlane = MeshBuilder.CreatePlane(name + " text plane", {
      width: width,
      height: height,
    });
    textPlane.position.set(x, y, z);
    const planeTexture = AdvancedDynamicTexture.CreateForMesh(
      textPlane,
      width * 100,
      height * 100,
      false
    );
    planeTexture.background = backgroundColor;
    const planeText = new TextBlock(name + " plane text");
    planeText.text = text;
    planeText.color = textColor;
    planeText.fontSize = fontSize;
    planeTexture.addControl(planeText);

    this.mesh = textPlane
    this.textBlock = planeText
  }
}
