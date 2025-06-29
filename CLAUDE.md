# Interactive Car Simulator - プロジェクト仕様書

## 🌏 グローバルルール
**重要**: すべてのプロジェクトにおいて、以下のルールを厳守すること：
- **言語設定**: すべてのメッセージ、コメント、ドキュメントは**日本語**で記述する
- **適用範囲**: このルールは全プロジェクトに適用される
- **例外**: 英語のライブラリ名、関数名、変数名などのコード要素は除く

## 💝 コミュニケーションスタイル
**重要**: ユーザーとのやり取りでは、以下のスタイルを心がけること：
- 親しみやすく、愛らしい口調で対応する
- 絵文字を適度に使用して親近感を演出する（😊 🎉 ✨ など）
- 専門用語を使う際は、わかりやすい説明を添える
- ユーザーの成功を一緒に喜ぶ姿勢を示す

## 🎯 コーディング品質ガイドライン

### DRY原則（Don't Repeat Yourself）
**重要**: 以下のベストプラクティスを常に意識し、積極的に提案すること：

#### 1. コードの重複を避ける
- 同じ処理が2箇所以上で使われる場合は、共通関数として抽出する
- 例: `resetVehicle()` のようにリセット処理を統合

#### 2. 設定値の一元管理
- マジックナンバーは避け、`config.js` に定数として定義
- 例: `Y座標 < -10` → `Y座標 < CONFIG.GAME.RESPAWN_THRESHOLD`

#### 3. イベントハンドラの統合
- 似たような処理は共通化してパラメータで分岐
- 例: すべてのメッセージ表示を同一関数で処理

#### 4. UIコンポーネントの再利用
- 同じようなUI要素は共通コンポーネント化
- 例: 警告表示、通知メッセージなどの統一

#### 5. エラーハンドリングの標準化
- エラー処理パターンを統一し、共通関数で処理
- ログ出力、ユーザー通知などを一元化

### 提案タイミング
以下の場面では、積極的にリファクタリングを提案：
- 同じコードパターンが2回以上出現した時
- 新機能追加時に既存コードと類似処理がある時
- メンテナンス性を向上できる改善案がある時

### コード例
```javascript
// 良い例：共通化された処理
function showNotification(message, type = 'info', duration = 3000) {
    // 統一された通知表示処理
}

// 悪い例：重複した処理
// ファイルA
uiManager.showMessage('エラーが発生しました', 3000);
// ファイルB  
uiManager.showMessage('保存しました', 3000);
```

## プロジェクト概要
Three.jsとCannon.jsを使用したリアルタイム3Dドライビングシミュレーションゲーム。  
**最新更新: 2024年 - モジュラー構造にリファクタリング完了**

## 📁 ファイル構成（リファクタリング後）

```
InteractiveCar/
├── index.html              # 元のモノリシック版
├── index_modular.html      # 新しいモジュラー版
├── js/                     # モジュラーJavaScriptファイル
│   ├── config.js          # 設定・定数管理
│   ├── physics.js         # 物理エンジン（Cannon.js）
│   ├── vehicle.js         # 車両システム
│   ├── terrain.js         # 地形・環境システム
│   ├── items.js           # アイテム・収集システム
│   ├── ui.js              # UI・HUD管理
│   ├── input.js           # 入力処理
│   ├── audio.js           # オーディオシステム
│   └── main.js            # メインゲームループ
├── BK/                    # バックアップファイル群
├── package.json
├── package-lock.json
└── CLAUDE.md              # このファイル
```

## 🔧 技術スタック

### フロントエンド
- **3Dレンダリング**: Three.js (r128)
- **物理エンジン**: Cannon.js (0.6.2) 
- **UI**: HTML/CSS + カスタムCSS
- **3Dモデル**: GLTFLoader
- **オーディオ**: Web Audio API

### アーキテクチャ
- **モジュール形式**: ES6 Modules
- **設計パターン**: クラスベース、Separation of Concerns
- **コード分割**: 機能別モジュール分離

## 🚗 実装済み機能

### 1. 車両システム (vehicle.js)
- **物理ベース制御**: RaycastVehicleによるリアルな車両挙動
- **操作系**: WASD/矢印キー、スペース（ターボ）、Shift（ハンドブレーキ）
- **車両特性**:
  - 重量: 170kg（軽量化済み）
  - エンジン出力: 700N（通常）/ 1500N（ターボ時）
  - 最高速度: 90 km/h
  - 4輪独立サスペンション
- **速度制御**: 高速時のステアリング・エンジン出力自動調整

