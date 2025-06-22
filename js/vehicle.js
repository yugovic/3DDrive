// 車両システムモジュール
import * as CONFIG from './config.js';

export class VehicleManager {
    constructor(physicsManager, sceneManager) {
        this.physicsManager = physicsManager;
        this.sceneManager = sceneManager;
        
        this.vehicle = null;
        this.chassisBody = null;
        this.chassisMesh = null;
        this.wheelMeshes = [];
        this.wheelBodies = [];
        
        this.modelPath = null;
        this.carModel = null;
        
        this.stabilizationEnabled = true;
    }

    async loadModel(modelPath) {
        return new Promise((resolve, reject) => {
            const loader = new THREE.GLTFLoader();
            loader.load(
                modelPath,
                (gltf) => {
                    this.carModel = gltf.scene;
                    this.carModel.traverse((child) => {
                        if (child.isMesh) {
                            child.castShadow = true;
                            child.receiveShadow = true;
                        }
                    });
                    resolve(this.carModel);
                },
                undefined,
                (error) => {
                    console.error('車両モデルの読み込みエラー:', error);
                    reject(error);
                }
            );
        });
    }

    async createVehicle(modelPath = null, position = CONFIG.DEFAULTS.initialPosition) {
        // モデルの読み込み（パスが指定されている場合）
        if (modelPath) {
            try {
                await this.loadModel(modelPath);
            } catch (error) {
                console.warn('モデル読み込み失敗、デフォルトボックスを使用');
            }
        }

        // シャーシの物理ボディを作成
        const chassisShape = new CANNON.Box(new CANNON.Vec3(
            CONFIG.VEHICLE.chassis.width / 2,
            CONFIG.VEHICLE.chassis.height / 2,
            CONFIG.VEHICLE.chassis.depth / 2
        ));
        
        this.chassisBody = new CANNON.Body({
            mass: CONFIG.VEHICLE.mass,
            shape: chassisShape
        });
        this.chassisBody.position.set(position.x, position.y, position.z);
        this.physicsManager.addBody(this.chassisBody);

        // シャーシのメッシュを作成またはモデルを使用
        if (this.carModel) {
            this.chassisMesh = this.carModel;
            // モデルのスケール調整
            const box = new THREE.Box3().setFromObject(this.carModel);
            const size = box.getSize(new THREE.Vector3());
            const scaleFactor = Math.min(
                CONFIG.VEHICLE.chassis.width / size.x,
                CONFIG.VEHICLE.chassis.height / size.y,
                CONFIG.VEHICLE.chassis.depth / size.z
            );
            this.carModel.scale.multiplyScalar(scaleFactor * 0.9);
        } else {
            // デフォルトのボックスメッシュ
            const chassisGeometry = new THREE.BoxGeometry(
                CONFIG.VEHICLE.chassis.width,
                CONFIG.VEHICLE.chassis.height,
                CONFIG.VEHICLE.chassis.depth
            );
            const chassisMaterial = new THREE.MeshPhongMaterial({ color: 0x0066cc });
            this.chassisMesh = new THREE.Mesh(chassisGeometry, chassisMaterial);
        }
        
        this.chassisMesh.castShadow = true;
        this.chassisMesh.receiveShadow = true;
        this.sceneManager.scene.add(this.chassisMesh);

        // RaycastVehicleの作成
        this.vehicle = new CANNON.RaycastVehicle({
            chassisBody: this.chassisBody,
            indexRightAxis: 0,
            indexForwardAxis: 2,
            indexUpAxis: 1
        });

        // ホイールの追加
        this.addWheels();

        // 車両を物理世界に追加
        this.vehicle.addToWorld(this.physicsManager.world);

        return this.vehicle;
    }

