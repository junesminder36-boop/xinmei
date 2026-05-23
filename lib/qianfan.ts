const QIANFAN_API_KEY = process.env.QIANFAN_API_KEY;
const QIANFAN_V2_URL = "https://qianfan.baidubce.com/v2/chat/completions";
const QIANFAN_NATIVE_URL =
  "https://aip.baidubce.com/rpc/2.0/ai_custom/v1/wenxinworkshop/chat/completions";
const QIANFAN_OAUTH_URL = "https://aip.baidubce.com/oauth/2.0/token";

export interface QianfanMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

interface AccessToken {
  token: string;
  expiresAt: number;
}

let cachedToken: AccessToken | null = null;

/**
 * 解析百度智能云凭证格式：bce-v3/<access-key-id>/<secret-access-key>
 * 如果是普通 Bearer Token（不含斜杠），直接返回 null 表示无需 OAuth
 */
function parseCredentials(
  key: string
): { accessKey: string; secretKey: string } | null {
  if (!key.includes("/")) {
    return null; // 已经是 Bearer Token
  }
  const parts = key.split("/");
  // 格式: bce-v3/<ak>/<sk> 或 <ak>/<sk>
  if (parts.length >= 3 && parts[0].startsWith("bce")) {
    return { accessKey: parts[1], secretKey: parts[2] };
  }
  if (parts.length === 2) {
    return { accessKey: parts[0], secretKey: parts[1] };
  }
  return null;
}

async function fetchAccessToken(ak: string, sk: string): Promise<string> {
  const url = `${QIANFAN_OAUTH_URL}?grant_type=client_credentials&client_id=${encodeURIComponent(
    ak
  )}&client_secret=${encodeURIComponent(sk)}`;

  const response = await fetch(url, { method: "POST" });
  if (!response.ok) {
    const text = await response.text();
    throw new Error(`千帆 OAuth 失败: ${response.status} ${text}`);
  }

  const data = (await response.json()) as {
    access_token?: string;
    expires_in?: number;
    error?: string;
    error_description?: string;
  };

  if (data.error) {
    throw new Error(
      `千帆 OAuth 错误: ${data.error} ${data.error_description || ""}`
    );
  }

  if (!data.access_token) {
    throw new Error("千帆 OAuth 未返回 access_token");
  }

  return data.access_token;
}

async function getAccessToken(): Promise<{
  token: string;
  isBearer: boolean;
}> {
  const rawKey = QIANFAN_API_KEY;
  if (!rawKey) {
    throw new Error("未配置 QIANFAN_API_KEY 环境变量");
  }

  const creds = parseCredentials(rawKey);

  // 如果已经是纯 Bearer Token，直接使用
  if (!creds) {
    return { token: rawKey, isBearer: true };
  }

  // 检查缓存
  if (cachedToken && Date.now() < cachedToken.expiresAt) {
    return { token: cachedToken.token, isBearer: false };
  }

  // 重新获取 access_token
  const token = await fetchAccessToken(creds.accessKey, creds.secretKey);
  // 提前 10 分钟过期，避免边缘情况
  cachedToken = { token, expiresAt: Date.now() + 28 * 24 * 60 * 60 * 1000 };
  return { token, isBearer: false };
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
  const { token, isBearer } = await getAccessToken();
  const model = options?.model || "ernie-speed-128k";
  const temperature = options?.temperature ?? 0.7;
  const maxTokens = options?.maxTokens ?? 2000;

  const body: Record<string, unknown> = {
    model,
    messages,
    temperature,
    max_tokens: maxTokens,
  };

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
  const timeout = setTimeout(() => controller.abort(), 45000);

  try {
    let response: Response;

    if (isBearer) {
      // OpenAI 兼容接口（v2）
      response = await fetch(QIANFAN_V2_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(body),
        signal: controller.signal,
      });
    } else {
      // 百度原生接口：access_token 放 URL 参数里
      const url = `${QIANFAN_NATIVE_URL}?access_token=${encodeURIComponent(
        token
      )}`;
      response = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
        signal: controller.signal,
      });
    }

    clearTimeout(timeout);

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`千帆 API 错误: ${response.status} ${errorText}`);
    }

    const data = (await response.json()) as Record<string, unknown>;

    // 尝试两种响应格式
    // v2 / OpenAI 兼容格式
    const choices = data.choices as
      | Array<{ message?: { content?: string } }>
      | undefined;
    if (choices && choices[0]?.message?.content) {
      return choices[0].message.content;
    }

    // 百度原生格式
    const result = data.result as string | undefined;
    if (result) {
      return result;
    }

    throw new Error("千帆返回内容为空");
  } catch (error) {
    clearTimeout(timeout);
    throw error;
  }
}
