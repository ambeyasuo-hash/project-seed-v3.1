```mermaid
graph TD
    subgraph UI ["User Interface (Front-end Layer)"]
        LIFF["Staff: LINE LIFF (相談・シフト提出)"]
        ADMIN_UI["Manager: Dashboard (設定・承認)"]
    end

    subgraph Logic ["Logic Layer (Vercel Node.js)"]
        PROXY["proxy.ts (通信暗号化 & ルーティング)"]
        AUTH["Auth Service (Hybrid SSR Auth)"]
        FEAT_GATE["isFeatureEnabled (機能フラグ配電盤)"]
        
        subgraph Intel ["Intelligence Core"]
            AI_ENGINE["AI Engine: Gemini 2.5 Flash"]
            SAFETY["Safety Brake v1.4 (危機検知)"]
        end

        subgraph Workflow ["Workflow Engine"]
            APPROVE_LOGIC["承認フロー管理 (Draft to Publish)"]
        end
    end

    subgraph Data ["Data Layer (Supabase Dual-Core)"]
        subgraph MainDB ["Main DB: SEED (Core)"]
            M_TENANTS[("tenants (Master Record)")]
            AUTH_DATA[("Auth / セッション管理")]
            AI_LOGS[("処方箋 / 暗号化ログ")]
            
            M_TENANTS --- AUTH_DATA
        end

        subgraph ShiftDB ["Manual/Shift DB: SHIFT"]
            S_TENANTS[("tenants (Mirror Record)")]
            S_POLICIES[("store_policies (運営ルール)")]
            STAFF_DATA[("スタッフスキル / 賃金")]
            SHIFT_DATA[("シフトリクエスト / スロット")]
            
            S_TENANTS --> S_POLICIES
            S_POLICIES --- STAFF_DATA
        end
    end

    %% Identity Mirroring Bridge
    M_TENANTS -.->|UUID Mirroring| S_TENANTS

    %% Logic Flows
    ADMIN_UI -->|1 店舗設定の更新| S_POLICIES
    ADMIN_UI -->|2 承認・査読| APPROVE_LOGIC
    
    LIFF -->|3 相談・シフト提出| PROXY
    PROXY --> AUTH
    AUTH -->|4 テナント特定| M_TENANTS
    
    FEAT_GATE -->|5 有効化チェック| M_TENANTS
    
    %% AI Intelligence Flow
    S_POLICIES -.->|6 制約条件参照| AI_ENGINE
    STAFF_DATA & SHIFT_DATA -.->|7 コンテキスト供給| AI_ENGINE
    
    AI_ENGINE -->|8 シフト案生成| SHIFT_DATA
    AI_ENGINE --> SAFETY
    SAFETY -- SAFE --> AI_LOGS

    %% Styling
    style PROXY fill:#f96,stroke:#333,stroke-width:2px,color:#fff
    style AI_ENGINE fill:#6c6,stroke:#333,color:#fff
    style M_TENANTS fill:#f66,stroke:#333,stroke-width:3px,color:#fff
    style S_TENANTS fill:#f66,stroke:#333,stroke-dasharray: 5 5,color:#fff
    style S_POLICIES fill:#69f,stroke:#333,stroke-width:2px,color:#fff
    style AI_LOGS fill:#ff9,stroke:#333,color:#000