    addWheels() {
        const wheelOptions = {
            radius: CONFIG.VEHICLE.wheel.radius,
            directionLocal: new CANNON.Vec3(0, -1, 0),
            suspensionStiffness: CONFIG.VEHICLE.wheel.suspensionStiffness,
            suspensionRestLength: CONFIG.VEHICLE.wheel.suspensionRestLength,
            frictionSlip: CONFIG.VEHICLE.wheel.frictionSlip,
            dampingRelaxation: CONFIG.VEHICLE.wheel.suspensionDamping,
            dampingCompression: CONFIG.VEHICLE.wheel.suspensionCompression,
            maxSuspensionForce: CONFIG.VEHICLE.wheel.maxSuspensionForce,
            rollInfluence: CONFIG.VEHICLE.wheel.rollInfluence,
            axleLocal: new CANNON.Vec3(1, 0, 0),
            chassisConnectionPointLocal: new CANNON.Vec3(1, 0, 1),
            maxSuspensionTravel: CONFIG.VEHICLE.wheel.maxSuspensionTravel,
            customSlidingRotationalSpeed: -30,
            useCustomSlidingRotationalSpeed: true
        };

        // ホイール位置の定義
        const wheelPositions = [
            { x: -CONFIG.VEHICLE.wheel.axisPosition, y: 0, z: CONFIG.VEHICLE.chassis.depth * 0.35 },  // 前左
            { x: CONFIG.VEHICLE.wheel.axisPosition, y: 0, z: CONFIG.VEHICLE.chassis.depth * 0.35 },   // 前右
            { x: -CONFIG.VEHICLE.wheel.axisPosition, y: 0, z: -CONFIG.VEHICLE.chassis.depth * 0.35 }, // 後左
            { x: CONFIG.VEHICLE.wheel.axisPosition, y: 0, z: -CONFIG.VEHICLE.chassis.depth * 0.35 }   // 後右
        ];

        wheelPositions.forEach((pos, index) => {
            const options = Object.assign({}, wheelOptions);
            options.chassisConnectionPointLocal = new CANNON.Vec3(pos.x, pos.y, pos.z);
            
            // 前輪は操舵可能
            options.isFrontWheel = index < 2;
            
            this.vehicle.addWheel(options);

            // ホイールメッシュの作成
            const wheelGeometry = new THREE.CylinderGeometry(
                CONFIG.VEHICLE.wheel.radius,
                CONFIG.VEHICLE.wheel.radius,
                CONFIG.VEHICLE.wheel.thickness,
                32
            );
            const wheelMaterial = new THREE.MeshPhongMaterial({ color: 0x333333 });
            const wheelMesh = new THREE.Mesh(wheelGeometry, wheelMaterial);
            wheelMesh.castShadow = true;
            wheelMesh.receiveShadow = true;
            wheelMesh.rotation.z = Math.PI / 2;
            
            this.wheelMeshes.push(wheelMesh);
            this.sceneManager.scene.add(wheelMesh);
        });

        // ホイールボディの作成
        this.vehicle.wheelInfos.forEach((wheel) => {
            const cylinderShape = new CANNON.Cylinder(
                CONFIG.VEHICLE.wheel.radius,
                CONFIG.VEHICLE.wheel.radius,
                CONFIG.VEHICLE.wheel.thickness,
                20
            );
            const wheelBody = new CANNON.Body({
                mass: 0,
                material: this.physicsManager.materials.wheel
            });
            
            const quaternion = new CANNON.Quaternion();
            quaternion.setFromAxisAngle(new CANNON.Vec3(0, 0, 1), Math.PI / 2);
            cylinderShape.transformAllPoints(new CANNON.Vec3(), quaternion);
            
            wheelBody.addShape(cylinderShape);
            this.wheelBodies.push(wheelBody);
        });
    }

    update(inputActions, deltaTime) {
        if (!this.vehicle) return;

        // エンジン力の計算
        let engineForce = 0;
        if (inputActions.acceleration) {
            engineForce = inputActions.turbo ? 
                CONFIG.VEHICLE.engine.baseForce * CONFIG.VEHICLE.engine.turboMultiplier : 
                CONFIG.VEHICLE.engine.baseForce;
        } else if (inputActions.braking) {
            engineForce = -CONFIG.VEHICLE.engine.baseForce * 0.5;
        }

        // 速度に応じたエンジン出力の調整
        const speed = this.chassisBody.velocity.length();
        if (speed > CONFIG.VEHICLE.engineForce.highSpeedThreshold) {
            const speedFactor = Math.max(
                CONFIG.VEHICLE.engineForce.minFactorAtHighSpeed,
                1 - (speed - CONFIG.VEHICLE.engineForce.highSpeedThreshold) / 
                    CONFIG.VEHICLE.engineForce.reductionSpeedRange
            );
            engineForce *= speedFactor;
        }

        // 最高速度制限
        if (speed > CONFIG.VEHICLE.engine.maxSpeed && engineForce > 0) {
            engineForce = 0;
        }

        // ブレーキ力
        let brakeForce = 0;
        if (inputActions.braking && !inputActions.acceleration) {
            brakeForce = CONFIG.VEHICLE.engine.brakeForce;
        }
        if (inputActions.handbrake) {
            brakeForce = CONFIG.VEHICLE.engine.brakeForce * 2;
        }

        // ステアリング
        let steering = 0;
        if (inputActions.left) steering = CONFIG.VEHICLE.steering.baseMaxSteerVal;
        if (inputActions.right) steering = -CONFIG.VEHICLE.steering.baseMaxSteerVal;

        // 速度に応じたステアリング感度の調整
        if (speed > CONFIG.VEHICLE.steering.highSpeedThreshold) {
            const steerFactor = Math.max(
                CONFIG.VEHICLE.steering.minFactorAtHighSpeed,
                1 - (speed - CONFIG.VEHICLE.steering.highSpeedThreshold) / 
                    CONFIG.VEHICLE.steering.reductionSpeedRange
            );
            steering *= steerFactor;
        }

        // 車両の制御を適用
        this.vehicle.applyEngineForce(engineForce, 2); // 後左輪
        this.vehicle.applyEngineForce(engineForce, 3); // 後右輪

        this.vehicle.setBrake(brakeForce, 0);
        this.vehicle.setBrake(brakeForce, 1);
        this.vehicle.setBrake(brakeForce, 2);
        this.vehicle.setBrake(brakeForce, 3);

        this.vehicle.setSteeringValue(steering, 0);
        this.vehicle.setSteeringValue(steering, 1);

        // 安定化処理
        if (this.stabilizationEnabled) {
            this.applyStabilization();
        }

        // ホイールメッシュの更新
        this.updateWheelMeshes();
    }

