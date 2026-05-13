import {
  Scene,
  Mesh,
  MeshBuilder,
  PhysicsAggregate,
  PhysicsShapeType,
  Vector3,
} from '@babylonjs/core';

export interface ContainerParams {
  width: number;
  depth: number;
  height: number;
}

export interface Container {
  floor: Mesh;
  walls: Mesh[];
  dispose(): void;
}

const WALL_THICKNESS = 0.5;

// Invisible open-topped box. Phase 1 implements only the Flat shape; other
// variants (Stepped/Tilted/MultiCompartment) land in Phase 3 (spec §3.5).
export function buildContainer(scene: Scene, params: ContainerParams): Container {
  const { width, depth, height } = params;
  const halfW = width / 2;
  const halfD = depth / 2;

  const floor = MeshBuilder.CreateBox(
    'container.floor',
    { width, height: 0.2, depth },
    scene,
  );
  floor.position = new Vector3(0, -0.1, 0);
  floor.isVisible = false;
  new PhysicsAggregate(
    floor,
    PhysicsShapeType.BOX,
    { mass: 0, restitution: 0.1, friction: 0.4 },
    scene,
  );

  const wallSpecs: Array<{ name: string; position: Vector3; size: Vector3 }> = [
    {
      name: 'wall.left',
      position: new Vector3(-halfW - WALL_THICKNESS / 2, height / 2, 0),
      size: new Vector3(WALL_THICKNESS, height, depth + 2 * WALL_THICKNESS),
    },
    {
      name: 'wall.right',
      position: new Vector3(halfW + WALL_THICKNESS / 2, height / 2, 0),
      size: new Vector3(WALL_THICKNESS, height, depth + 2 * WALL_THICKNESS),
    },
    {
      name: 'wall.back',
      position: new Vector3(0, height / 2, halfD + WALL_THICKNESS / 2),
      size: new Vector3(width, height, WALL_THICKNESS),
    },
    {
      name: 'wall.front',
      position: new Vector3(0, height / 2, -halfD - WALL_THICKNESS / 2),
      size: new Vector3(width, height, WALL_THICKNESS),
    },
  ];

  const walls = wallSpecs.map((spec) => {
    const w = MeshBuilder.CreateBox(
      spec.name,
      { width: spec.size.x, height: spec.size.y, depth: spec.size.z },
      scene,
    );
    w.position = spec.position;
    w.isVisible = false;
    new PhysicsAggregate(
      w,
      PhysicsShapeType.BOX,
      { mass: 0, restitution: 0.1, friction: 0.4 },
      scene,
    );
    return w;
  });

  return {
    floor,
    walls,
    dispose() {
      floor.dispose();
      walls.forEach((w) => w.dispose());
    },
  };
}
