Project SEED: 飲食店AI副操縦士 再構成設計図
1. 哲学・ビジョン（The Soul）
Vision: AIを単なるツールではなく「ミトコンドリア」のような共生体とし、過酷な飲食店の現場を、より人間らしく創造的な場所へ変革する。
Philosophy:
「誠実な非力さ」: AIは全能の監視者ではなく、ユーザーの隣で共に悩み、ユーザーが望めば記憶を消し去る「味方」であること。
「鏡と処方箋」: 現場の「叫び（ヘルツ）」を鏡のように映し出し、経営者には「誰が言ったか」ではなく「どう解決すべきか（処方箋）」のみを届ける。
2. システムアーキテクチャ（The Switchboard）
機能フラグによって各モジュールを動的に制御する「ルーター型アーキテクチャ」を採用。
architecture_master.mdに記述
3. 詳細仕様（Core Functional Specs）
① Safety Brake v1.4 (安全装置)
文脈解読: 「死ぬほど忙しい」等の比喩表現は SAFE と判定し、現場のシグナルとして保存。具体的犯罪・暴力・自傷の実行意思のみを RISK と判定。
挙動: RISK判定時はDB保存をバイパスし、即座に専門の相談窓口（静的Flex Message）を提示。
② 暗号化・プライバシー（Privacy First）
方式: AES-256-GCM。
鍵管理: LINEのChannel Secretをシードにしたアプリケーション層暗号化。データベース管理者であっても、復号鍵なしには本文を閲覧不能。
シュレッダーUI: 全てのAI応答に「この記憶を消去する」ボタン（Postback）を付与。押下された瞬間、DBから物理削除。
③ 処方箋（Prescription）モデル
データ活用: 経営者向けのCSV出力からは「時刻」「個人名」「生の発言」を完全に排除。
生成: AIが発言を「組織改善のための具体的アクションプラン」へ変換し、prescriptionカラムに保存。金脈（データ）を金塊（改善アクション）へ昇華させる。
4. データベース設計（Supabase Schema）
tenants (店舗・ユーザー管理)
カラム	型	説明
id	UUID	Primary Key (gen_random_uuid)
line_user_id	text	LINEのユーザーID (Unique)
name	text	店舗名/スタッフ名
features (機能カタログ)
カラム	型	説明
key	text	Primary Key ('ai_chat', 'shift_pilot'等)
description	text	機能説明
default_enabled	boolean	デフォルトの有効/無効
tenant_flags (スイッチボード)
カラム	型	説明
tenant_id	UUID	FK (tenants.id)
feature_key	text	FK (features.key)
is_enabled	boolean	店舗ごとの有効/無効
logs (対話・分析データ)
カラム	型	説明
id	bigint	Primary Key
user_id	text	LINE User ID
content_encrypted	text	AES-256-GCM暗号化済みの本文
category	text	AI分析：人間関係/設備/待遇 等
impact	smallint	AI分析：ストレス強度 (1-10)
summary	text	AI分析：管理者用サマリー (20文字)
prescription	text	AI分析：組織改善への具体的処方箋
sender	text	'USER' または 'AI'
5. ファイル構成ツリー（Directory Structure）
code
Text
app/
├── api/
│   ├── webhook/
│   │   └── route.ts       # 全イベントの入り口・ルーター
│   └── dashboard/
│       └── route.ts       # 期間指定・CSV出力対応の分析API
├── dashboard/
│   └── page.tsx           # Hertz Dashboard UI (Recharts実装)
├── utils/
│   ├── crypto.ts          # AES-256-GCM 暗号化/復号ロジック
│   └── flags.ts           # 機能フラグ/テナント取得ロジック
├── features/              # 機能ごとのカプセル化
│   ├── chat/
│   │   ├── prompts.ts     # 処方箋/対話プロンプト
│   │   └── logic.ts       # Gemini連携・Safety Brake
│   ├── shift/             # (将来拡張)
│   └── fortune/           # (将来拡張)
└── .env                   # 厳重管理される6つの環境変数
6. 実装プロトコル（Implementation Guide）
環境変数 (Critical 6)
LINE_CHANNEL_SECRET: 署名検証および暗号化シード
LINE_CHANNEL_ACCESS_TOKEN: LINE送信用の鍵
GEMINI_API_KEY: Google Cloud (Vertex AI) 接続用
DB_TARGET_URL: Supabase URL
DB_TARGET_KEY: Supabase Anon Key
DB_ENCRYPTION_KEY: AES-256用 32byte 固定鍵
開発・運用ルール
Zero Hardcoding: コード内にAPIキーや特定のIDを直書きすることを厳禁とする。
Force-Dynamic: Vercel/Next.jsのキャッシュによる「環境変数の読み込み不全」を防ぐため、export const dynamic = 'force-dynamic' をAPIルートに必須とする。
Ghost Prevention: プロジェクト移行時は、旧プロジェクトのWebhook URLを即座に無効化し、キャッシュの残骸を完全に排除すること。
