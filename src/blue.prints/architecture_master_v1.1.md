architecture_master.md (v1.1 - 2026.1.27 統合更新版)

1. プロジェクト憲章 (The Core Principles)
SSOT遵守: 本ファイルおよび spec_v1_1_db_schema.md に記載のない構造変更を禁ずる。
多層防御: LINE_CHANNEL_SECRET をシードとしたアプリケーション層暗号化を必須とする。
処方箋モデル: 管理者UIへの生ログ出力を禁止し、AIによる「処方箋（分析結果）」のみを透過させる。

2. システム全体図 (System Topology)
 system_topologyに記載


3. 統制プロトコル (Mandatory Protocols)
① 暗号化プロトコル (Encryption)
方式: AES-256-GCM
鍵生成: process.env.LINE_CHANNEL_SECRET をシードとして使用。
実装: src/utils/crypto.ts の関数を全セクションで強制使用。
② 安全装置 (Safety Brake v1.4)
比喩判定: 「死ぬほど忙しい」等の表現を「SAFE」と識別し、現場の熱量として保存。
実行阻止: 具体的犯罪・自傷行為のみを「RISK」とし、DB保存をバイパスして相談窓口へ誘導。
③ 処方箋（Prescription）化フロー
管理者画面の制約: logs テーブルの content_encrypted をフロントエンドに渡してはならない。
抽象化: AIが生成した summary (20文字) と prescription (アクションプラン) のみを表示。

4. ファイル構造 (Directory Standard)
code
Text
src/
├── app/
│   ├── admin/          # 管理者ダッシュボード (Sanctuary)
│   ├── api/            # LINE Webhook / AI API
│   ├── dashboard/      # シフト管理・設定
│   ├── login/          # 認証ゲート
│   └── staff/          # LIFF画面
├── components/         # 共有UIコンポーネント
├── features/           # 機能別ロジック (chat, shift)
├── lib/
│   ├── ai/             # Geminiラッパー / Safety Brake
│   ├── db/             # Supabase Client (Main/Manual)
│   └── proxy.ts        # セキュリティゲートウェイ
├── types/              # 共通型定義 (database.ts)
└── utils/
    └── crypto.ts       # 【最重要】暗号化ユーティリティ




# Project SEED v2: マスターアーキテクチャ統合図 v1.0

