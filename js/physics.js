// Cannon.js物理エンジン管理モジュール
import * as CONFIG from './config.js';

// Cannon.jsデバッグレンダラークラス
class CannonDebugRenderer {
    constructor(scene, world) {
        this.scene = scene;
        this.world = world;
        this.meshes = [];
        this.material = new THREE.LineBasicMaterial({ 
            color: 0x00ff00,
            linewidth: 1,
            opacity: 0.7,
            transparent: true
        });
    }

    update() {
        // 既存のデバッグメッシュをクリア
        this.clear();

        // 各物理ボディに対してワイヤーフレームを作成
        this.world.bodies.forEach(body => {
            body.shapes.forEach((shape, shapeIndex) => {
                const mesh = this.createMeshForShape(shape, body, shapeIndex);
                if (mesh) {
                    this.scene.add(mesh);
                    this.meshes.push(mesh);
                }
            });
        });
    }

    createMeshForShape(shape, body, shapeIndex) {
        let geometry = null;
        const shapeWorldPos = new CANNON.Vec3();
        const shapeWorldQuat = new CANNON.Quaternion();
        body.pointToWorldFrame(shape.position || new CANNON.Vec3(), shapeWorldPos);
        body.quaternion.mult(shape.orientation || new CANNON.Quaternion(), shapeWorldQuat);

        if (shape instanceof CANNON.Box) {
            // ボックス形状
            const halfExtents = shape.halfExtents;
            geometry = new THREE.BoxGeometry(
                halfExtents.x * 2,
                halfExtents.y * 2,
                halfExtents.z * 2
            );
        } else if (shape instanceof CANNON.Sphere) {
            // 球形状
            geometry = new THREE.SphereGeometry(shape.radius, 8, 6);
        } else if (shape instanceof CANNON.Plane) {
            // 平面形状
            geometry = new THREE.PlaneGeometry(100, 100, 10, 10);
        } else if (shape instanceof CANNON.ConvexPolyhedron) {
            // 凸多面体形状
            const vertices = [];
            const indices = [];
            
            // 頂点を追加
            shape.vertices.forEach(v => {
                vertices.push(v.x, v.y, v.z);
            });
            
            // 面のインデックスを追加
            shape.faces.forEach(face => {
                // face が配列でない場合は処理をスキップ
                if (!Array.isArray(face) || face.length < 3) {
                    console.warn('Invalid face data:', face);
                    return;
                }
                const faceVertices = face.map(i => i);
                for (let i = 1; i < faceVertices.length - 1; i++) {
                    indices.push(faceVertices[0], faceVertices[i], faceVertices[i + 1]);
                }
            });
            
            geometry = new THREE.BufferGeometry();
            geometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
            geometry.setIndex(indices);
        } else if (shape instanceof CANNON.Heightfield) {
            // ハイトフィールド形状（地形用）
            const data = shape.data;
            const elementSize = shape.elementSize;
            const vertices = [];
            const indices = [];
            
            // グリッドポイントを作成
            for (let i = 0; i < data.length; i++) {
                for (let j = 0; j < data[i].length; j++) {
                    vertices.push(
                        (i - data.length / 2) * elementSize,
                        data[i][j],
                        (j - data[i].length / 2) * elementSize
                    );
                }
            }
            
            // グリッドのインデックスを作成
            for (let i = 0; i < data.length - 1; i++) {
                for (let j = 0; j < data[i].length - 1; j++) {
                    const a = i * data[i].length + j;
                    const b = a + 1;
                    const c = (i + 1) * data[i].length + j;
                    const d = c + 1;
                    
                    indices.push(a, b, c);
                    indices.push(b, d, c);
                }
            }
            
            geometry = new THREE.BufferGeometry();
            geometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
            geometry.setIndex(indices);
        }

        if (geometry) {
            const edges = new THREE.EdgesGeometry(geometry);
            const mesh = new THREE.LineSegments(edges, this.material);
            
            // 位置と回転を設定
            mesh.position.copy(shapeWorldPos);
            mesh.quaternion.set(
                shapeWorldQuat.x,
                shapeWorldQuat.y,
                shapeWorldQuat.z,
                shapeWorldQuat.w
            );
            
            return mesh;
        }
        
        return null;
    }

    clear() {
        this.meshes.forEach(mesh => {
            this.scene.remove(mesh);
            if (mesh.geometry) mesh.geometry.dispose();
        });
        this.meshes = [];
    }

    dispose() {
        this.clear();
        if (this.material) this.material.dispose();
    }
}

export class PhysicsManager {
    constructor() {
        this.world = null;
        this.materials = {};
        this.debugMode = false;
        this.debugMeshes = [];
        this.debugRenderer = null;
    }

