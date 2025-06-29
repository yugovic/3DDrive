# 車両物理挙動仕様書 - Bruno Simon風チューニング

## 🚗 Bruno Simonサイトとの比較表

### 基本パラメータ比較

| パラメータ           | Bruno Simon (推定)  | InteractiveCar v0.3 | InteractiveCar v0  | 類似度      | 備考                        |
|:-------------------|:------------------:|:------------------:|:------------------:|:----------:|:---------------------------|
| **車両質量**         | 150-200 kg         | 180 kg            | 1200 kg           | ⭐⭐⭐⭐⭐ | 軽量化でレスポンシブに        |
| **最高速度**         | 60-70 km/h         | 72 km/h           | 90 km/h           | ⭐⭐⭐⭐⭐ | より適度な速度に調整         |
| **重力**            | -10 to -15 m/s²    | -15 m/s²          | -20 m/s²          | ⭐⭐⭐⭐⭐ | 軽めでジャンプが楽しい        |

### ホイール・サスペンション

| パラメータ              | Bruno Simon (推定)  | InteractiveCar v0.3 | InteractiveCar v0  | 類似度      | 備考                        |
|:----------------------|:------------------:|:------------------:|:------------------:|:----------:|:---------------------------|
| **タイヤ半径**          | 0.3 m              | 0.3 m             | 0.33 m            | ⭐⭐⭐⭐⭐ | トイカー感のある小さめタイヤ   |
| **摩擦係数**           | 2-5                | 3                 | 40                | ⭐⭐⭐⭐⭐ | 大幅に低減してドリフト可能に   |
| **サスペンション剛性**   | 30-50              | 40                | 60                | ⭐⭐⭐⭐⭐ | 柔らかくバウンシーに調整      |
| **ロール影響**          | 0.1                | 0.05              | 0.01              | ⭐⭐⭐⭐   | バランスを調整              |

### エンジン・操作性

| パラメータ           | Bruno Simon (推定)  | InteractiveCar v0.3 | InteractiveCar v0  | 類似度      | 備考                        |
|:-------------------|:------------------:|:------------------:|:------------------:|:----------:|:---------------------------|
| **基本推進力**       | 300-500 N          | 500 N             | 3000 N            | ⭐⭐⭐⭐⭐ | 適正化して同等のパワーに      |
| **ターボ機能**       | なし               | 3倍ブースト         | 2倍ブースト        | ⭐⭐⭐     | より楽しさを追求            |
| **ブレーキ力**       | 10-20 N            | 15 N              | 50 N              | ⭐⭐⭐⭐⭐ | スライドを楽しめる適度な制動   |
| **最大操舵角**       | 0.5 rad            | 0.5 rad           | 0.65 rad          | ⭐⭐⭐⭐⭐ | クイックな操作に調整         |

### 物理マテリアル

| パラメータ           | Bruno Simon (推定)  | InteractiveCar v0.3 | InteractiveCar v0  | 類似度      | 備考                        |
|:-------------------|:------------------:|:------------------:|:------------------:|:----------:|:---------------------------|
| **地面摩擦**         | 0.4                | 0.4               | 0.6               | ⭐⭐⭐⭐⭐ | v0.3で完全一致             |
| **反発係数**         | 0.3                | 0.3-0.4           | 0.1               | ⭐⭐⭐⭐⭐ | v0.3で弾む世界観に         |
| **接触剛性**         | 1e7                | 1e7               | 1e8               | ⭐⭐⭐⭐⭐ | v0.3でソフトな接触に       |

## 🎮 ゲームプレイ要素の比較

### 共通要素 ✅

| 要素                   | 説明                                     |
|:----------------------|:----------------------------------------|
| **ドリフト走行**        | 低摩擦によるスライディングが楽しめる         |
| **軽快な操作感**        | 軽い車体で即座に反応                      |
| **物理ベース**         | Cannon.jsによるリアルタイム物理演算        |
| **3Dグラフィックス**    | Three.jsによる美しいレンダリング           |
| **収集要素**           | アイテム収集のゲーム性                    |

### 独自要素 🌟

| 要素                   | InteractiveCar独自 | 説明                           |
|:----------------------|:------------------:|:------------------------------|
| **ターボシステム**      | ✅                | スペースキーで3倍パワー          |
| **エレベーター**        | ✅                | 上下移動する足場                |
| **ブーストパッド**      | ✅                | 加速ゾーン                     |
| **ジャンプパッド**      | ✅                | 高くジャンプできるギミック        |
| **安全停止システム**    | ✅                | エレベーターの安全機能           |
| **車種選択**           | ✅                | 複数の車モデルから選択可能       |
| **リスポーン機能**      | ✅                | 落下時の自動復帰               |

## 📊 挙動特性の詳細

### ドリフト特性
```
摩擦係数: 3 (Bruno Simonと同等)
- コーナーでのスライド
- カウンターステアが効く
- 慣性を感じる動き
```

### ジャンプ特性
```
重力: -15 m/s²
ジャンプ力: 200N (インパルス)
- 滞空時間が長め
- 着地時のバウンド
- 空中制御可能
```

### 加速特性
```
基本推進力: 500N
ターボ時: 1500N (3倍)
- 即座に加速
- 最高速度は72km/h
- 高速時の出力制限あり
```

## 🎯 チューニングの方向性

### Bruno Simon風を維持
1. **軽い車体** - アーケード的な動き
2. **低摩擦** - ドリフトの楽しさ
3. **柔らかいサスペンション** - バウンシーな挙動
4. **適度な速度** - コントロール可能な範囲

### InteractiveCarの独自性
1. **ターボシステム** - 瞬間的な加速の楽しさ
2. **多様なギミック** - プレイの幅を広げる
3. **車種選択** - プレイヤーの好みに対応
4. **安全機能** - ユーザビリティの向上

## 📝 更新履歴

- **v0.3** - Bruno Simon風チューニング実装
  - 車両質量を180kgに軽量化
  - 摩擦係数を3に低減
  - 重力を-15に調整
  - 各種ギミックのパワー調整