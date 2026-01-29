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

key	text	Primary Key ('ai_chat', 'shift_pilot'等)
description	text	機能説明
default_enabled	boolean	デフォルトの有効/無効
tenant_flags (スイッチボード)

tenant_id	UUID	FK (tenants.id)
feature_key	text	FK (features.key)
is_enabled	boolean	店舗ごとの有効/無効
logs (対話・分析データ)

id	bigint	Primary Key
user_id	text	LINE User ID
content_encrypted	text	AES-256-GCM暗号化済みの本文
category	text	AI分析：人間関係/設備/待遇 等
impact	smallint	AI分析：ストレス強度 (1-10)
summary	text	AI分析：管理者用サマリー (20文字)
prescription	text	AI分析：組織改善への具体的処方箋
sender	text	'USER' または 'AI'

store_policies
tenant_id	UUID (PK/FK)	tenants.id への参照
shift_cycle	text	シフト単位 ('weekly', 'bi_weekly', 'monthly')
salary_closing_day	smallint	給与締め日 (1-28, 99:末日)
shift_start_day	smallint	シフト開始日 (1-28, 99:末日)
target_labor_cost_rate	numeric	目標人件費率 (%)
target_sales_daily	bigint	標準的な1日の売上目標
sanctuary_params	jsonb	【Sanctuary】 お気に入り、NGペア、推奨NG
labor_law_config	jsonb	【ガードレール】 休憩・インターバル・連勤設定
thx_mileage_settings	jsonb	【Thxマイレージ】 加点ロジック設定


5. ファイル構成ツリー（Directory Structure）
最新ファイル構成ツリー (Directory Structure v3.1)
code
Text
project-seed-v3.1
├── .env.local                  # ローカル環境変数
├── .gitignore
├── next-env.d.ts
├── next.config.mjs
├── package-lock.json
├── package.json
├── postcss.config.js           # CSSポストプロセッサ設定
├── README.md
├── tailwind.config.ts
├── test-crypto.js              # 暗号化テスト用スクリプト
├── blue.prints/                # 【SSOT】プロジェクトの全設計図
├── tsconfig.json
│   ├── architecture_master.md
│   ├── spec_v1_1_db_schema.md
│   └── spec_v2_4_grand_design.md
├── src/
│   ├── app/                              # Next.js 15 App Router
│   │   ├── admin/                       # 店長専用：Sanctuary（聖域）
│   │   │   ├── actions.ts              # 管理者向けサーバーアクション
│   │   │   ├── layout.tsx
│   │   │   ├── page.tsx
│   │   │   ├── shift-gen/              # AIシフト生成
│   │   │   │   ├── page.tsx
│   │   │   │   └── shift-list/ 
│   │   │   │       └── page.tsx       # 保存済みシフトの一覧と削除
│   │   │   └── staff/                  # 管理者・スタッフ名簿
│   │   │       ├── actions.ts
│   │   │       ├── page.tsx
│   │   │       └── StaffTable.tsx
│   │   ├── api/                         # LINE Webhook、APIエンドポイント
│   │   │   ├── hertz_data/　         　# チームのヘルスデータ
│   │   │   │   └── route.ts
│   │   │   └── webhook/
│   │   │       └── route.ts
│   │   ├── dashboard/                   # 管理者：コックピット
│   │   │   ├── actions.ts
│   │   │   ├── page.tsx
│   │   │   ├── sanctuary/　          　# 管理者専用ページ
│   │   │   │   ├── actions.ts
│   │   │   │   └── page.tsx
│   │   │   ├── settings/               # 店舗設定（store_policies）UI
│   │   │   │   ├── features/          # 機能トグル設定
│   │   │   │   │   ├── actions.ts
│   │   │   │   │   ├── feature-toggle-form.tsx
│   │   │   │   │   └── page.tsx
│   │   │   │   ├── page.tsx
│   │   │   │   └── store-policy-form.tsx　# 労基法設定UI & カンマフォーマット追加
│   │   │   └── staff/                  # スタッフ管理セクション
│   │   │       ├── [id]/　　　　       # 個別設定ページ用ディレクトリ
│   │   │       ├── actions.ts
│   │   │       └── page.tsx
│   │   ├── fonts/                       # フォント資産 (GeistVF.woff等)
│   │   ├── login/                       # 認証：ログインページ
│   │   │   ├── actions.ts
│   │   │   └── page.tsx
│   │   ├── staff/                       # スタッフ：LINE LIFF画面
│   │   │   └── shift/                  # スタッフ用シフト閲覧
│   │   │       ├── layout.tsx
│   │   │       └── page.tsx
│   │   ├── favicon.ico
│   │   ├── globals.css
│   │   ├── layout.tsx
│   │   └── page.tsx                     # ランディング/ルート分岐
│   ├── components/                       # 共有UIコンポーネント
│   │   ├── providers/                   # Auth/Tenant Context Providers
│   │   ├── staff/                       # LIFF専用コンポーネント
│   │   └── ui/                          # Shadcn/UI 等の原子コンポーネント（未実装）
│   ├── features/                         # 【重要】ドメイン駆動：ビジネスロジック層
│   │   ├── chat/                        # AIチャット・Safety Brake関連
│   │   ├── shift/    
│   │   │    └── actions.ts             # AIシフト生成・store_policiesロジック
│   │   └── staff/                       # スタッフドメイン
│   │       ├── actions.ts               # LINE IDによるスタッフ取得ロジック
│   │       └── service.ts               # スタッフデータ取得・マッピング
│   ├── lib/                              # 外部サービス接続・基盤設定
│   │   ├── ai/                          # Gemini 2.5 Flash ラッパー(未実装）
│   │   ├── auth/                        # Supabase Auth (@supabase/ssr)
│   │   ├── db/                          # 【RENAME】旧supabase。DBクライアント集約
│   │   ├── auth.ts                      # Supabase Auth (@supabase/ssr)#
│   │   ├── constans.ts                  # 【RENAME】旧supabase。DBクライアント集約
│   │   ├── features.ts                  # 機能フラグ (isFeatureEnabled)
│   │   └── proxy.ts                     # セキュリティ・ゲートウェイ
│   ├── types/                            # 型定義
│   │   ├── database_main.ts             # Main DB 型定義
│   │   ├── database_manual.ts           # Manual DB 型定義（最新版）
│   │   └── database_.ts   
│   └── utils/                            # 共通ユーティリティ
│       └── crypto.ts                     # 【最重要】LINE_SECRETベース暗号化
│       └── supabase.ts

