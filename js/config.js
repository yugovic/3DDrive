// 設定・定数管理モジュール

// 車両パラメータ
export const VEHICLE = {
    // シャーシサイズ
    chassis: {
        depth: 4.29,
        width: 1.76,
        height: 0.83
    },
    mass: 170, // kg（軽量化済み）
    
    // ホイール設定
    wheel: {
        radius: 0.33,
        thickness: 0.25,
        axisPosition: 1.76 * 0.42, // 車幅の42%位置
        suspensionStiffness: 80,
        suspensionDamping: 13,
        suspensionCompression: 8.2,
        suspensionRestLength: 0.3,
        frictionSlip: 50,
        rollInfluence: 0.01,
        maxSuspensionTravel: 0.3,
        maxSuspensionForce: 200000
    },
    
    // エンジン・ブレーキ設定
    engine: {
        baseForce: 700, // N（通常時）
        turboMultiplier: 1500 / 700, // ターボ時の倍率
        brakeForce: 10,
        maxSpeed: 25 // m/s (90 km/h)
    },
    
    // ステアリング設定
    steering: {
        baseMaxSteerVal: 0.65,
        highSpeedThreshold: 15,
        minFactorAtHighSpeed: 0.5,
        reductionSpeedRange: 30
    },
    
    // エンジン出力調整
    engineForce: {
        highSpeedThreshold: 30,
        minFactorAtHighSpeed: 0.2,
        reductionSpeedRange: 50
    },
    
    // 安定化設定
    stabilization: {
        verticalAxis: { x: 0, y: 1, z: 0 },
        rollCorrectionStrength: 25,
        rollCorrectionSpeed: 0.1,
        pitchCorrectionStrength: 10,
        pitchCorrectionSpeed: 0.03
    }
};

// 物理世界設定
export const PHYSICS = {
    gravity: { x: 0, y: -20, z: 0 },
    broadphase: {
        aabbMin: { x: -100, y: -100, z: -100 },
        aabbMax: { x: 100, y: 100, z: 100 }
    },
    defaultMaterial: {
        friction: 0.3,
        restitution: 0.3
    },
    groundMaterial: {
        friction: 0.8,
        restitution: 0.1
    },
    contactMaterial: {
        friction: 0.8,
        restitution: 0.3,
        contactEquationStiffness: 1e8,
        contactEquationRelaxation: 3
    }
};

// スロープ設定
export const SLOPE = {
    defaultHeight: 3.0,
    length: 15.0,
    width: 8.0,
    position: { x: 0, y: 1.5, z: -15 }, // y: height/2
    adjustmentStep: 0.5
};

// カメラ設定
export const CAMERA = {
    fov: 50,
    near: 0.1,
    far: 1000,
    initialPosition: { x: -8.0, y: 11.9, z: 9.5 },
    adjustments: {
        distance: 10,
        height: 10,
        sideOffset: 10,
        followFactor: 0.1
    }
};

// アイテム設定
export const ITEMS = {
    maxCollected: 3,
    collectRadius: 2.0,
    floatHeight: 1.5,
    floatSpeed: 2,
    floatAmplitude: 0.5,
    rotationSpeed: 1,
    types: [
        "⚽", "🏀", "🏈", "⚾", "🎾", 
        "🏐", "🏉", "🎱", "🏓", "🏸",
        "🥊", "🥋", "🏹", "⛳", "🎣",
        "🎿", "🛷", "🥌", "🎯", "🎳",
        "🎮", "🎲", "🎸", "🎨", "🎭"
    ]
};

// UI設定
export const UI = {
    turboIndicator: {
        showDelay: 0,
        hideDelay: 100
    },
    speedometer: {
        updateInterval: 16 // ~60fps
    },
    debugMenu: {
        defaultVisible: false
    }
};

// キーマッピング
export const KEY_MAPPINGS = {
    "KeyW": "acceleration",
    "ArrowUp": "acceleration",
    "KeyS": "braking",
    "ArrowDown": "braking",
    "KeyA": "left",
    "ArrowLeft": "left",
    "KeyD": "right",
    "ArrowRight": "right"
};

// 車種設定
export const CAR_MODELS = {
    rx7: {
        name: "RX-7 SABANA",
        url: "https://raw.githubusercontent.com/mrdoob/three.js/dev/examples/models/gltf/ferrari.glb",
        fallbackUrl: "./assets/Cars/rx7_sabana.glb"
    },
    rx7race: {
        name: "RX-7 SABANA Race",
        url: "./assets/Cars/rx7_sabana_race.glb"
    },
    r360: {
        name: "R360 Coupe",
        url: "./assets/Cars/r360_mazda.glb"
    },
    cosmo: {
        name: "Cosmo Sport",
        url: "./assets/Cars/cosmosp.glb"
    },
    rx3: {
        name: "RX-3 Race",
        url: "./assets/Cars/RX3_race.glb"
    },
    cosmorace: {
        name: "Cosmo Sport Race",
        url: "./assets/Cars/cosmosp_race.glb"
    }
};

// デフォルト設定
export const DEFAULTS = {
    carModel: 'rx7',
    debugMode: true,
    initialPosition: { x: 0, y: 2, z: 10 },
    initialQuaternion: { x: 0, y: 0, z: 0, w: 1 }
};