    applyStabilization() {
        // 車両の向きを取得
        const chassisTransform = this.chassisBody.quaternion;
        const up = new CANNON.Vec3(0, 1, 0);
        chassisTransform.vmult(up, up);

        // ロール（横転）の補正
        const rollAxis = new CANNON.Vec3(0, 0, 1);
        chassisTransform.vmult(rollAxis, rollAxis);
        
        const rollAngle = Math.asin(rollAxis.y);
        const rollCorrection = -rollAngle * CONFIG.VEHICLE.stabilization.rollCorrectionStrength;
        const rollTorque = new CANNON.Vec3(0, 0, rollCorrection);
        chassisTransform.vmult(rollTorque, rollTorque);
        
        this.chassisBody.angularVelocity.x *= (1 - CONFIG.VEHICLE.stabilization.rollCorrectionSpeed);
        this.chassisBody.torque.vadd(rollTorque, this.chassisBody.torque);

        // ピッチ（前後傾き）の補正
        const pitchAxis = new CANNON.Vec3(1, 0, 0);
        chassisTransform.vmult(pitchAxis, pitchAxis);
        
        const pitchAngle = Math.asin(pitchAxis.y);
        const pitchCorrection = -pitchAngle * CONFIG.VEHICLE.stabilization.pitchCorrectionStrength;
        const pitchTorque = new CANNON.Vec3(pitchCorrection, 0, 0);
        chassisTransform.vmult(pitchTorque, pitchTorque);
        
        this.chassisBody.angularVelocity.z *= (1 - CONFIG.VEHICLE.stabilization.pitchCorrectionSpeed);
        this.chassisBody.torque.vadd(pitchTorque, this.chassisBody.torque);
    }

    updateWheelMeshes() {
        for (let i = 0; i < this.vehicle.wheelInfos.length; i++) {
            this.vehicle.updateWheelTransform(i);
            const transform = this.vehicle.wheelInfos[i].worldTransform;
            const wheelMesh = this.wheelMeshes[i];
            
            wheelMesh.position.copy(transform.position);
            wheelMesh.quaternion.copy(transform.quaternion);
        }
    }

    syncMeshWithBody() {
        if (this.chassisMesh && this.chassisBody) {
            this.chassisMesh.position.copy(this.chassisBody.position);
            this.chassisMesh.quaternion.copy(this.chassisBody.quaternion);
        }
    }

    reset(position = CONFIG.DEFAULTS.initialPosition) {
        if (this.chassisBody) {
            this.chassisBody.position.set(position.x, position.y, position.z);
            this.chassisBody.velocity.set(0, 0, 0);
            this.chassisBody.angularVelocity.set(0, 0, 0);
            this.chassisBody.quaternion.set(0, 0, 0, 1);
        }
    }

    getSpeed() {
        return this.chassisBody ? this.chassisBody.velocity.length() : 0;
    }

    getPosition() {
        return this.chassisBody ? this.chassisBody.position : new CANNON.Vec3();
    }

    dispose() {
        // 車両を物理世界から削除
        if (this.vehicle) {
            this.vehicle.removeFromWorld(this.physicsManager.world);
        }

        // ボディの削除
        if (this.chassisBody) {
            this.physicsManager.removeBody(this.chassisBody);
        }

        // メッシュの削除
        if (this.chassisMesh) {
            this.sceneManager.scene.remove(this.chassisMesh);
            if (this.chassisMesh.geometry) this.chassisMesh.geometry.dispose();
            if (this.chassisMesh.material) this.chassisMesh.material.dispose();
        }

        this.wheelMeshes.forEach(mesh => {
            this.sceneManager.scene.remove(mesh);
            if (mesh.geometry) mesh.geometry.dispose();
            if (mesh.material) mesh.material.dispose();
        });

        this.wheelMeshes = [];
        this.wheelBodies = [];
    }
}