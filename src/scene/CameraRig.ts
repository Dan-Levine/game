import { Scene, UniversalCamera, Vector3 } from '@babylonjs/core';

// Fixed three-quarter overhead camera. No orbit, rotation, or pinch-zoom.
// Spec §5.
export function setupCamera(scene: Scene, _canvas: HTMLCanvasElement): UniversalCamera {
  const camera = new UniversalCamera('main', new Vector3(0, 8, -8), scene);
  camera.setTarget(Vector3.Zero());
  camera.fov = 0.85; // ~50°
  camera.minZ = 0.1;
  camera.maxZ = 100;
  camera.inputs.clear();
  scene.activeCamera = camera;
  return camera;
}
