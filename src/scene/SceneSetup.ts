import { Engine, Scene, Color4 } from '@babylonjs/core';
import { setupCamera } from './CameraRig';
import { setupLighting } from './Lighting';

export interface SceneContext {
  engine: Engine;
  scene: Scene;
  canvas: HTMLCanvasElement;
}

export function createSceneContext(canvas: HTMLCanvasElement): SceneContext {
  const engine = new Engine(canvas, true, {
    preserveDrawingBuffer: false,
    stencil: true,
    adaptToDeviceRatio: true,
    powerPreference: 'high-performance',
  });

  const scene = new Scene(engine);
  scene.clearColor = new Color4(0.1, 0.1, 0.14, 1.0);

  setupCamera(scene, canvas);
  setupLighting(scene);

  engine.runRenderLoop(() => {
    scene.render();
  });

  window.addEventListener('resize', () => engine.resize());

  return { engine, scene, canvas };
}
