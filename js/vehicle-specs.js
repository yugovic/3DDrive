// 車種別スペック管理モジュール
// 各車種の性能、外観、音響設定を一元管理

/**
 * 車種スペック定義
 * 新しい車種を追加する際は、このオブジェクトに追加するだけでOK
 */
export const VEHICLE_SPECS = {
    rx7: {
        // 基本情報
        info: {
            name: 'Mazda RX-7',
            displayName: 'RX-7',
            manufacturer: 'Mazda',
            year: '1991-2002',
            type: 'sports'
        },
        
        // 3Dモデル設定
        model: {
            url: './assets/Cars/rx7_sabana.glb',
            fallbackUrl: './assets/Cars/rx7_sabana.glb',
            scale: { x: 1.2, y: 1.2, z: 1.2 },
            position: { x: 0, y: 0, z: 0 },
            rotation: { x: 0, y: Math.PI, z: 0 }
        },
        
        // 物理特性
        physics: {
            // シャーシ
            chassis: {
                mass: 180,  // kg (デフォルトと同じ)
                dimensions: {
                    width: 1.6,
                    height: 0.5,
                    length: 3.2
                }
            },
            
            // ホイール
            wheel: {
                radius: 0.3,
                width: 0.2,
                mass: 15,  // デフォルトと同じ
                suspensionStiffness: 40,  // デフォルトと同じ
                suspensionRestLength: 0.35,  // デフォルトと同じ
                frictionSlip: 3,
                dampingRelaxation: 2.3,
                dampingCompression: 4.4,
                maxSuspensionForce: 100000,
                rollInfluence: 0.05,
                axleLocal: { x: -1, y: 0, z: 0 },
                chassisConnectionPointLocal: { x: 0, y: 0, z: 0 },
                maxSuspensionTravel: 0.3,
                customSlidingRotationalSpeed: -30,
                useCustomSlidingRotationalSpeed: true
            },
            
            // エンジン
            engine: {
                baseForce: 500,  // デフォルトと同じ
                maxForce: 1500,  // デフォルトと同じ
                turboMultiplier: 3,  // デフォルトと同じ
                maxSpeed: 20,  // m/s (デフォルトと同じ)
                engineBrake: 15  // デフォルトと同じ
            }
        },
        
        // ゲームプレイ特性
        gameplay: {
            handling: {
                steeringIncrement: 0.04,
                steeringClamp: 0.5,
                steeringSpeedFactor: 0.7,  // 高速時のステアリング減衰
                driftFactor: 1.2  // ドリフトしやすさ
            },
            
            acceleration: {
                curve: 'linear',  // 'linear', 'exponential', 'logarithmic'
                traction: 0.9
            }
        },
        
        // 音響設定
        audio: {
            engine: {
                type: 'rotary',  // ロータリーエンジン
                mode: 'advanced',  // 'simple' or 'advanced'
                baseFrequency: 90,  // ロータリー特有の高めの基本周波数
                harmonics: [1, 0.8, 0.6, 0.4, 0.3, 0.2],  // ロータリー特有の倍音構成
                modulation: {
                    frequency: 7,  // ロータリー特有の振動
                    depth: 5
                },
                turbo: {
                    enabled: true,
                    whineFrequency: 2500,
                    spoolTime: 0.5
                }
            },
            
            effects: {
                backfire: true,  // バックファイア音
                turboWastegate: true,  // ウェイストゲート音
                transmission: 'manual'  // トランスミッション音
            }
        },
        
        // UI表示設定
        ui: {
            speedUnit: 'km/h',
            maxSpeedDisplay: 180,
            redline: 9000,  // RPM
            gauges: ['speed', 'rpm', 'turbo']
        }
    },
    
    r360: {
        // 基本情報
        info: {
            name: 'Mazda R360',
            displayName: 'R360',
            manufacturer: 'Mazda',
            year: '1960-1966',
            type: 'kei-car'
        },
        
        // 3Dモデル設定
        model: {
            url: './assets/Cars/r360_mazda.glb',
            fallbackUrl: './assets/Cars/r360_mazda.glb',
            scale: { x: 1.0, y: 1.0, z: 1.0 },
            position: { x: 0, y: 0, z: 0 },
            rotation: { x: 0, y: Math.PI, z: 0 }
        },
        
        // 物理特性
        physics: {
            // シャーシ
            chassis: {
                mass: 180,  // kg (デフォルトと同じ)
                dimensions: {
                    width: 1.2,
                    height: 0.4,
                    length: 2.5
                }
            },
            
            // ホイール
            wheel: {
                radius: 0.3,  // デフォルトと同じ
                width: 0.2,  // デフォルトと同じ
                mass: 15,  // デフォルトと同じ
                suspensionStiffness: 40,  // デフォルトと同じ
                suspensionRestLength: 0.35,  // デフォルトと同じ
                frictionSlip: 3,  // デフォルトと同じ
                dampingRelaxation: 2.3,  // デフォルトと同じ
                dampingCompression: 4.4,  // デフォルトと同じ
                maxSuspensionForce: 100000,  // デフォルトと同じ
                rollInfluence: 0.05,  // デフォルトと同じ
                axleLocal: { x: -1, y: 0, z: 0 },
                chassisConnectionPointLocal: { x: 0, y: 0, z: 0 },
                maxSuspensionTravel: 0.2,
                customSlidingRotationalSpeed: -30,
                useCustomSlidingRotationalSpeed: true
            },
            
            // エンジン
            engine: {
                baseForce: 500,  // デフォルトと同じ
                maxForce: 1500,  // デフォルトと同じ
                turboMultiplier: 3,  // デフォルトと同じ
                maxSpeed: 20,  // m/s (デフォルトと同じ)
                engineBrake: 15  // デフォルトと同じ
            }
        },
        
        // ゲームプレイ特性
        gameplay: {
            handling: {
                steeringIncrement: 0.05,  // 軽快なハンドリング
                steeringClamp: 0.6,
                steeringSpeedFactor: 0.9,  // 速度による影響少なめ
                driftFactor: 0.8  // ドリフトしにくい
            },
            
            acceleration: {
                curve: 'logarithmic',  // 初速は速いが伸びない
                traction: 0.7
            }
        },
        
        // 音響設定
        audio: {
            engine: {
                type: 'v-twin',  // V型2気筒
                mode: 'simple',  // シンプルモード
                baseFrequency: 60,  // 低めの基本周波数
                harmonics: [1, 0.5, 0.3],  // シンプルな倍音構成
                modulation: {
                    frequency: 3,  // ゆったりとした振動
                    depth: 2
                },
                turbo: {
                    enabled: false,
                    whineFrequency: 0,
                    spoolTime: 0
                }
            },
            
            effects: {
                backfire: false,
                turboWastegate: false,
                transmission: 'manual'
            }
        },
        
        // UI表示設定
        ui: {
            speedUnit: 'km/h',
            maxSpeedDisplay: 100,
            redline: 6000,  // RPM
            gauges: ['speed', 'rpm']  // ターボゲージなし
        }
    }
};

