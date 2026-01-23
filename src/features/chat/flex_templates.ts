// AIの通常返信（モードON時のみ使用）
export const compactShredderResponse = (text: string, logId: string) => ({
    type: "flex",
    altText: "AIの回答",
    contents: {
      type: "bubble",
      size: "sm", // コンパクトサイズ
      body: {
        type: "box",
        layout: "vertical",
        spacing: "none",
        contents: [
          { type: "text", text: text, wrap: true, size: "sm", color: "#333333" },
          {
            type: "button",
            style: "link",
            height: "sm",
            color: "#FF3B30",
            action: {
              type: "postback",
              label: "消去",
              data: `action=shred&log_id=${logId}`
            }
          }
        ]
      }
    }
  });
  
  // 過去ログ遡り用（カルーセル）
  export const historyShredderCarousel = (logs: {id: string, summary: string, created_at: string}[]) => ({
    type: "flex",
    altText: "過去の記憶を整理",
    contents: {
      type: "carousel",
      contents: logs.map(log => ({
        type: "bubble",
        size: "micro",
        body: {
          type: "box",
          layout: "vertical",
          contents: [
            { type: "text", text: log.summary || "（内容なし）", size: "xs", wrap: true },
            { type: "text", text: new Date(log.created_at).toLocaleString('ja-JP'), size: "xxs", color: "#aaaaaa" }
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
              action: { type: "postback", label: "消去", data: `action=shred&log_id=${log.id}` }
            }
          ]
        }
      }))
    }
  });