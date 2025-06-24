# Bruno Simon ポートフォリオサイト 音響システム分析

## 🎵 概要
Bruno Simon (https://bruno-simon.com) のポートフォリオサイトにおける車両音響システムの技術的分析結果をまとめたドキュメントです。

## 🔧 技術スタック

### 使用ライブラリ
- **Howler.js v2.2.4**
  - Web Audio APIのラッパーライブラリ
  - クロスブラウザ対応
  - 自動フォールバック機能
  - 空間音響対応

### アーキテクチャ
- **Sounds.js**: 音響管理の中核クラス
- **Car.js**: 車両状態と音響の連携
- **モジュラー設計**: 各音響要素が独立して管理

## 🚗 エンジン音の実装

### 1. サンプルベース方式
複数の音声ファイルを速度域ごとに用意：

```
sounds/
├── engine/
│   ├── idle.wav          # アイドリング音
│   ├── low_on.wav        # 低回転域（アクセルON）
│   ├── low_off.wav       # 低回転域（アクセルOFF）
│   ├── med_on.wav        # 中回転域（アクセルON）
│   ├── med_off.wav       # 中回転域（アクセルOFF）
│   ├── high_on.wav       # 高回転域（アクセルON）
│   ├── high_off.wav      # 高回転域（アクセルOFF）
│   ├── maxRPM.wav        # 最高回転数
│   └── startup.wav       # エンジン始動音
```

### 2. リアルタイム変調
```javascript
// 速度に基づくピッチ変調
this.sounds.engine.rate(calculatedRate);

// ボリュームの二次関数的調整
const adjustedVolume = Math.pow(baseVolume, 2);

// 速度閾値による音源切替
if (speed < lowThreshold) {
    // low_on/off.wavを使用
} else if (speed < medThreshold) {
    // med_on/off.wavを使用
} else {
    // high_on/off.wavを使用
}
```

### 3. エンジンタイプ
3種類のエンジン音セット（0、1、2）から選択可能：
- **Type 0**: スタンダードエンジン
- **Type 1**: スポーツエンジン
- **Type 2**: レーシングエンジン

## 🎮 効果音システム

### カテゴリー別効果音

| カテゴリー | ファイルパス | 用途 |
|:-----------|:------------|:-----|
| **衝突音** | `car-hits/` | 車両同士の衝突 |
| **環境衝突** | `bricks/`, `wood-hits/` | オブジェクトとの衝突 |
| **ボウリング** | `bowling/` | ボウリングピンの音 |
| **ホーン** | `car-horns/`, `horns/` | クラクション音 |
| **タイヤ音** | `screeches/` | 急ブレーキ・ドリフト |
| **UI音** | `ui/` | メニュー操作音 |
| **演出音** | `reveal/` | アイテム出現音 |

### 実装の特徴
- **ランダム再生**: 同じカテゴリー内で複数のバリエーション
- **速度連動**: 衝突音の音量が速度に比例
- **空間音響**: 3D空間での音源位置を反映

## 🎛️ 音量制御システム

### 1. マスターボリューム
```javascript
// グローバル音量設定
Howler.volume(masterVolume);
```

### 2. ミュート機能
```javascript
// キーボードショートカット（Mキー）
if (key === 'M') {
    this.toggleMute();
}

// タブ非表示時の自動ミュート
document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
        this.mute();
    } else {
        this.unmute();
    }
});
```

### 3. 個別音量調整
- エンジン音量
- 効果音音量
- 環境音音量
- UI音量

## 📊 パフォーマンス最適化

### 1. 更新頻度の制御
```javascript
// 最小デルタタイムで不要な更新を防止
if (deltaTime < MIN_UPDATE_INTERVAL) return;
```

### 2. 音源プール
- 頻繁に使用する音はプリロード
- インスタンスの再利用
- メモリ効率の最適化

### 3. 動的ロード
- 必要な音源のみロード
- レベル別の音源管理

## 🎯 InteractiveCarへの応用提案

### 1. ハイブリッド実装
現在のプロシージャル生成に加えて：
- 基本エンジン音サンプルの追加
- 速度域別の音源切替
- より自然な音響表現

### 2. 効果音の拡充
- 衝突音のバリエーション追加
- 環境別の効果音
- タイヤスクリーチ音

### 3. 高度な制御
- タブ切替時の自動ミュート
- 音量プリセット機能
- デバッグモードでの音響調整

### 4. 実装例
```javascript
// audio.js の拡張案
class AudioManager {
    constructor() {
        this.howler = new Howl({
            src: ['sounds/engine/idle.wav'],
            loop: true,
            volume: 0.5
        });
        
        this.engineSamples = {
            idle: new Howl({ src: ['sounds/engine/idle.wav'] }),
            low: new Howl({ src: ['sounds/engine/low.wav'] }),
            med: new Howl({ src: ['sounds/engine/med.wav'] }),
            high: new Howl({ src: ['sounds/engine/high.wav'] })
        };
    }
    
    updateEngineSound(speed, acceleration) {
        // 速度に基づく音源選択
        const sample = this.selectEngineSample(speed);
        
        // ピッチとボリュームの調整
        const rate = this.calculateRate(speed);
        const volume = Math.pow(this.calculateVolume(speed), 2);
        
        sample.rate(rate);
        sample.volume(volume);
    }
}
```

## 📝 まとめ

Bruno Simonのサイトの音響システムは、以下の点で優れています：

1. **リアリティ**: サンプルベースによる自然な音
2. **レスポンシブ性**: 車両状態に完全同期
3. **没入感**: 豊富な効果音と空間音響
4. **ユーザビリティ**: 直感的な音量制御

これらの要素を参考に、InteractiveCarプロジェクトの音響体験を大幅に向上させることが可能です。

---

**作成日**: 2024年
**更新日**: 2024年12月
**バージョン**: 1.0