    init() {
        // 物理世界の作成
        this.world = new CANNON.World();
        this.world.gravity.set(
            CONFIG.PHYSICS.gravity.x,
            CONFIG.PHYSICS.gravity.y,
            CONFIG.PHYSICS.gravity.z
        );
        
        // ブロードフェーズの設定
        this.world.broadphase = new CANNON.SAPBroadphase(this.world);
        this.world.broadphase.axisIndex = 0;
        
        // ソルバーの設定
        this.world.solver.iterations = 10;
        this.world.defaultContactMaterial.friction = CONFIG.PHYSICS.defaultMaterial.friction;
        this.world.defaultContactMaterial.restitution = CONFIG.PHYSICS.defaultMaterial.restitution;
        
        // マテリアルの作成
        this.createMaterials();
    }

    createMaterials() {
        // 地面マテリアル
        this.materials.ground = new CANNON.Material('ground');
        this.materials.ground.friction = CONFIG.PHYSICS.groundMaterial.friction;
        this.materials.ground.restitution = CONFIG.PHYSICS.groundMaterial.restitution;
        
        // 車輪マテリアル
        this.materials.wheel = new CANNON.Material('wheel');
        
        // コンタクトマテリアル（車輪と地面の接触）
        const wheelGroundContact = new CANNON.ContactMaterial(
            this.materials.wheel,
            this.materials.ground,
            {
                friction: CONFIG.PHYSICS.contactMaterial.friction,
                restitution: CONFIG.PHYSICS.contactMaterial.restitution,
                contactEquationStiffness: CONFIG.PHYSICS.contactMaterial.contactEquationStiffness,
                contactEquationRelaxation: CONFIG.PHYSICS.contactMaterial.contactEquationRelaxation
            }
        );
        this.world.addContactMaterial(wheelGroundContact);
    }

    update(deltaTime) {
        if (this.world) {
            try {
                this.world.step(deltaTime);
            } catch (error) {
                console.error('Cannon.js stepエラー:', error);
                console.error('エラースタック:', error.stack);
                // エラーが発生した場合でも継続する
            }
        }
        
        // デバッグ表示の更新
        if (this.debugMode) {
            this.updateDebugVisuals();
        }
    }

    addBody(body) {
        this.world.addBody(body);
    }

    removeBody(body) {
        this.world.removeBody(body);
    }

    setDebugMode(enabled, scene) {
        this.debugMode = enabled;
        
        if (enabled && !this.debugRenderer) {
            // デバッグレンダラーを作成
            this.debugRenderer = new CannonDebugRenderer(scene, this.world);
        } else if (!enabled && this.debugRenderer) {
            // デバッグレンダラーを破棄
            this.debugRenderer.dispose();
            this.debugRenderer = null;
        }
    }

    updateDebugVisuals() {
        // デバッグレンダラーの更新
        if (this.debugRenderer) {
            this.debugRenderer.update();
        }
    }

    clearDebugVisuals(scene) {
        if (this.debugRenderer) {
            this.debugRenderer.clear();
        }
        this.debugMeshes.forEach(mesh => {
            scene.remove(mesh);
            if (mesh.geometry) mesh.geometry.dispose();
            if (mesh.material) mesh.material.dispose();
        });
        this.debugMeshes = [];
    }

    createGroundBody(width = 200, height = 200) {
        const groundShape = new CANNON.Box(new CANNON.Vec3(width / 2, 0.1, height / 2));
        const groundBody = new CANNON.Body({
            mass: 0, // 静的ボディ
            shape: groundShape,
            material: this.materials.ground
        });
        groundBody.position.set(0, -0.1, 0);
        this.addBody(groundBody);
        return groundBody;
    }

    createBoxBody(size, mass = 1, position = { x: 0, y: 0, z: 0 }) {
        const shape = new CANNON.Box(new CANNON.Vec3(size.x / 2, size.y / 2, size.z / 2));
        const body = new CANNON.Body({
            mass: mass,
            shape: shape
        });
        body.position.set(position.x, position.y, position.z);
        this.addBody(body);
        return body;
    }

    createSphereBody(radius, mass = 1, position = { x: 0, y: 0, z: 0 }) {
        const shape = new CANNON.Sphere(radius);
        const body = new CANNON.Body({
            mass: mass,
            shape: shape
        });
        body.position.set(position.x, position.y, position.z);
        this.addBody(body);
        return body;
    }

    // Three.jsのメッシュとCannon.jsのボディを同期
    syncMeshWithBody(mesh, body) {
        mesh.position.copy(body.position);
        mesh.quaternion.copy(body.quaternion);
    }

    dispose() {
        // デバッグレンダラーのクリーンアップ
        if (this.debugRenderer) {
            this.debugRenderer.dispose();
            this.debugRenderer = null;
        }
        
        // 物理世界のクリーンアップ
        if (this.world) {
            // すべてのボディを削除
            while (this.world.bodies.length > 0) {
                this.world.removeBody(this.world.bodies[0]);
            }
            
            // すべての制約を削除
            while (this.world.constraints.length > 0) {
                this.world.removeConstraint(this.world.constraints[0]);
            }
        }
    }
}