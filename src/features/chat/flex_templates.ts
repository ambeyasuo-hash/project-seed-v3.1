// 簡略版の Flex Message 定義
export const compactShredderResponse = (text: string, logId: string) => ({
  type: "flex",
  altText: "AI返信（消去ボタン付）",
  contents: {
    type: "bubble",
    size: "micro", // 最もコンパクトなサイズに固定
    body: {
      type: "box",
      layout: "vertical",
      spacing: "md",
      contents: [
        { type: "text", text: text, wrap: true, size: "sm" }
      ]
    },
    footer: {
      type: "box",
      layout: "vertical",
      contents: [
        {
          type: "button",
          style: "link",
          height: "sm",
          color: "#FF3B30",
          action: {
            type: "postback",
            label: "消去",
            data: `action=shred&log_id=${logId}`,
            displayText: "記憶を消去しました"
          }
        }
      ]
    }
  }
});

// 過去ログ遡り用 カルーセル
export const historyShredderCarousel = (logs: {id: string, summary: string, created_at: string}[]) => ({
  type: "flex",
  altText: "過去の記憶を整理",
  contents: {
    type: "carousel",
    contents: logs.map(log => ({
      type: "bubble",
      size: "micro", // 最もコンパクト
      body: {
        type: "box", layout: "vertical", contents: [
          { type: "text", text: log.summary || "（内容なし）", size: "xs", wrap: true },
          { type: "text", text: new Date(log.created_at).toLocaleDateString(), size: "xxs", color: "#aaaaaa" }
        ]
      },
      footer: {
        type: "box", layout: "vertical", contents: [
          { type: "button", style: "link", height: "sm", color: "#FF3B30",
            action: { type: "postback", label: "消去", data: `action=shred&log_id=${log.id}`, displayText: "過去の記憶を消去しました" }
          }
        ]
      }
    }))
  }
});