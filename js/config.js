// 設定・定数管理モジュール
// 車種別詳細設定はvehicle-specs.jsを参照

// 車両パラメータ
export const VEHICLE = {
    // シャーシサイズ（3Dモデルに合わせて調整）
    chassis: {
        depth: 2.8,     // 2.71m + 余裕0.09m
        width: 1.3,     // 1.22m + 余裕0.08m  
        height: 0.75    // 0.75m（モデルと同じ）
    },
    mass: 180, // kg（Bruno Simon風に軽量化 - アーケード的な動きのため）
    
    // ホイール設定（Bruno Simon風）
    wheel: {
        radius: 0.3,              // 少し小さめのタイヤでトイカー感
        thickness: 0.25,
        axisPosition: 1.3 * 0.42, // 車幅の42%位置
        suspensionStiffness: 40,  // より柔らかく（バウンシーな動き）
        suspensionDamping: 8,     // 適度なダンピング
        suspensionCompression: 4.4,
        suspensionRestLength: 0.35,
        frictionSlip: 3,          // 大幅に低く（ドリフトしやすく）
        rollInfluence: 0.05,      // 横転しにくさを維持
        maxSuspensionTravel: 0.4,
        maxSuspensionForce: 100000
    },
    
    // エンジン・ブレーキ設定（Bruno Simon風）
    engine: {
        baseForce: 500,           // N（レスポンシブだが過剰でない）
        turboMultiplier: 3,       // ターボで3倍のパワー！
        brakeForce: 15,           // ブレーキは適度に（スライドを楽しむ）
        maxSpeed: 20,             // m/s (72 km/h) - 適度な最高速度
        reverseMultiplier: 0.8    // バックは少し弱め
    },
    
    // ステアリング設定（Bruno Simon風）
    steering: {
        baseMaxSteerVal: 0.5,     // よりクイックなステアリング
        highSpeedThreshold: 10,   // 低い速度から調整開始
        minFactorAtHighSpeed: 0.3, // 高速でも結構曲がる
        reductionSpeedRange: 15
    },
    
    // エンジン出力調整
    engineForce: {
        highSpeedThreshold: 12,
        minFactorAtHighSpeed: 0.5, // 高速でも50%の出力維持
        reductionSpeedRange: 8
    },
    
    // 安定化設定（Bruno Simon風 - 楽しさ重視）
    stabilization: {
        verticalAxis: { x: 0, y: 1, z: 0 },
        rollCorrectionStrength: 30,      // 適度な補正（完全には防がない）
        rollCorrectionSpeed: 0.15,
        pitchCorrectionStrength: 15,
        pitchCorrectionSpeed: 0.04,
        maxRollAngle: 0.6,               // より大きな傾きを許容
        emergencyRollThreshold: 0.5,     // 緊急補正は遅めに
        emergencyRollStrength: 80
    }
};

// 物理世界設定（Bruno Simon風）
export const PHYSICS = {
    gravity: { x: 0, y: -15, z: 0 }, // 少し軽い重力でジャンプが楽しい
    broadphase: {
        aabbMin: { x: -100, y: -100, z: -100 },
        aabbMax: { x: 100, y: 100, z: 100 }
    },
    defaultMaterial: {
        friction: 0.4,
        restitution: 0.4      // より弾む世界
    },
    groundMaterial: {
        friction: 0.4,        // 地面の摩擦を下げてスライドしやすく
        restitution: 0.3      // 少し弾む
    },
    contactMaterial: {
        friction: 0.4,        // タイヤと地面の摩擦を低く
        restitution: 0.3,
        contactEquationStiffness: 1e7,  // 少し柔らかく
        contactEquationRelaxation: 4    // よりソフトな接触
    },
    // エレベーター用マテリアル
    elevatorMaterial: {
        friction: 0.6,        // エレベーターでも少し滑る
        restitution: 0.1      // わずかに反発
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
    "KeyW": "acceleration",   // W = 前進
    "ArrowUp": "acceleration", // ↑ = 前進
    "KeyS": "braking",        // S = 後退/ブレーキ
    "ArrowDown": "braking",   // ↓ = 後退/ブレーキ
    "KeyA": "left",
    "ArrowLeft": "left",
    "KeyD": "right",
    "ArrowRight": "right"
};

// 車種設定
export const CAR_MODELS = {
    rx7: {
        name: "RX-7 SABANA",
        url: "/assets/Cars/rx7_sabana.glb",
        fallbackUrl: "/assets/Cars/rx7_sabana.glb"
    },
    rx7race: {
        name: "RX-7 SABANA Race",
        url: "/assets/Cars/rx7_sabana_race.glb"
    },
    r360: {
        name: "R360 Coupe",
        url: "/assets/Cars/r360_mazda.glb"
    },
    cosmo: {
        name: "Cosmo Sport",
        url: "/assets/Cars/cosmosp.glb"
    },
    rx3: {
        name: "RX-3 Race",
        url: "/assets/Cars/RX3_race.glb"
    },
    cosmorace: {
        name: "Cosmo Sport Race",
        url: "/assets/Cars/cosmosp_race.glb"
    }
};

// ゲーム設定
export const GAME = {
    respawnThreshold: -10,  // この高さ以下でリスポーン
    defaultMessageDuration: 2000,  // デフォルトメッセージ表示時間
    safetyWarningPosition: {
        bottom: 120  // 画面下部からの距離（すべての通知で統一）
    }
};

// デフォルト設定
export const DEFAULTS = {
    carModel: 'rx7',
    debugMode: true,
    initialPosition: { x: 0, y: 2, z: 10 },  // 初期位置
    // Y軸周りに90度回転させて、Z軸の正方向を前にする（180度回転）
    initialQuaternion: { x: 0, y: 0.707, z: 0, w: 0.707 }
};