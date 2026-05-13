import {
  Scene,
  Mesh,
  MeshBuilder,
  StandardMaterial,
  Color3,
  Vector3,
  PhysicsAggregate,
  PhysicsShapeType,
  SceneLoader,
} from '@babylonjs/core';
import '@babylonjs/loaders/glTF';
import type { Item, ItemType } from '../core/types';
import { getAssetByTypeId, type ResolvedAsset } from './AssetRegistry';
import { uuid } from '../utils/math';

interface SpawnOptions {
  position: Vector3;
  size?: number; // 0.5–1.5
  initialVelocity?: Vector3;
}

const colliderShapeMap: Record<string, PhysicsShapeType> = {
  BOX: PhysicsShapeType.BOX,
  CAPSULE: PhysicsShapeType.CAPSULE,
  SPHERE: PhysicsShapeType.SPHERE,
  CONVEX_HULL: PhysicsShapeType.CONVEX_HULL,
};

const meshTemplateCache = new Map<string, Mesh>();

async function loadOrFallbackMesh(scene: Scene, asset: ResolvedAsset): Promise<Mesh> {
  const cached = meshTemplateCache.get(asset.type.id);
  if (cached) {
    return cached.clone(`${asset.type.id}.${uuid()}`, null, false)!;
  }

  let template: Mesh | null = null;

  try {
    const result = await SceneLoader.ImportMeshAsync(
      '',
      asset.type.meshUrl,
      '',
      scene,
    );
    const root = result.meshes.find((m) => m instanceof Mesh) as Mesh | undefined;
    if (root) {
      root.setEnabled(false);
      root.isVisible = false;
      template = root;
    }
  } catch {
    template = null;
  }

  if (!template) {
    template = buildPrimitive(scene, asset);
    template.setEnabled(false);
    template.isVisible = false;
  }

  meshTemplateCache.set(asset.type.id, template);
  return template.clone(`${asset.type.id}.${uuid()}`, null, false)!;
}

function buildPrimitive(scene: Scene, asset: ResolvedAsset): Mesh {
  const name = `${asset.type.id}.template`;
  let mesh: Mesh;
  switch (asset.fallbackPrimitive) {
    case 'sphere':
      mesh = MeshBuilder.CreateSphere(name, { diameter: 0.9, segments: 12 }, scene);
      break;
    case 'cylinder':
      mesh = MeshBuilder.CreateCylinder(name, { height: 1.0, diameter: 0.7 }, scene);
      break;
    case 'torus':
      mesh = MeshBuilder.CreateTorus(name, { diameter: 1.0, thickness: 0.35, tessellation: 16 }, scene);
      break;
    case 'capsule':
      mesh = MeshBuilder.CreateCapsule(name, { radius: 0.4, height: 1.0 }, scene);
      break;
    case 'box':
    default:
      mesh = MeshBuilder.CreateBox(name, { size: 0.85 }, scene);
      break;
  }
  const mat = new StandardMaterial(`${name}.mat`, scene);
  mat.diffuseColor = new Color3(...asset.fallbackColor);
  mat.specularColor = new Color3(0.15, 0.15, 0.15);
  mesh.material = mat;
  return mesh;
}

export async function createItem(
  scene: Scene,
  typeOrId: ItemType | string,
  options: SpawnOptions,
): Promise<Item> {
  const typeId = typeof typeOrId === 'string' ? typeOrId : typeOrId.id;
  const asset = getAssetByTypeId(typeId);
  if (!asset) {
    throw new Error(`No asset registered for type id: ${typeId}`);
  }
  const type = asset.type;
  const size = options.size ?? 1.0;

  const mesh = await loadOrFallbackMesh(scene, asset);
  mesh.setEnabled(true);
  mesh.isVisible = true;
  mesh.scaling = new Vector3(size, size, size);
  mesh.position = options.position.clone();
  mesh.rotation = new Vector3(Math.random() * Math.PI, Math.random() * Math.PI, 0);

  const shapeType = colliderShapeMap[type.colliderShape] ?? PhysicsShapeType.BOX;
  const mass = type.baseMass * size * size * size;
  const body = new PhysicsAggregate(
    mesh,
    shapeType,
    { mass, restitution: 0.1, friction: 0.4 },
    scene,
  );

  if (options.initialVelocity) {
    body.body.setLinearVelocity(options.initialVelocity);
  }

  const item: Item = {
    id: uuid(),
    type,
    size,
    mesh,
    body,
    isSelectable: true,
    isInTray: false,
  };
  mesh.metadata = { isItem: true, item };
  return item;
}

export function disposeItem(item: Item): void {
  item.body.dispose();
  item.mesh.dispose();
}

export function getItemFromMesh(mesh: { metadata?: unknown } | null | undefined): Item | null {
  if (!mesh) return null;
  const md = (mesh.metadata ?? null) as { isItem?: boolean; item?: Item } | null;
  return md?.isItem && md.item ? md.item : null;
}
