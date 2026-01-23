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