/**
 * デフォルトスペック（フォールバック用）
 */
export const DEFAULT_VEHICLE_SPEC = {
    info: {
        name: 'Generic Vehicle',
        displayName: 'Vehicle',
        manufacturer: 'Unknown',
        year: 'Unknown',
        type: 'standard'
    },
    
    model: {
        url: null,
        fallbackUrl: null,
        scale: { x: 1, y: 1, z: 1 },
        position: { x: 0, y: 0, z: 0 },
        rotation: { x: 0, y: 0, z: 0 }
    },
    
    physics: {
        chassis: {
            mass: 180,  // config.jsと同じ値
            dimensions: {
                width: 1.5,
                height: 0.5,
                length: 3.0
            }
        },
        
        wheel: {
            radius: 0.3,
            width: 0.2,
            mass: 15,
            suspensionStiffness: 40,  // config.jsと同じ
            suspensionRestLength: 0.35,  // config.jsと同じ
            frictionSlip: 3,
            dampingRelaxation: 2.3,
            dampingCompression: 4.4,
            maxSuspensionForce: 100000,  // config.jsと同じ
            rollInfluence: 0.05,
            axleLocal: { x: -1, y: 0, z: 0 },
            chassisConnectionPointLocal: { x: 0, y: 0, z: 0 },
            maxSuspensionTravel: 0.4,  // config.jsと同じ
            customSlidingRotationalSpeed: -30,
            useCustomSlidingRotationalSpeed: true
        },
        
        engine: {
            baseForce: 500,  // config.jsと同じ
            maxForce: 1500,  // baseForce * turboMultiplier
            turboMultiplier: 3,  // config.jsと同じ
            maxSpeed: 20,  // config.jsと同じ
            engineBrake: 15  // config.jsと同じ
        }
    },
    
    gameplay: {
        handling: {
            steeringIncrement: 0.04,
            steeringClamp: 0.5,
            steeringSpeedFactor: 0.8,
            driftFactor: 1.0
        },
        
        acceleration: {
            curve: 'linear',
            traction: 0.8
        }
    },
    
    audio: {
        engine: {
            type: 'inline-4',
            mode: 'simple',
            baseFrequency: 80,
            harmonics: [1, 0.6, 0.4, 0.2],
            modulation: {
                frequency: 5,
                depth: 3
            },
            turbo: {
                enabled: false,
                whineFrequency: 2000,
                spoolTime: 0.3
            }
        },
        
        effects: {
            backfire: false,
            turboWastegate: false,
            transmission: 'manual'
        }
    },
    
    ui: {
        speedUnit: 'km/h',
        maxSpeedDisplay: 140,
        redline: 7000,
        gauges: ['speed', 'rpm']
    }
};

/**
 * 車種スペックを取得する関数
 * @param {string} vehicleId - 車種ID（'rx7', 'r360'など）
 * @returns {Object} 車種スペック
 */
export function getVehicleSpec(vehicleId) {
    return VEHICLE_SPECS[vehicleId] || DEFAULT_VEHICLE_SPEC;
}

/**
 * 車種の物理パラメータをCannon.js用に変換
 * @param {Object} spec - 車種スペック
 * @returns {Object} Cannon.js用パラメータ
 */
export function getPhysicsConfig(spec) {
    return {
        chassisMass: spec.physics.chassis.mass,
        chassisShape: spec.physics.chassis.dimensions,
        wheelInfo: spec.physics.wheel,
        engineForce: spec.physics.engine.baseForce,
        maxEngineForce: spec.physics.engine.maxForce,
        maxSpeed: spec.physics.engine.maxSpeed
    };
}

/**
 * 車種の音響設定を取得
 * @param {Object} spec - 車種スペック
 * @returns {Object} 音響設定
 */
export function getAudioConfig(spec) {
    return {
        engineType: spec.audio.engine.type,
        engineMode: spec.audio.engine.mode,
        baseFrequency: spec.audio.engine.baseFrequency,
        harmonics: spec.audio.engine.harmonics,
        modulation: spec.audio.engine.modulation,
        turboEnabled: spec.audio.engine.turbo.enabled,
        effects: spec.audio.effects
    };
}