AI: 現在 genAI の初期化は src/features/shift/actions.ts 内で行われており、src/lib/ai/ はまだ作成されていない。
型定義: 現在のコードは src/types/database.ts (単一ファイル) を参照している。database_main.ts / database_manual.ts への分割は未実施。
DB: src/lib/db/server.ts が createMainClient / createManualClient を提供している。

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

src
src\app
src\app\admin
src\app\admin\staff
src\app\admin\staff\actions.ts
src\app\admin\staff\page.tsx
src\app\admin\staff\StaffTable.tsx
src\app\admin\actions.ts
src\app\admin\layout.tsx
src\app\admin\page.tsx
src\app\api
src\app\api\hertz_data
src\app\api\hertz_data\route.ts
src\app\api\webhook
src\app\api\webhook\route.ts
src\app\dashboard
src\app\dashboard\sanctuary
src\app\dashboard\sanctuary\actions.ts
src\app\dashboard\settings
src\app\dashboard\settings\features
src\app\dashboard\settings\features\actions.ts
src\app\dashboard\settings\features\feature-toggle-form.tsx
src\app\dashboard\settings\features\page.tsx
src\app\dashboard\page.tsx
src\app\fonts
src\app\fonts\GeistMonoVF.woff
src\app\fonts\GeistVF.woff
src\app\login
src\app\login\actions.ts
src\app\login\page.tsx
src\app\staff
src\app\staff\shift
src\app\staff\shift\actions.ts
src\app\staff\shift\layout.tsx
src\app\staff\shift\page.tsx
src\app\staff\actions.ts
src\app\favicon.ico
src\app\globals.css
src\app\layout.tsx
src\app\page.tsx
src\components
src\components\providers
src\components\providers\LiffProvider.tsx
src\components\staff
src\components\staff\shift
src\components\staff\shift\ShiftClient.tsx
src\components\staff\shift\ShiftForm.tsx
src\features
src\features\chat
src\features\chat\flex_templates.ts
src\features\chat\gemini.ts
src\features\chat\prompts.ts
src\lib
src\lib\ai
src\lib\ai\context.ts
src\lib\ai\gemini.ts
src\lib\auth
src\lib\auth\admin.ts
src\lib\db
src\lib\db\manual.ts
src\lib\supabase
src\lib\supabase\server.ts
src\lib\auth.ts
src\lib\constants.ts
src\lib\features.ts
src\lib\proxy.ts
src\types
src\types\database.ts
src\types\database_main.ts
src\types\database_manual.ts
src\utils
src\utils\crypto.ts
src\utils\supabase.ts
.env.local
.gitignore
next-env.d.ts
next.config.mjs
package-lock.json
package.json
postcss.config.js
README.md
tailwind.config.ts
tsconfig.json