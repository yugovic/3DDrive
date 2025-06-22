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
        this.boundingBoxHelper = null;
        
        this.stabilizationEnabled = true;
        this.showBoundingBox = true; // デフォルトで表示
        this.heightOffset = 0; // デバッグ用の高さオフセット
        this.debugClearance = -0.15; // デバッグ用の車高調整値（タイヤを下げて地面に接地）
        this.modelYOffset = -0.2; // 3Dモデルの表示オフセット（コリジョンオフセットと同じ値）
        this.reversingState = false; // バック走行状態を記憶
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
            mass: CONFIG.VEHICLE.mass
        });
        
        // コリジョンボックスを上にオフセットして追加（底面を上げる）
        const collisionOffset = 0.2; // 20cm上にオフセット
        this.chassisBody.addShape(chassisShape, new CANNON.Vec3(0, collisionOffset, 0));
        
        console.log('=== 車両物理設定 ===');
        console.log(`コリジョンボックスオフセット: ${collisionOffset}m（上方向）`);
        console.log(`3Dモデル表示オフセット: ${this.modelYOffset}m（下方向）`);
        console.log(`初期クリアランス: ${this.debugClearance}m`);
        console.log('==================');
        
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
            
            // 3Dモデルの実際のバウンディングボックスをデバッグ表示
            const finalBox = new THREE.Box3().setFromObject(this.carModel);
            const finalSize = finalBox.getSize(new THREE.Vector3());
            console.log('3Dモデル実寸:', {
                width: finalSize.x,
                height: finalSize.y, 
                depth: finalSize.z,
                minY: finalBox.min.y,
                maxY: finalBox.max.y
            });
            console.log('コリジョンボックス:', {
                width: CONFIG.VEHICLE.chassis.width,
                height: CONFIG.VEHICLE.chassis.height,
                depth: CONFIG.VEHICLE.chassis.depth
            });
            
            // バウンディングボックスヘルパーを作成（赤色で表示）
            this.boundingBoxHelper = new THREE.Box3Helper(finalBox, 0xff0000);
            this.boundingBoxHelper.visible = this.showBoundingBox;
            this.sceneManager.scene.add(this.boundingBoxHelper);
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
        console.log('RaycastVehicle作成中...');
        this.vehicle = new CANNON.RaycastVehicle({
            chassisBody: this.chassisBody,
            indexRightAxis: 0,  // X軸が右
            indexForwardAxis: 2, // Z軸が前
            indexUpAxis: 1      // Y軸が上
        });

        // ホイールの追加
        console.log('ホイール追加中...');
        this.addWheels();

        // 車両を物理世界に追加
        console.log('車両を物理世界に追加中...');
        this.vehicle.addToWorld(this.physicsManager.world);
        console.log('車両作成完了');

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
            useCustomSlidingRotationalSpeed: true,
            // バック走行を改善する設定
            sideAcceleration: 10, // 横方向の加速を増加
            forwardAcceleration: 1.5 // 前後方向の加速を追加
        };

        // ホイール位置の定義（タイヤが地面に接地するよう調整）
        // コリジョンボックスと3Dモデルの差を考慮して、少し余裕を持たせる
        const chassisHalfHeight = CONFIG.VEHICLE.chassis.height / 2;
        // タイヤがコリジョンボックスより少し上になるように調整（デバッグ可能）
        const wheelY = -chassisHalfHeight + CONFIG.VEHICLE.wheel.suspensionRestLength + CONFIG.VEHICLE.wheel.radius + this.debugClearance;
        
        const wheelPositions = [
            { x: -CONFIG.VEHICLE.wheel.axisPosition, y: wheelY, z: CONFIG.VEHICLE.chassis.depth * 0.35 },  // 前左
            { x: CONFIG.VEHICLE.wheel.axisPosition, y: wheelY, z: CONFIG.VEHICLE.chassis.depth * 0.35 },   // 前右
            { x: -CONFIG.VEHICLE.wheel.axisPosition, y: wheelY, z: -CONFIG.VEHICLE.chassis.depth * 0.35 }, // 後左
            { x: CONFIG.VEHICLE.wheel.axisPosition, y: wheelY, z: -CONFIG.VEHICLE.chassis.depth * 0.35 }   // 後右
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
            wheelMesh.visible = false; // タイヤを非表示
            
            this.wheelMeshes.push(wheelMesh);
            this.sceneManager.scene.add(wheelMesh);
        });

        // ホイールボディの作成
        this.vehicle.wheelInfos.forEach((wheel) => {
            // RaycastVehicleは内部でホイール管理を行うため、
            // 別途ホイールボディを作成する必要はない
            // この部分はコメントアウトしてエラーを回避
            /*
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
            */
        });
    }

    update(inputActions, deltaTime) {
        if (!this.vehicle) return;

        // エンジン力の計算
        // テスト：エンジン力の符号を逆にしてみる
        let engineForce = 0;
        if (inputActions.acceleration) {
            // 前進（正の値で前進を試す）
            engineForce = inputActions.turbo ? 
                CONFIG.VEHICLE.engine.baseForce * CONFIG.VEHICLE.engine.turboMultiplier : 
                CONFIG.VEHICLE.engine.baseForce;
        }
        
        // ブレーキ力（別途処理）
        let brakeForce = 0;
        let isReversing = false; // バック走行フラグ
        
        if (inputActions.braking) {
            const currentSpeed = this.chassisBody.velocity.length();
            const velocity = this.chassisBody.velocity;
            // 車両の前方向ベクトル（ローカル座標系でZ軸の負方向）
            const forwardVector = new CANNON.Vec3(0, 0, -1);
            // 車両の回転を適用してワールド座標系に変換
            this.chassisBody.quaternion.vmult(forwardVector, forwardVector);
            // 速度と前方向の内積（正=前進、負=後退）
            const forwardSpeed = velocity.dot(forwardVector);
            
            // デバッグ：ベクトルの詳細
            console.log(`[ベクトル解析] 速度: (${velocity.x.toFixed(2)}, ${velocity.y.toFixed(2)}, ${velocity.z.toFixed(2)})`);
            console.log(`[ベクトル解析] 前方向: (${forwardVector.x.toFixed(2)}, ${forwardVector.y.toFixed(2)}, ${forwardVector.z.toFixed(2)})`);
            console.log(`[ベクトル解析] 内積(forwardSpeed): ${forwardSpeed.toFixed(3)}`);
            
            // バック/ブレーキの判定
            console.log(`[速度判定] 前方向速度: ${forwardSpeed.toFixed(3)} m/s, 現在速度: ${currentSpeed.toFixed(3)} m/s`);
            
            // より単純なアプローチ：前進速度に基づいて判定
            if (forwardSpeed > 0.05) {
                // 前進中 → ブレーキ
                brakeForce = CONFIG.VEHICLE.engine.brakeForce;
                engineForce = 0;
                console.log(`[ブレーキ] 前進速度: ${forwardSpeed.toFixed(2)} m/s`);
            } else if (forwardSpeed > -0.05) {
                // ほぼ停止 → バック力（負の値で後退）
                isReversing = true;
                engineForce = -CONFIG.VEHICLE.engine.baseForce * CONFIG.VEHICLE.engine.reverseMultiplier;
                brakeForce = 0;
                console.log(`[バック開始] エンジン力: ${engineForce}N`);
            } else {
                // 後退中 → バック力を維持（負の値で後退）
                isReversing = true;
                engineForce = -CONFIG.VEHICLE.engine.baseForce * CONFIG.VEHICLE.engine.reverseMultiplier;
                brakeForce = 0;
                console.log(`[バック中] 後退速度: ${Math.abs(forwardSpeed).toFixed(2)} m/s`);
                
                // デバッグ情報
                console.log('=== バック走行デバッグ ===');
                console.log(`速度: ${currentSpeed.toFixed(3)} m/s`);
                console.log(`前方向速度: ${forwardSpeed.toFixed(3)} m/s (負=後退中)`);
                console.log(`速度ベクトル: x=${velocity.x.toFixed(2)}, y=${velocity.y.toFixed(2)}, z=${velocity.z.toFixed(2)}`);
                console.log(`適用する力: ${engineForce} N (正の値でバック)`);
                
                // 各ホイールの状態を確認
                this.vehicle.wheelInfos.forEach((wheel, index) => {
                    console.log(`ホイール${index + 1}: 接地=${wheel.isInContact}, サスペンション長=${wheel.suspensionLength?.toFixed(3) || 'N/A'}`);
                });
                
                // 抵抗要因の確認
                console.log(`車体の線形減衰: ${this.chassisBody.linearDamping}`);
                console.log(`地面との摩擦: ${CONFIG.VEHICLE.wheel.frictionSlip}`);
                
                // 追加デバッグ：力の確認
                console.log(`車体にかかる合力: x=${this.chassisBody.force.x.toFixed(2)}, y=${this.chassisBody.force.y.toFixed(2)}, z=${this.chassisBody.force.z.toFixed(2)}`);
                console.log(`角速度: x=${this.chassisBody.angularVelocity.x.toFixed(2)}, y=${this.chassisBody.angularVelocity.y.toFixed(2)}, z=${this.chassisBody.angularVelocity.z.toFixed(2)}`);
                
                // 各ホイールの駆動力を確認
                this.vehicle.wheelInfos.forEach((wheel, index) => {
                    if (wheel.engineForce !== undefined) {
                        console.log(`ホイール${index + 1}の駆動力: ${wheel.engineForce}N`);
                    }
                });
                console.log('==================');
            }
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

        // ハンドブレーキの処理
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

        // 車両の制御を適用（4輪駆動）
        console.log(`[エンジン適用前] 設定するエンジン力: ${engineForce}N`);
        this.vehicle.applyEngineForce(engineForce, 0); // 前左輪
        this.vehicle.applyEngineForce(engineForce, 1); // 前右輪
        this.vehicle.applyEngineForce(engineForce, 2); // 後左輪
        this.vehicle.applyEngineForce(engineForce, 3); // 後右輪
        
        // 適用後の確認
        console.log(`[エンジン適用後] ホイール0: ${this.vehicle.wheelInfos[0].engineForce}N`);
        console.log(`[エンジン適用後] ホイール1: ${this.vehicle.wheelInfos[1].engineForce}N`);
        console.log(`[エンジン適用後] ホイール2: ${this.vehicle.wheelInfos[2].engineForce}N`);
        console.log(`[エンジン適用後] ホイール3: ${this.vehicle.wheelInfos[3].engineForce}N`);
        
        // バック時は線形減衰を減らして加速しやすくする
        if (isReversing) {
            this.chassisBody.linearDamping = 0.0001; // バック時は減衰を極限まで減らす
            this.chassisBody.angularDamping = 0.01; // 回転減衰も減らす
        } else {
            this.chassisBody.linearDamping = 0.01; // 通常時の減衰
            this.chassisBody.angularDamping = 0.01; // 通常時の回転減衰
        }
        
        // ブレーキの適用（バック時は完全にブレーキを解除）
        const actualBrakeForce = isReversing ? 0 : brakeForce;
        
        // バック時は追加の推進力を車体に直接加える（物理的な補助）
        if (isReversing && engineForce > 0) {
            // 車両の向きに基づいて後方への力を計算
            const backwardForce = new CANNON.Vec3(0, 0, engineForce * 0.5); // エンジン力の50%を追加
            this.chassisBody.quaternion.vmult(backwardForce, backwardForce);
            this.chassisBody.applyLocalForce(backwardForce, new CANNON.Vec3(0, 0, 0));
        }
        
        // 力の適用状態をデバッグ
        if (engineForce !== 0 || actualBrakeForce !== 0) {
            const forceType = isReversing ? 'バック' : (engineForce < 0 ? '前進' : 'ブレーキ');
            console.log(`[${forceType}] エンジン力: ${engineForce}N, 実ブレーキ力: ${actualBrakeForce}N, 減衰: ${this.chassisBody.linearDamping}`);
        }
        
        // ブレーキを各ホイールに適用
        this.vehicle.setBrake(actualBrakeForce, 0);
        this.vehicle.setBrake(actualBrakeForce, 1);
        this.vehicle.setBrake(actualBrakeForce, 2);
        this.vehicle.setBrake(actualBrakeForce, 3);

        this.vehicle.setSteeringValue(steering, 0);
        this.vehicle.setSteeringValue(steering, 1);

        // 安定化処理
        if (this.stabilizationEnabled) {
            this.applyStabilization();
        }

        // ホイールメッシュの更新
        this.updateWheelMeshes();
        
        // バウンディングボックスの更新
        this.updateBoundingBox();
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
            
            // タイヤを正しい向きに回転（Y軸を車軸に）
            const rotation = new THREE.Euler();
            rotation.setFromQuaternion(wheelMesh.quaternion);
            rotation.z += Math.PI / 2;
            wheelMesh.rotation.copy(rotation);
        }
    }

    syncMeshWithBody() {
        if (this.chassisMesh && this.chassisBody) {
            // 物理ボディの位置をコピー
            this.chassisMesh.position.copy(this.chassisBody.position);
            // 3Dモデルを下にオフセット（コリジョンボックスが上にオフセットされているため）
            this.chassisMesh.position.y += this.modelYOffset;
            this.chassisMesh.quaternion.copy(this.chassisBody.quaternion);
        }
    }
    
    updateBoundingBox() {
        if (this.boundingBoxHelper && this.chassisMesh && this.showBoundingBox) {
            // 車両の現在位置でバウンディングボックスを再計算
            const box = new THREE.Box3().setFromObject(this.chassisMesh);
            this.boundingBoxHelper.box = box;
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

    adjustHeight(delta) {
        this.debugClearance += delta;
        
        console.log('=== 車両高さ調整（クリアランス方式） ===');
        console.log(`調整量: ${delta > 0 ? '+' : ''}${delta}m`);
        console.log(`新しいクリアランス値: ${this.debugClearance.toFixed(3)}m`);
        
        if (this.vehicle && this.chassisBody) {
            // 現在の位置と速度を保存
            const currentPos = this.chassisBody.position.clone();
            const currentVel = this.chassisBody.velocity.clone();
            const currentAngVel = this.chassisBody.angularVelocity.clone();
            const currentQuat = this.chassisBody.quaternion.clone();
            
            // ホイールの接続点を再計算
            const chassisHalfHeight = CONFIG.VEHICLE.chassis.height / 2;
            const newWheelY = -chassisHalfHeight + CONFIG.VEHICLE.wheel.suspensionRestLength + CONFIG.VEHICLE.wheel.radius + this.debugClearance;
            
            // 全てのホイールの接続点を更新
            this.vehicle.wheelInfos.forEach((wheelInfo, index) => {
                const oldY = wheelInfo.chassisConnectionPointLocal.y;
                wheelInfo.chassisConnectionPointLocal.y = newWheelY;
                console.log(`ホイール${index + 1} Y座標: ${oldY.toFixed(3)}m → ${newWheelY.toFixed(3)}m`);
            });
            
            // サスペンションをリセット
            this.vehicle.wheelInfos.forEach((wheelInfo) => {
                wheelInfo.suspensionLength = 0;
                wheelInfo.suspensionRelativeVelocity = 0;
                wheelInfo.suspensionForce = 0;
                wheelInfo.deltaRotation = 0;
            });
            
            console.log(`実効的な車高変化: ${(newWheelY + chassisHalfHeight).toFixed(3)}m`);
            console.log('==================');
        }
        
        return this.debugClearance;
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