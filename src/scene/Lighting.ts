import {
  Scene,
  HemisphericLight,
  DirectionalLight,
  Vector3,
  Color3,
} from '@babylonjs/core';

export function setupLighting(scene: Scene): void {
  const hemi = new HemisphericLight('hemi', new Vector3(0, 1, 0), scene);
  hemi.intensity = 0.65;
  hemi.diffuse = new Color3(1, 1, 1);
  hemi.groundColor = new Color3(0.35, 0.35, 0.45);

  const dir = new DirectionalLight('dir', new Vector3(-0.4, -1, 0.6), scene);
  dir.intensity = 0.85;
  dir.position = new Vector3(8, 14, -8);
}
