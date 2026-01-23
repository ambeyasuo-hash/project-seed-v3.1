# Project SEED v2: マスターアーキテクチャ統合図 v1.0

## 1. 全体構造 (Architecture Map)
```mermaid
graph TD
    subgraph "User Interface (Vercel)"
        LIFF[Staff: LINE LIFF / Time-First UX]
        ADMIN_UI[Manager: Dashboard / Settings]
    end

    subgraph "Logic Layer (Next.js App Router)"
        PROXY[proxy.ts: Security & Routing Gateway]
        AUTH[Auth Service: Hybrid SSR Auth]
        FEAT_GATE[isFeatureEnabled: Function Switch]
        AI_ENGINE[AI Engine: Gemini 2.5 Flash]
    end

    subgraph "Data Layer (Supabase Dual-Core)"
        subgraph "Main DB (jngg...)"
            AUTH_DATA[(Auth / Sessions)]
            AI_LOGS[(Encrypted Chat Logs)]
        end
        subgraph "Manual DB (pcxv...)"
            STAFF_DATA[(Staff / Skills / Wages)]
            SHIFT_DATA[(Shift Requests / Slots)]
            MANUAL_DATA[(Knowledge / Manuals)]
        end
    end

    LIFF & ADMIN_UI --> PROXY
    PROXY --> AUTH
    AUTH --> AUTH_DATA
    PROXY --> FEAT_GATE
    FEAT_GATE --> AI_ENGINE
    AI_ENGINE --> AI_LOGS
    AI_ENGINE -.->|READ via ai_copilot_reader| STAFF_DATA & SHIFT_DATA
    ADMIN_UI -->|Update Policy| STAFF_DATA & SHIFT_DATA
    LIFF -->|Submit Request| SHIFT_DATA

    style PROXY fill:#f96,stroke:#333,stroke-width:2px
    style AI_ENGINE fill:#6c6,stroke:#333
    style STAFF_DATA fill:#69f,stroke:#f00,stroke-width:2px

    graph TD
    User((飲食店スタッフ)) -- LINE/RichMenu --> LINE[LINE Messaging API]
    LINE -- Webhook --> Vercel[Vercel: /api/webhook]

    subgraph "Switchboard (The Gateway)"
        Vercel --> Auth{署名検証/Auth}
        Auth -- OK --> Tenant[テナントID取得/自動登録]
        Tenant --> Flags{機能フラグ確認}
    end

    subgraph "Logic Modules"
        Flags -- "ai_chat: ON" --> Safety[Safety Brake v1.4]
        Safety -- "SAFE" --> Gemini[Gemini 2.5 Flash-lite]
        Safety -- "RISK" --> Shredder[即時破棄/警告]
        
        Gemini --> Encrypt[AES-256 アプリ層暗号化]
        Encrypt --> DB[(Supabase Tokyo)]
        
        Flags -- "shift_pilot: ON" --> Shift[シフト管理モジュール]
        Flags -- "fortune: ON" --> Fortune[占いモジュール]
    end

    Gemini -- 応答生成 --> Flex[Flex Message / Shredder UI]
    Flex -- 返信 --> User
    
    DB -- 復号/分析 --> Dash[Hertz Dashboard]