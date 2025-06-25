// 車両システムモジュール
import * as CONFIG from './config.js';
import { audioIntegration } from './audio-integration.js';
import { getVehicleSpec, getPhysicsConfig } from './vehicle-specs.js';

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
        this.showBoundingBox = false; // デフォルトで非表示
        this.heightOffset = 0; // デバッグ用の高さオフセット
        this.debugClearance = -0.15; // デバッグ用の車高調整値（タイヤを下げて地面に接地）
        this.modelYOffset = -0.2; // 3Dモデルの表示オフセット（コリジョンオフセットと同じ値）
        this.modelGroundOffset = undefined; // バウンディングボックスベースの地面接地オフセット
        this.reversingState = false; // バック走行状態を記憶
        this.debugLogging = false; // デバッグログ出力フラグ
        
        // 車種情報
        this.vehicleId = null;
        this.vehicleSpec = null;
    }

    async loadModel(modelPath) {
        console.log(`[VehicleManager] モデル読み込み開始: ${modelPath}`);
        return new Promise((resolve, reject) => {
            const loader = new THREE.GLTFLoader();
            loader.load(
                modelPath,
                (gltf) => {
                    console.log(`[VehicleManager] モデル読み込み成功: ${modelPath}`);
                    this.carModel = gltf.scene;
                    this.carModel.traverse((child) => {
                        if (child.isMesh) {
                            child.castShadow = true;
                            child.receiveShadow = true;
                        }
                    });
                    resolve(this.carModel);
                },
                (progress) => {
                    if (progress.lengthComputable) {
                        const percentComplete = progress.loaded / progress.total * 100;
                        console.log(`[VehicleManager] 読み込み進捗: ${percentComplete.toFixed(2)}%`);
                    }
                },
                (error) => {
                    console.error(`[VehicleManager] モデル読み込みエラー: ${modelPath}`, error);
                    reject(error);
                }
            );
        });
    }

    async createVehicle(vehicleIdOrPath = null, position = CONFIG.DEFAULTS.initialPosition) {
        // 車種ID判定（rx7, r360など）
        if (vehicleIdOrPath && (vehicleIdOrPath === 'rx7' || vehicleIdOrPath === 'r360')) {
            this.vehicleId = vehicleIdOrPath;
            this.vehicleSpec = getVehicleSpec(vehicleIdOrPath);
            console.log(`[VehicleManager] 車種スペックを読み込み: ${this.vehicleSpec.info.name}`);
            
            // モデルパスをスペックから取得
            const modelPath = this.vehicleSpec.model.url || this.vehicleSpec.model.fallbackUrl;
            console.log(`[VehicleManager] 車種スペックからモデルパス取得: ${modelPath}`);
            if (modelPath) {
                try {
                    await this.loadModel(modelPath);
                    console.log(`[VehicleManager] モデル読み込み完了`);
                } catch (error) {
                    console.error('[VehicleManager] モデル読み込み失敗、デフォルトボックスを使用', error);
                }
            } else {
                console.warn('[VehicleManager] モデルパスが指定されていません');
            }
        } else if (vehicleIdOrPath) {
            // 従来の直接パス指定（互換性のため）
            try {
                await this.loadModel(vehicleIdOrPath);
            } catch (error) {
                console.warn('モデル読み込み失敗、デフォルトボックスを使用');
            }
        }

        // 車種スペックから物理パラメータを取得（なければデフォルト）
        const chassisMass = this.vehicleSpec ? this.vehicleSpec.physics.chassis.mass : CONFIG.VEHICLE.mass;
        const chassisDimensions = this.vehicleSpec ? this.vehicleSpec.physics.chassis.dimensions : CONFIG.VEHICLE.chassis;

        // シャーシの物理ボディを作成（底部を斜めにカット）
        // CompoundBodyを使用して、より柔軟な形状を作成
        this.chassisBody = new CANNON.Body({
            mass: chassisMass
        });
        
        // メインボディ（少し小さく、高い位置に）
        const mainBodyShape = new CANNON.Box(new CANNON.Vec3(
            chassisDimensions.width / 2 * 0.9,  // 幅を10%縮小
            chassisDimensions.height / 2 * 0.7, // 高さを30%縮小
            chassisDimensions.length / 2 * 0.85  // 奥行きを15%縮小
        ));
        
        // 前後のスロープ形状（台形のような形）
        const slopeHeight = 0.15;
        const slopeLength = 0.4;
        
        // コリジョンボックスを上にオフセットして追加（底面を上げる）
        // バウンディングボックスベースの調整がある場合は、コリジョンオフセットを減らす
        const collisionOffset = this.modelGroundOffset !== undefined ? 0.2 : 0.35; // バウンディングボックスベースの場合は20cmに減らす
        this.chassisBody.addShape(mainBodyShape, new CANNON.Vec3(0, collisionOffset, 0));
        
        // フロントとリアに小さな補助コリジョンを追加（オプション）
        const helperShape = new CANNON.Box(new CANNON.Vec3(
            chassisDimensions.width / 2 * 0.8,
            0.1,
            0.2
        ));
        
        // フロント補助（やや前方、高い位置）
        this.chassisBody.addShape(
            helperShape, 
            new CANNON.Vec3(0, collisionOffset - 0.1, chassisDimensions.length / 2 * 0.7)
        );
        
        // リア補助（やや後方、高い位置）
        this.chassisBody.addShape(
            helperShape,
            new CANNON.Vec3(0, collisionOffset - 0.1, -chassisDimensions.length / 2 * 0.7)
        );
        
        console.log('=== 車両物理設定 ===');
        console.log(`コリジョンボックスオフセット: ${collisionOffset}m（上方向）`);
        console.log(`3Dモデル表示オフセット: ${this.modelYOffset}m（下方向）`);
        console.log(`初期クリアランス: ${this.debugClearance}m`);
        console.log(`バウンディングボックスベースオフセット: ${this.modelGroundOffset || '未設定'}`);
        console.log('==================');
        
        this.chassisBody.position.set(position.x, position.y, position.z);
        this.physicsManager.addBody(this.chassisBody);

        // シャーシのメッシュを作成またはモデルを使用
        if (this.carModel) {
            console.log('[VehicleManager] 3Dモデルを使用');
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
            
            // バウンディングボックスの最低点を基準に車高を調整
            const lowestPoint = finalBox.min.y;
            console.log(`[車高調整] バウンディングボックス最低点: ${lowestPoint}`);
            
            // 3Dモデルの最低点が地面（Y=0）に接するようにオフセットを計算
            this.modelGroundOffset = -lowestPoint;
            console.log(`[車高調整] 地面接地オフセット: ${this.modelGroundOffset}`);
            
            // バウンディングボックスヘルパーを作成（赤色で表示）
            this.boundingBoxHelper = new THREE.Box3Helper(finalBox, 0xff0000);
            this.boundingBoxHelper.visible = this.showBoundingBox;
            this.sceneManager.scene.add(this.boundingBoxHelper);
        } else {
            // デフォルトのボックスメッシュ
            console.warn('[VehicleManager] 3Dモデルが利用できません。デフォルトの青いボックスを使用します');
            console.log('[VehicleManager] this.carModel:', this.carModel);
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
        
        // バウンディングボックスベースの車高調整を初期位置に反映
        if (this.modelGroundOffset !== undefined && this.chassisBody) {
            // 物理ボディの位置を調整して、モデルの最低点が地面に接するようにする
            const currentY = this.chassisBody.position.y;
            // 車種によって微調整
            const groundClearance = this.vehicleId === 'r360' ? -0.15 : 0.02; // R360は-15cm（下げる）、それ以外は2cm
            const adjustedY = currentY + this.modelGroundOffset + groundClearance;
            this.chassisBody.position.y = adjustedY;
            console.log(`[車高調整] 物理ボディY位置を調整: ${currentY} → ${adjustedY}`);
        }
        
        // 衝突イベントの設定
        this.setupCollisionEvents();

        return this.vehicle;
    }
    
    setupCollisionEvents() {
        // 衝突イベントリスナー
        this.chassisBody.addEventListener('collide', (event) => {
            // 衝突相手が地面でない場合のみ音を再生
            const contactNormal = event.contact.ni;
            const relativeVelocity = event.contact.getImpactVelocityAlongNormal();
            
            // 衝突の強さを計算（0-1の範囲に正規化）
            const impactForce = Math.min(Math.abs(relativeVelocity) / 10, 1);
            
            // 一定以上の衝撃の場合のみ音を再生
            if (impactForce > 0.2 && event.body.mass > 0) {
                audioIntegration.playCollision(impactForce);
                if (this.debugLogging) {
                    console.log(`[衝突検知] 強度: ${impactForce.toFixed(2)}`);
                }
            }
        });
    }

    addWheels() {
        // 車種スペックから取得（なければデフォルト）
        const wheelSpec = this.vehicleSpec ? this.vehicleSpec.physics.wheel : CONFIG.VEHICLE.wheel;
        
        const wheelOptions = {
            radius: wheelSpec.radius,
            directionLocal: new CANNON.Vec3(0, -1, 0),
            suspensionStiffness: wheelSpec.suspensionStiffness,
            suspensionRestLength: wheelSpec.suspensionRestLength,
            frictionSlip: wheelSpec.frictionSlip,
            dampingRelaxation: wheelSpec.dampingRelaxation,
            dampingCompression: wheelSpec.dampingCompression,
            maxSuspensionForce: wheelSpec.maxSuspensionForce,
            rollInfluence: wheelSpec.rollInfluence,
            axleLocal: wheelSpec.axleLocal ? new CANNON.Vec3(wheelSpec.axleLocal.x, wheelSpec.axleLocal.y, wheelSpec.axleLocal.z) : new CANNON.Vec3(1, 0, 0),
            chassisConnectionPointLocal: new CANNON.Vec3(1, 0, 1),
            maxSuspensionTravel: wheelSpec.maxSuspensionTravel,
            customSlidingRotationalSpeed: wheelSpec.customSlidingRotationalSpeed || -30,
            useCustomSlidingRotationalSpeed: wheelSpec.useCustomSlidingRotationalSpeed !== false,
            // バック走行を改善する設定
            sideAcceleration: 10, // 横方向の加速を増加
            forwardAcceleration: 1.5 // 前後方向の加速を追加
        };

        // ホイール位置の定義（タイヤが地面に接地するよう調整）
        // コリジョンボックスと3Dモデルの差を考慮して、少し余裕を持たせる
        const chassisDimensions = this.vehicleSpec ? this.vehicleSpec.physics.chassis.dimensions : CONFIG.VEHICLE.chassis;
        const chassisHalfHeight = chassisDimensions.height / 2;
        // タイヤがコリジョンボックスより少し上になるように調整（デバッグ可能）
        const wheelY = -chassisHalfHeight + wheelSpec.suspensionRestLength + wheelSpec.radius + this.debugClearance + 0.1; // さらに10cm上げる
        
        const wheelPositions = [
            { x: -CONFIG.VEHICLE.wheel.axisPosition, y: wheelY, z: chassisDimensions.length * 0.4 },   // 前左（やや前方に）
            { x: CONFIG.VEHICLE.wheel.axisPosition, y: wheelY, z: chassisDimensions.length * 0.4 },    // 前右（やや前方に）
            { x: -CONFIG.VEHICLE.wheel.axisPosition, y: wheelY, z: -chassisDimensions.length * 0.4 },  // 後左（やや後方に）
            { x: CONFIG.VEHICLE.wheel.axisPosition, y: wheelY, z: -chassisDimensions.length * 0.4 }    // 後右（やや後方に）
        ];

        wheelPositions.forEach((pos, index) => {
            const options = Object.assign({}, wheelOptions);
            options.chassisConnectionPointLocal = new CANNON.Vec3(pos.x, pos.y, pos.z);
            
            // 後輪は操舵可能（180度回転したので前後が逆）
            options.isFrontWheel = index >= 2;
            
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

        // エンジン力の計算（論理的に正=前進、負=後退）
        let logicalEngineForce = 0;
        let actualEngineForce = 0; // RaycastVehicleに適用する実際の力
        let brakeForce = 0;
        let isReversing = false;
        
        // 現在の車両状態を取得
        const velocity = this.chassisBody.velocity;
        const currentSpeed = velocity.length();
        
        // 車両の前方向ベクトル（180度回転したのでZ軸の正方向）
        const forwardVector = new CANNON.Vec3(0, 0, 1);
        this.chassisBody.quaternion.vmult(forwardVector, forwardVector);
        
        // 速度と前方向の内積（正=前進、負=後退）
        const forwardSpeed = velocity.dot(forwardVector);
        
        // 車種スペックから取得（なければデフォルト）
        const engineSpec = this.vehicleSpec ? this.vehicleSpec.physics.engine : CONFIG.VEHICLE.engine;
        const steeringSpec = this.vehicleSpec ? this.vehicleSpec.gameplay.handling : CONFIG.VEHICLE.steering;
        
        // 前進操作時
        if (inputActions.acceleration) {
            // 論理的に正のエンジン力（前進）
            logicalEngineForce = inputActions.turbo ? 
                engineSpec.baseForce * engineSpec.turboMultiplier : 
                engineSpec.baseForce;
            
            if (this.debugLogging) {
                console.log(`[前進] 論理エンジン力: +${logicalEngineForce}N`);
            }
        }
        
        // ブレーキ/バック操作時
        else if (inputActions.braking) {
            if (forwardSpeed > 0.05) {
                // 前進中 → ブレーキ
                brakeForce = engineSpec.engineBrake || CONFIG.VEHICLE.engine.brakeForce;
                logicalEngineForce = 0;
                if (this.debugLogging) {
                    console.log(`[ブレーキ] 前進速度: ${forwardSpeed.toFixed(2)} m/s`);
                }
                
                // ブレーキングドリフト: 高速でブレーキ＋ステアリング時にリアグリップを減少
                if (currentSpeed > 8 && (inputActions.left || inputActions.right)) {
                    // 後輪のfrictionSlipを一時的に下げる
                    this.vehicle.wheelInfos[2].frictionSlip = 2; // 後左輪
                    this.vehicle.wheelInfos[3].frictionSlip = 2; // 後右輪
                    if (this.debugLogging) {
                        console.log('[ドリフト] ブレーキングドリフト開始');
                    }
                } else {
                    // 通常のグリップに戻す
                    this.vehicle.wheelInfos[2].frictionSlip = CONFIG.VEHICLE.wheel.frictionSlip;
                    this.vehicle.wheelInfos[3].frictionSlip = CONFIG.VEHICLE.wheel.frictionSlip;
                }
            } else {
                // 停止または後退中 → バック
                isReversing = true;
                // 論理的に負のエンジン力（後退）
                logicalEngineForce = -engineSpec.baseForce * (CONFIG.VEHICLE.engine.reverseMultiplier || 0.5);
                brakeForce = 0;
                if (this.debugLogging) {
                    console.log(`[後退] 論理エンジン力: ${logicalEngineForce}N`);
                }
            }
        } else {
            // ブレーキを離したら通常のグリップに戻す
            this.vehicle.wheelInfos[2].frictionSlip = CONFIG.VEHICLE.wheel.frictionSlip;
            this.vehicle.wheelInfos[3].frictionSlip = CONFIG.VEHICLE.wheel.frictionSlip;
        }
        
        // RaycastVehicleの仕様に合わせて実際の力を計算
        // RaycastVehicleは負の値で前進、正の値で後退する特殊な仕様
        actualEngineForce = -logicalEngineForce;
        
        // デバッグ出力
        if (this.debugLogging && (logicalEngineForce !== 0 || brakeForce !== 0)) {
            console.log('=== エンジン力変換 ===');
            console.log(`論理的エンジン力: ${logicalEngineForce}N (正=前進, 負=後退)`);
            console.log(`実際の適用力: ${actualEngineForce}N (RaycastVehicle用)`);
            console.log(`前方向速度: ${forwardSpeed.toFixed(3)} m/s`);
            console.log(`ブレーキ力: ${brakeForce}N`);
            console.log('==================');
        }

        // 速度に応じたエンジン出力の調整
        if (currentSpeed > CONFIG.VEHICLE.engineForce.highSpeedThreshold && logicalEngineForce > 0) {
            const speedFactor = Math.max(
                CONFIG.VEHICLE.engineForce.minFactorAtHighSpeed,
                1 - (currentSpeed - CONFIG.VEHICLE.engineForce.highSpeedThreshold) / 
                    CONFIG.VEHICLE.engineForce.reductionSpeedRange
            );
            logicalEngineForce *= speedFactor;
            actualEngineForce = -logicalEngineForce; // 再計算
        }

        // 最高速度制限
        if (currentSpeed > engineSpec.maxSpeed && logicalEngineForce > 0) {
            logicalEngineForce = 0;
            actualEngineForce = 0;
        }

        // ハンドブレーキの処理
        if (inputActions.handbrake) {
            brakeForce = (engineSpec.engineBrake || CONFIG.VEHICLE.engine.brakeForce) * 2;
        }

        // ステアリング
        let steering = 0;
        if (inputActions.left) steering = steeringSpec.steeringClamp || CONFIG.VEHICLE.steering.baseMaxSteerVal;
        if (inputActions.right) steering = -(steeringSpec.steeringClamp || CONFIG.VEHICLE.steering.baseMaxSteerVal);

        // 速度に応じたステアリング感度の調整
        if (currentSpeed > (CONFIG.VEHICLE.steering.highSpeedThreshold || 20)) {
            const steerFactor = steeringSpec.steeringSpeedFactor || 0.8;
            steering *= steerFactor;
        }

        // 車両の制御を適用（4輪駆動）
        this.vehicle.applyEngineForce(actualEngineForce, 0); // 前左輪
        this.vehicle.applyEngineForce(actualEngineForce, 1); // 前右輪
        this.vehicle.applyEngineForce(actualEngineForce, 2); // 後左輪
        this.vehicle.applyEngineForce(actualEngineForce, 3); // 後右輪
        
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
        if (isReversing && logicalEngineForce < 0) {
            // 車両の向きに基づいて後方への力を計算
            // 論理的に負の力なので、そのまま適用
            const backwardForce = new CANNON.Vec3(0, 0, logicalEngineForce * 0.5); // エンジン力の50%を追加
            this.chassisBody.quaternion.vmult(backwardForce, backwardForce);
            this.chassisBody.applyLocalForce(backwardForce, new CANNON.Vec3(0, 0, 0));
            if (this.debugLogging) {
                console.log(`[後退補助] 追加推進力: ${logicalEngineForce * 0.5}N`);
            }
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
        const localUp = new CANNON.Vec3(0, 1, 0);
        chassisTransform.vmult(localUp, localUp);

        // 車両の傾きを計算（上向きベクトルと世界の上向きベクトルの角度）
        const tiltAngle = Math.acos(Math.max(-1, Math.min(1, localUp.dot(up))));
        
        // 各軸の向きを取得
        const localForward = new CANNON.Vec3(0, 0, 1);
        const localRight = new CANNON.Vec3(1, 0, 0);
        chassisTransform.vmult(localForward, localForward);
        chassisTransform.vmult(localRight, localRight);
        
        // ロール角（Z軸周りの回転）
        const rollAngle = Math.atan2(localRight.y, localUp.y);
        const absRollAngle = Math.abs(rollAngle);
        
        // ピッチ角（X軸周りの回転）
        const pitchAngle = Math.atan2(-localForward.y, localUp.y);
        const absPitchAngle = Math.abs(pitchAngle);
        
        // 横倒し検出（車両の右ベクトルが上を向いている場合）
        const isSideways = Math.abs(localRight.y) > 0.7; // 右ベクトルのY成分が大きい
        
        // 緊急横転防止
        if (absRollAngle > CONFIG.VEHICLE.stabilization.emergencyRollThreshold || isSideways) {
            // 緊急時は強力な補正を適用
            const emergencyRollCorrection = -rollAngle * CONFIG.VEHICLE.stabilization.emergencyRollStrength;
            const emergencyRollTorque = new CANNON.Vec3(0, 0, emergencyRollCorrection);
            chassisTransform.vmult(emergencyRollTorque, emergencyRollTorque);
            
            // 横方向の角速度を大幅に減衰
            this.chassisBody.angularVelocity.x *= 0.3;
            this.chassisBody.angularVelocity.z *= 0.3;
            this.chassisBody.torque.vadd(emergencyRollTorque, this.chassisBody.torque);
            
            if (isSideways) {
                console.log(`[緊急横倒し防止] 車両が横倒しになっています`);
            } else {
                console.log(`[緊急横転防止] ロール角: ${(rollAngle * 180 / Math.PI).toFixed(1)}度`);
            }
        } else {
            // 通常の横転補正
            const rollCorrection = -rollAngle * CONFIG.VEHICLE.stabilization.rollCorrectionStrength;
            const rollTorque = new CANNON.Vec3(0, 0, rollCorrection);
            chassisTransform.vmult(rollTorque, rollTorque);
            
            this.chassisBody.angularVelocity.x *= (1 - CONFIG.VEHICLE.stabilization.rollCorrectionSpeed);
            this.chassisBody.torque.vadd(rollTorque, this.chassisBody.torque);
        }

        // ピッチ（前後傾き）の補正
        if (absPitchAngle > CONFIG.VEHICLE.stabilization.emergencyRollThreshold) {
            // 緊急ピッチ補正
            const emergencyPitchCorrection = -pitchAngle * CONFIG.VEHICLE.stabilization.emergencyRollStrength;
            const emergencyPitchTorque = new CANNON.Vec3(emergencyPitchCorrection, 0, 0);
            chassisTransform.vmult(emergencyPitchTorque, emergencyPitchTorque);
            
            this.chassisBody.angularVelocity.y *= 0.3;
            this.chassisBody.torque.vadd(emergencyPitchTorque, this.chassisBody.torque);
            
            console.log(`[緊急ピッチ防止] ピッチ角: ${(pitchAngle * 180 / Math.PI).toFixed(1)}度`);
        } else {
            // 通常のピッチ補正
            const pitchCorrection = -pitchAngle * CONFIG.VEHICLE.stabilization.pitchCorrectionStrength;
            const pitchTorque = new CANNON.Vec3(pitchCorrection, 0, 0);
            chassisTransform.vmult(pitchTorque, pitchTorque);
            
            this.chassisBody.angularVelocity.z *= (1 - CONFIG.VEHICLE.stabilization.pitchCorrectionSpeed);
            this.chassisBody.torque.vadd(pitchTorque, this.chassisBody.torque);
        }
        
        // 完全に横転・横倒しした場合の自動復帰
        if (tiltAngle > Math.PI * 0.6 || isSideways) { // 108度以上傾いた場合、または横倒し
            console.log('[自動復帰] 車両が転倒しました。位置をリセットします。');
            this.autoRecover();
        }
    }
    
    autoRecover() {
        // 現在の位置を保持
        const currentPos = this.chassisBody.position.clone();
        
        // 車両を正しい向きにリセット（Y軸周りの回転は保持）
        const yRotation = Math.atan2(
            2 * (this.chassisBody.quaternion.y * this.chassisBody.quaternion.w + this.chassisBody.quaternion.x * this.chassisBody.quaternion.z),
            1 - 2 * (this.chassisBody.quaternion.y * this.chassisBody.quaternion.y + this.chassisBody.quaternion.z * this.chassisBody.quaternion.z)
        );
        
        // 初期の回転を考慮してリセット
        const resetQuat = new CANNON.Quaternion();
        resetQuat.setFromEuler(0, yRotation, 0);
        
        // 初期回転を適用
        const initialQuat = new CANNON.Quaternion(
            CONFIG.DEFAULTS.initialQuaternion.x,
            CONFIG.DEFAULTS.initialQuaternion.y,
            CONFIG.DEFAULTS.initialQuaternion.z,
            CONFIG.DEFAULTS.initialQuaternion.w
        );
        resetQuat.mult(initialQuat, resetQuat);
        
        this.chassisBody.quaternion.copy(resetQuat);
        
        // 位置を少し上にオフセット
        this.chassisBody.position.set(currentPos.x, currentPos.y + 1, currentPos.z);
        
        // 速度をリセット
        this.chassisBody.velocity.set(0, 0, 0);
        this.chassisBody.angularVelocity.set(0, 0, 0);
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
            
            // 3Dモデルの高さ調整
            // バウンディングボックスベースのオフセットがある場合はそれを優先
            if (this.modelGroundOffset !== undefined) {
                // バウンディングボックスの最低点が地面に接するように調整
                // コリジョンオフセットが小さくなっているので、その分を考慮
                // 車種によって微調整
                const yAdjustment = this.vehicleId === 'r360' ? -0.05 : -0.15; // R360用に調整
                this.chassisMesh.position.y = this.chassisBody.position.y + yAdjustment;
            } else {
                // 従来のオフセット方式
                this.chassisMesh.position.y += this.modelYOffset;
            }
            
            // 回転をコピー
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