### 2. 物理システム (physics.js)
- **物理世界**: Cannon.js統合
- **衝突検出**: 最適化されたブロードフェーズ
- **マテリアル**: 摩擦・反発係数の詳細設定
- **デバッグ**: リアルタイム物理形状表示

### 3. 地形システム (terrain.js)  
- **基本地形**: 無限平面グラウンド
- **スロープ**: 角度調整可能な傾斜路
- **障害物**: 物理挙動付きスフィア
- **材質**: PBRマテリアル

### 4. アイテムシステム (items.js)
- **収集アイテム**: 25種類の趣味系絵文字アイテム
- **アニメーション**: 浮遊・回転エフェクト
- **収集管理**: 最大3個まで同時保持
- **パーティクル**: 収集時エフェクト

### 5. UIシステム (ui.js)
- **HUD**: 
  - リアルタイム速度表示（km/h）
  - ターボインジケーター
  - 収集アイテム表示スロット
- **メッセージ**: 動的通知システム
- **ローディング**: プログレス表示

### 6. オーディオシステム (audio.js)
- **エンジン音**: 速度連動のリアルタイム生成
- **効果音**: 
  - アイテム収集音
  - 衝突音  
  - ターボ音
- **音量制御**: マスター音量調整

### 7. 入力システム (input.js)
- **車両制御**: キーボード入力
- **デバッグ**: カメラ・パラメーター調整
- **UI操作**: ヘルプ・デバッグメニュー切替

## 🎮 操作方法

### 基本操作
- **W / ↑**: アクセル
- **S / ↓**: ブレーキ / バック  
- **A / ←**: 左折
- **D / →**: 右折
- **スペース**: ターボ（押している間有効）
- **R**: 車両リセット

### デバッグ操作
- **C**: 物理デバッグ表示切替
- **Tab**: デバッグメニュー表示
- **H**: ヘルプ表示切替
- **数字キー1-6**: カメラ位置調整
- **O/L**: スロープ高さ調整

## 🔄 リファクタリング内容

### 実施項目
1. **モノリシックコード分割**: 2500行の単一JSファイルを8個のモジュールに分離
2. **設定集約**: 全ての定数・設定をconfig.jsに統合
3. **クラス化**: 各システムをクラスベースで再構築
4. **ES6モジュール**: importベースの依存関係管理
5. **責任分離**: 各モジュールの役割を明確化

### パフォーマンス改善
- **コード分割**: ブラウザキャッシュ効率向上
- **メモリ管理**: 適切なクリーンアップ処理追加
- **読み込み最適化**: 段階的初期化実装

### 保守性向上
- **可読性**: 機能別ファイル分割
- **拡張性**: モジュラー設計によるプラグイン化可能
- **デバッグ**: 各システム独立テスト可能

## 📋 開発バックログ

### 🔥 高優先度 (v1.1)

#### 1. 車両3Dモデル統合: モジュラー版へのGLBファイル適用
- **内容**: 元のindex.htmlで使用しているGLBモデル（RX-7/R360）をモジュラー版に統合、車種選択機能の実装
- **目的**: ビジュアル品質の復元、モジュラー版の機能完全性
- **期待される効果**:
  - プレイヤーの満足度向上
  - 車両のディテール表現（ホイール回転、ライト等）
  - ブランディング強化
- **現状**: 
  - 元版: GitHubからGLBファイル読み込み、車種選択機能あり
  - モジュラー版: GLTFLoader実装済みだが青いBoxで表示中

#### 2. 地形生成システム: ノイズベース手続き地形
- **内容**: SimplexNoiseを使用した自動地形生成、起伏のある自然な地形の実装
- **目的**: 単調な平面から多様な地形への拡張
- **期待される効果**:
  - リプレイ性の向上（毎回異なる地形）
  - 走行の戦略性向上
  - 探索要素の追加

#### 3. コース設計: レーストラック・チェックポイント
- **内容**: 定義されたコースレイアウト、チェックポイントシステム、ラップタイム計測
- **目的**: ゲーム性の確立、目標の明確化
- **期待される効果**:
  - 競争要素の導入
  - スキル向上の可視化
  - リーダーボード機能への布石

#### 4. パフォーマンス最適化: フレームレート安定化
- **内容**: LOD実装、カリング最適化、描画呼び出し削減
- **目的**: 60FPS安定動作の実現
- **期待される効果**:
  - スムーズな操作体験
  - 低スペック環境での動作
  - バッテリー消費の削減

#### 5. モバイル対応: タッチ操作サポート
- **内容**: タッチコントロール実装、レスポンシブUI、ジャイロセンサー対応
- **目的**: スマートフォン・タブレットでのプレイ可能化
- **期待される効果**:
  - ユーザーベース拡大
  - カジュアルプレイの促進
  - アクセシビリティ向上

