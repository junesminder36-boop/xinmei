const QIANFAN_API_KEY = process.env.QIANFAN_API_KEY;
const QIANFAN_API_URL = "https://qianfan.baidubce.com/v2/chat/completions";

export interface QianfanMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

export async function callQianfan(
  messages: QianfanMessage[],
  options?: {
    model?: string;
    temperature?: number;
    maxTokens?: number;
    enableSearch?: boolean;
  }
): Promise<string> {
  const apiKey = QIANFAN_API_KEY;
  if (!apiKey) {
    throw new Error("未配置 QIANFAN_API_KEY 环境变量");
  }

  const model = options?.model || "ernie-speed-128k";
  const temperature = options?.temperature ?? 0.7;
  const maxTokens = options?.maxTokens ?? 2000;

  const body: Record<string, unknown> = {
    model,
    messages,
    temperature,
    max_tokens: maxTokens,
  };

  // 启用联网搜索（千帆支持 web_search 工具）
  if (options?.enableSearch) {
    body.tools = [
      {
        type: "web_search",
        web_search: {
          enable: true,
          search_mode: "auto",
        },
      },
    ];
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 20000);

  try {
    const response = await fetch(QIANFAN_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify(body),
      signal: controller.signal,
    });

    clearTimeout(timeout);

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`千帆 API 错误: ${response.status} ${errorText}`);
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;

    if (!content) {
      throw new Error("千帆返回内容为空");
    }

    return content as string;
  } catch (error) {
    clearTimeout(timeout);
    throw error;
  }
}
