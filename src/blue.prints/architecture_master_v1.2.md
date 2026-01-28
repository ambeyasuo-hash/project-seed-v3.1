architecture_master.md (v1.2 - 2024.10.24 最終統合版)
1. 統制理念 (Governance)
Identity Mirroring: Main DBとManual DBは同一の tenant_id (UUID) で同期される。
Policy-Driven AI: AIシフト生成は store_policies テーブルの制約を絶対条件とする。
Dual-Core Isolation: 認証・フラグ（Main）と 業務ロジック（Manual）を物理分離し、干渉を排除する。
2. マスターアーキテクチャ図 (v1.2)
code
Mermaid
graph TD
    subgraph "User Interface (Front-end Layer)"
        LIFF[Staff: LINE LIFF / 相談・シフト提出]
        ADMIN_UI[Manager: Dashboard / 聖域・設定・承認]
    end

    subgraph "Logic Layer (Vercel Node.js / Serverless)"
        PROXY[proxy.ts: 通信暗号化 & ルーティング]
        AUTH[Auth Service: Hybrid SSR Auth / テナント識別]
        FEAT_GATE[isFeatureEnabled: 機能フラグ配電盤]
        
        subgraph "Intelligence Core (Project Knowledge Engine)"
            AI_ENGINE[AI Engine: Gemini 2.5 Flash]
            SAFETY[Safety Brake v1.4: 危機検知]
        end
    end

    subgraph "Data Layer (Supabase Dual-Core)"
        subgraph "Main DB: SEED (Core Service)"
            M_TENANTS[(tenants: Master Record)]
            AUTH_DATA[(Auth / セッション管理)]
            AI_LOGS[(処方箋 / 暗号化チャットログ)]
            
            M_TENANTS ---|Identity & Flags| AUTH_DATA
        end

        subgraph "Manual/Shift DB: SHIFT (Business Logic)"
            S_TENANTS[(tenants: Mirror Record)]
            S_POLICIES[(store_policies: 運営ルール/忖度)]
            STAFF_DATA[(スタッフスキル / 賃金)]
            SHIFT_DATA[(シフトリクエスト / スロット)]
            
            S_TENANTS -->|FK: 参照整合性| S_POLICIES
            S_POLICIES --- STAFF_DATA
        end
    end

    %% Identity Mirroring Bridge
    M_TENANTS -.->|UUID Mirroring / 同一IDの同期| S_TENANTS

    %% Logic Flows
    ADMIN_UI -->|① 店舗設定の更新| S_POLICIES
    LIFF -->|② 相談・シフト提出| PROXY
    PROXY --> AUTH
    AUTH -->|③ テナント特定| M_TENANTS
    
    FEAT_GATE -->|④ 有効化チェック| M_TENANTS
    
    %% AI Intelligence Flow
    S_POLICIES -.->|⑤ 制約条件: 締め日/忖度/労基法| AI_ENGINE
    STAFF_DATA & SHIFT_DATA -.->|⑥ コンテキスト供給| AI_ENGINE
    
    AI_ENGINE -->|⑦ シフト案生成| SHIFT_DATA
    AI_ENGINE --> SAFETY
    SAFETY -- "SAFE" --> AI_LOGS

    %% Styling
    style PROXY fill:#f96,stroke:#333,stroke-width:2px,color:#fff
    style AI_ENGINE fill:#6c6,stroke:#333,color:#fff
    style M_TENANTS fill:#f66,stroke:#333,stroke-width:3px,color:#fff
    style S_TENANTS fill:#f66,stroke:#333,stroke-dasharray: 5 5,color:#fff
    style S_POLICIES fill:#69f,stroke:#333,stroke-width:2px,color:#fff
    style AI_LOGS fill:#ff9,stroke:#333,color:#000
3. 実装プロトコル (Implementation Protocol)
UUIDの一致: Main.tenants.id と Manual.tenants.id は常に一致していなければならない。
FK制約の遵守: store_policies は必ず Manual.tenants.id を親として参照すること。
フォールバック: proxy.ts は store_policies が未設定の場合、システムを止めずデフォルト値をAIに供給すること。
