import {
  Mesh,
  Vector3,
  Animation,
  CubicEase,
  EasingFunction,
} from '@babylonjs/core';

// Quick arc tween: midpoint lifted above the straight line, eased ease-in-out.
// 300ms (spec §6.5). Phase 2 swaps this for a Catmull-Rom 4-control-point spline.

export function animateArcTo(
  mesh: Mesh,
  to: Vector3,
  durationMs = 300,
): Promise<void> {
  const from = mesh.position.clone();
  const fps = 60;
  const totalFrames = Math.max(1, Math.round((durationMs / 1000) * fps));
  const arcHeight = Math.max(1.5, from.subtract(to).length() * 0.35);

  const peak = new Vector3(
    (from.x + to.x) / 2,
    Math.max(from.y, to.y) + arcHeight,
    (from.z + to.z) / 2,
  );

  const animX = new Animation('arc.x', 'position.x', fps, Animation.ANIMATIONTYPE_FLOAT, Animation.ANIMATIONLOOPMODE_CONSTANT);
  const animY = new Animation('arc.y', 'position.y', fps, Animation.ANIMATIONTYPE_FLOAT, Animation.ANIMATIONLOOPMODE_CONSTANT);
  const animZ = new Animation('arc.z', 'position.z', fps, Animation.ANIMATIONTYPE_FLOAT, Animation.ANIMATIONLOOPMODE_CONSTANT);

  animX.setKeys([
    { frame: 0, value: from.x },
    { frame: Math.round(totalFrames / 2), value: peak.x },
    { frame: totalFrames, value: to.x },
  ]);
  animY.setKeys([
    { frame: 0, value: from.y },
    { frame: Math.round(totalFrames / 2), value: peak.y },
    { frame: totalFrames, value: to.y },
  ]);
  animZ.setKeys([
    { frame: 0, value: from.z },
    { frame: Math.round(totalFrames / 2), value: peak.z },
    { frame: totalFrames, value: to.z },
  ]);

  const ease = new CubicEase();
  ease.setEasingMode(EasingFunction.EASINGMODE_EASEINOUT);
  [animX, animY, animZ].forEach((a) => a.setEasingFunction(ease));

  mesh.animations = [animX, animY, animZ];

  return new Promise<void>((resolve) => {
    const anim = mesh.getScene().beginAnimation(mesh, 0, totalFrames, false, 1.0, () => {
      mesh.position.copyFrom(to);
      resolve();
    });
    // Defensive: if begin returned null (no animations attached), resolve now.
    if (!anim) resolve();
  });
}
