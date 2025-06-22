// 設定・定数管理モジュール

// 車両パラメータ
export const VEHICLE = {
    // シャーシサイズ（3Dモデルに合わせて調整）
    chassis: {
        depth: 2.8,     // 2.71m + 余裕0.09m
        width: 1.3,     // 1.22m + 余裕0.08m  
        height: 0.75    // 0.75m（モデルと同じ）
    },
    mass: 1200, // kg（より現実的な車重に増加）
    
    // ホイール設定
    wheel: {
        radius: 0.33,
        thickness: 0.25,
        axisPosition: 1.3 * 0.42, // 車幅の42%位置（新しい車幅に合わせて調整）
        suspensionStiffness: 80,
        suspensionDamping: 13,
        suspensionCompression: 8.2,
        suspensionRestLength: 0.35,  // サスペンションの休止長を適切に設定（車高調整）
        frictionSlip: 50,
        rollInfluence: 0.01,
        maxSuspensionTravel: 0.3,    // 最大サスペンショントラベルも調整
        maxSuspensionForce: 200000
    },
    
    // エンジン・ブレーキ設定
    engine: {
        baseForce: 1500, // N（通常時）
        turboMultiplier: 3000 / 1500, // ターボ時の倍率（2倍）
        brakeForce: 50, // ブレーキ力を強化（20→50）
        maxSpeed: 25, // m/s (90 km/h) - より現実的な最高速度
        reverseMultiplier: 1.0 // バック時の力の倍率（前進と同じ1500N）
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
        highSpeedThreshold: 15, // より低速から出力調整開始
        minFactorAtHighSpeed: 0.3, // 高速時の最小出力係数（30%）
        reductionSpeedRange: 10 // 出力減少の速度範囲
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
    initialPosition: { x: -15, y: 15, z: 15 },
    adjustments: {
        distance: 15,      // 車両後方からの距離
        height: 10,        // 車両上方からの高さ
        sideOffset: 0,     // 横方向のオフセット（0で真後ろ）
        followFactor: 0.1  // 追従の滑らかさ
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
    "KeyW": "braking",        // W = 後退/ブレーキ
    "ArrowUp": "braking",     // ↑ = 後退/ブレーキ
    "KeyS": "acceleration",   // S = 前進
    "ArrowDown": "acceleration", // ↓ = 前進
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
    initialPosition: { x: 0, y: 2.1, z: 10 },  // 初期位置を調整（10cm上げた）
    // Y軸周りに-90度回転させて、Z軸の負方向を前にする
    initialQuaternion: { x: 0, y: -0.707, z: 0, w: 0.707 }
};