### 🎯 中優先度 (v1.2)

#### 6. マルチプレイヤー: WebRTC P2P対戦
- **内容**: リアルタイム対戦機能、ルーム作成・参加、同期処理
- **目的**: ソーシャル要素の追加、競争性の強化
- **期待される効果**:
  - プレイヤー間交流
  - リテンション率向上
  - バイラル効果

#### 7. 車両カスタマイズ: 色・パーツ変更システム
- **内容**: カラーピッカー、パーツ交換UI、プリセット保存
- **目的**: パーソナライゼーション、愛着の醸成
- **期待される効果**:
  - プレイヤーの個性表現
  - 長期エンゲージメント
  - 収益化の可能性

#### 8. アチーブメント: 実績・スコアシステム
- **内容**: 実績条件定義、進捗トラッキング、報酬システム
- **目的**: プレイ動機の提供、達成感の演出
- **期待される効果**:
  - プレイ時間の延長
  - 目標設定の多様化
  - ゲーム深度の向上

#### 9. 設定UI: グラフィック・オーディオ設定
- **内容**: 品質調整スライダー、音量調整、キーバインド変更
- **目的**: ユーザビリティ向上、環境適応性
- **期待される効果**:
  - 幅広い環境での快適プレイ
  - アクセシビリティ向上
  - プロフェッショナルな印象

#### 10. リプレイシステム: 走行記録・再生
- **内容**: 走行データ記録、ゴーストカー表示、ベストラップ保存
- **目的**: 自己改善の可視化、共有機能
- **期待される効果**:
  - スキル向上の促進
  - SNS共有による拡散
  - コミュニティ形成

### 🌟 低優先度 (v2.0)
- [ ] **VR対応**: WebXR実装
- [ ] **AI車両**: NPC・交通システム
- [ ] **天候システム**: 雨・夜間モード
- [ ] **レベルエディター**: コース作成ツール
- [ ] **ソーシャル機能**: スコア共有・ランキング

### 🔧 技術的改善
- [ ] **TypeScript移行**: 型安全性向上
- [ ] **WebWorker**: 物理計算並列化
- [ ] **PWA対応**: オフライン実行
- [ ] **テスト導入**: Unit/Integration テスト
- [ ] **CI/CD**: 自動ビルド・デプロイ

### 🎨 アセット拡充
- [ ] **3Dモデル**: 車両・環境アセット追加
- [ ] **テクスチャ**: PBR材質ライブラリ
- [ ] **オーディオ**: BGM・環境音追加
- [ ] **パーティクル**: エフェクトシステム強化

## 🛠️ セットアップ・実行

### 1. ファイル準備
現在のプロジェクトは静的ファイルのため、Webサーバーでの実行が必要：

```bash
# 簡易サーバー起動例
python -m http.server 8000
# または
npx live-server
```

### 2. ファイル選択
- **モノリシック版**: `index.html`（元の統合版）
- **モジュラー版**: `index_modular.html`（新しい分離版） ← **推奨**

### 3. 開発環境
- モダンブラウザ（Chrome/Firefox/Edge推奨）
- ES6 Modules対応
- WebGL対応

## 📊 パフォーマンス指標

### 目標値
- **フレームレート**: 60 FPS安定
- **初期ローディング**: 3秒以内
- **メモリ使用量**: 100MB以下
- **バンドルサイズ**: 500KB以下（外部ライブラリ除く）

### 現在の制約
- **3Dモデル**: プリミティブ形状のみ
- **テクスチャ**: 基本マテリアルのみ  
- **地形**: 単純平面＋スロープ
- **アイテム**: 絵文字ベース

## 🤝 コントリビューション

### コード規約
- **ES6+**: モダンJavaScript使用
- **命名**: camelCase（変数・関数）、PascalCase（クラス）
- **コメント**: 日本語・英語併用
- **フォーマット**: Prettier推奨

### 開発フロー
1. Featureブランチ作成
2. 機能実装・テスト
3. ドキュメント更新
4. プルリクエスト

## 📜 ライセンス・クレジット

### 使用ライブラリ
- Three.js (MIT License)
- Cannon.js (MIT License)  
- Swiper.js (MIT License)

### 参考・インスピレーション
- Bruno Simon's Portfolio (創造的なWebGL表現)
- Three.js Examples (技術実装参考)

---

**プロジェクト管理**: CLAUDE.md  
**最終更新**: 2024年 - モジュラーリファクタリング完了  
**バージョン**: v1.0 → v1.1 (Modular)