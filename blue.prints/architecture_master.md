architecture_master.md (v1.1 - 2026.1.27 統合更新版)
1. プロジェクト憲章 (The Core Principles)
SSOT遵守: 本ファイルおよび spec_v1_1_db_schema.md に記載のない構造変更を禁ずる。
多層防御: LINE_CHANNEL_SECRET をシードとしたアプリケーション層暗号化を必須とする。
処方箋モデル: 管理者UIへの生ログ出力を禁止し、AIによる「処方箋（分析結果）」のみを透過させる。
2. システム全体図 (System Topology)
code
Mermaid
graph TD
    subgraph "User Interface (Next.js 15 App Router)"
        LIFF[Staff: LINE LIFF / 相談・シフト提出]
        ADMIN_UI[Manager: Dashboard / 処方箋閲覧・シフト管理]
    end

    subgraph "Security & Routing (Server-side)"
        PROXY[proxy.ts: 通信検閲 & 署名検証]
        AUTH[Auth: Supabase SSR / テナント識別]
        CRYPTO[utils/crypto.ts: LINE_SECRETベース暗号化]
    end

    subgraph "Intelligence Core (Gemini 2.5 Flash)"
        AI_ENGINE[AI Engine: 相談解析・シフト生成]
        SAFETY[Safety Brake v1.4: 比喩表現/危機検知]
        PRESCRIPTION[Prescription Logic: 生ログ破棄・要約生成]
    end

    subgraph "Data Layer (Supabase Dual-Core)"
        subgraph "Main DB (Core Service)"
            AUTH_DATA[(Auth/Session)]
            LOGS[(logs: 暗号化された対話データ)]
        end
        subgraph "Manual/Shift DB (Business Logic)"
            STAFF_DATA[(スタッフスキル/賃金)]
            SHIFT_DATA[(希望休/スロット)]
            MANUAL_DATA[(マニュアル: 凍結中)]
        end
    end

    %% Flow: Chat to Prescription
    LIFF -->|① 相談投稿| PROXY
    PROXY -->|② 署名検証| AUTH
    AUTH -->|③ 暗号化| CRYPTO
    CRYPTO -->|④ 保存| LOGS
    
    LOGS -->|⑤ 復号(Server-side Only)| PRESCRIPTION
    PRESCRIPTION -->|⑥ 処方箋生成| AI_ENGINE
    AI_ENGINE -->|⑦ 生ログ破棄| ADMIN_UI

    %% Flow: Shift Generation
    STAFF_DATA & SHIFT_DATA -->|⑧ コンテキスト提供| AI_ENGINE
    AI_ENGINE -->|⑨ シフト案生成| ADMIN_UI

    style PROXY fill:#f96,stroke:#333,color:#fff
    style CRYPTO fill:#f66,stroke:#333,color:#fff
    style AI_ENGINE fill:#6c6,stroke:#333,color:#fff
    style LOGS fill:#ff9,stroke:#333,color:#000
    style PRESCRIPTION fill:#69f,stroke:#333,color:#fff
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

## 1. 全体構造 (Architecture Map)
code
Mermaid
graph TD
    subgraph "User Interface (Front-end Layer)"
        LIFF[Staff: LINE LIFF / 雑談・マニュアル投稿]
        ADMIN_UI[Manager: Dashboard / マニュアル査読・承認]
    end

    subgraph "Logic Layer (Vercel Node.js / Serverless)"
        PROXY[proxy.ts: 通信暗号化 & ルーティング]
        AUTH[Auth Service: Hybrid SSR Auth / テナント識別]
        FEAT_GATE[isFeatureEnabled: 機能フラグ配電盤]
        
        subgraph "Intelligence Core (Project Knoredge Engine)"
            AI_ENGINE[AI Engine: Gemini 2.5 Flash]
            SAFETY[Safety Brake v1.4: 危機検知]
            FORMATTER[AI Formatter: 投稿内容の構造化]
        end

        subgraph "Workflow Engine"
            APPROVE_LOGIC[承認フロー管理: Draft to Publish]
        end
    end

    subgraph "Data Layer (Supabase Dual-Core)"
        subgraph "Main DB: jngg... (Core Service)"
            AUTH_DATA[(Auth / セッション管理)]
            AI_LOGS[(処方箋 / 暗号化チャットログ)]
        end
        subgraph "Manual/Shift DB: pcxv... (Business Logic)"
            STAFF_DATA[(スタッフスキル / 賃金)]
            SHIFT_DATA[(シフトリクエスト / スロット)]
            
            subgraph "MANUAL_DATA (Living Manual)"
                M_DRAFT[(草稿: Pending)]
                M_PUB[(公開: Live Knowledge)]
                M_HIST[(変更履歴: Revision)]
            end
        end
    end

    %% Living Manual Core Flows
    LIFF -->|① 気づき・画像をアップロード| PROXY
    PROXY -->|② 下書き作成| FORMATTER
    FORMATTER -->|③ 構造化データ| M_DRAFT
    
    M_DRAFT -->|④ 承認依頼通知| ADMIN_UI
    ADMIN_UI -->|⑤ 査読・編集・公開ボタン| APPROVE_LOGIC
    APPROVE_LOGIC -->|⑥ 公開ステータスへ昇格| M_PUB
    APPROVE_LOGIC -->|履歴保存| M_HIST

    %% AI as a true Pilot (Integration)
    AI_ENGINE -.->|ai_copilot_reader| M_PUB
    M_PUB -.->|⑦ 現場への回答・検索| AI_ENGINE
    AI_ENGINE -->|回答生成| LIFF

    %% Business Flows
    ADMIN_UI -->|Update Policy| STAFF_DATA & SHIFT_DATA
    LIFF -->|提出/閲覧| SHIFT_DATA
    
    %% Common Logic Flow
    LIFF & ADMIN_UI --> PROXY
    PROXY --> AUTH
    AUTH --> AUTH_DATA
    PROXY --> FEAT_GATE
    FEAT_GATE -- "マニュアル/チャットON" --> AI_ENGINE
    AI_ENGINE --> SAFETY
    SAFETY -- "SAFE" --> AI_LOGS

    %% Styling
    style PROXY fill:#f96,stroke:#333,stroke-width:2px,color:#fff
    style AI_ENGINE fill:#6c6,stroke:#333,color:#fff
    style STAFF_DATA fill:#69f,stroke:#333,color:#fff
    style M_PUB fill:#f0f,stroke:#333,stroke-width:3px,color:#fff
    style M_DRAFT fill:#ddd,stroke:#333,stroke-dasharray: 5 5
    style AI_LOGS fill:#ff9,stroke:#333,color:#000