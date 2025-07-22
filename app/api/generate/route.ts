import { NextRequest, NextResponse } from 'next/server';

// 选项类型
type GenerateOption = 'improve' | 'fix' | 'shorter' | 'longer' | 'continue' | 'zap';

// 请求体类型
interface GenerateRequestBody {
  option: GenerateOption;
  command?: string;
  text?: string;
}

// Ollama响应类型
interface OllamaResponse {
  response?: string;
  done?: boolean;
}

// 提示词模板
const PROMPT_TEMPLATES: Record<GenerateOption, (text: string, command?: string) => string> = {
  improve: text => `请改进以下文本的表达和流畅性，保持原意不变：\n\n${text}`,
  fix: text => `请修正以下文本的语法和拼写错误：\n\n${text}`,
  shorter: text => `请将以下文本简化，保留核心信息：\n\n${text}`,
  longer: text => `请扩展以下文本，添加更多细节和信息：\n\n${text}`,
  continue: text => `请继续写下去：\n\n${text}`,
  zap: (text, command) => `${command}\n\n原文：${text}`,
};

// Ollama配置
const OLLAMA_URL = 'http://localhost:11434/api/generate';
const OLLAMA_MODEL = 'qwen2.5:0.5b';

// 转义JSON字符串
const escapeJsonString = (str: string) =>
  str
    .replace(/\\/g, '\\\\')
    .replace(/"/g, '\\"')
    .replace(/\n/g, '\\n')
    .replace(/\r/g, '\\r')
    .replace(/\t/g, '\\t');

// 生成提示词
const generatePrompt = (option: GenerateOption, text: string, command?: string) =>
  PROMPT_TEMPLATES[option]?.(text, command) ?? `请处理以下文本：\n\n${text}`;

// 调用Ollama API
const callOllamaAPI = async (prompt: string): Promise<Response> => {
  const res = await fetch(OLLAMA_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: OLLAMA_MODEL,
      prompt,
      stream: true,
    }),
  });
  if (!res.ok) throw new Error(`Ollama API error: ${res.status}`);
  return res;
};

// 创建流式响应
function createStreamResponse(ollamaResponse: Response, prompt: string): Response {
  const encoder = new TextEncoder();
  const decoder = new TextDecoder();

  const stream = new ReadableStream({
    async start(controller) {
      const reader = ollamaResponse.body?.getReader();
      if (!reader) {
        controller.error(new Error('无法获取响应流'));
        return;
      }

      let buffer = '';
      let totalTokens = 0;
      const promptTokens = Math.ceil(prompt.length / 4); // 更准确的token估算

      try {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          // 累积缓冲区处理不完整的JSON行
          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split('\n');
          buffer = lines.pop() || ''; // 保留最后一个可能不完整的行

          for (const line of lines) {
            if (!line.trim()) continue;

            try {
              const data: OllamaResponse = JSON.parse(line);

              if (data.response) {
                const escapedResponse = escapeJsonString(data.response);
                controller.enqueue(encoder.encode(`0:"${escapedResponse}"\n`));
                totalTokens += Math.ceil(data.response.length / 4); // 更准确的token计算
              }

              if (data.done) {
                const finalData = {
                  finishReason: "stop",
                  usage: {
                    promptTokens,
                    completionTokens: totalTokens,
                    totalTokens: promptTokens + totalTokens
                  }
                };
                controller.enqueue(encoder.encode(`d:${JSON.stringify(finalData)}\n`));
                controller.close();
                return;
              }
            } catch (e) {
              console.warn('JSON解析错误:', e, '行内容:', line);
            }
          }
        }

        // 处理剩余缓冲区
        if (buffer.trim()) {
          try {
            const data: OllamaResponse = JSON.parse(buffer);
            if (data.done) {
              const finalData = {
                finishReason: "stop",
                usage: {
                  promptTokens,
                  completionTokens: totalTokens,
                  totalTokens: promptTokens + totalTokens
                }
              };
              controller.enqueue(encoder.encode(`d:${JSON.stringify(finalData)}\n`));
            }
          } catch (e) {
            console.warn('处理剩余缓冲区时出错:', e);
          }
        }

        controller.close();
      } catch (e) {
        console.error('流处理错误:', e);
        controller.error(e);
      } finally {
        reader.releaseLock();
      }
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'Cache-Control': 'no-cache',
      Connection: 'keep-alive',
      'x-vercel-ai-data-stream': 'v1',
    },
  });
}

export async function POST(request: NextRequest) {
  try {
    const { option, command, text = '' }: GenerateRequestBody = await request.json();

    if (!option || !text.trim()) {
      return NextResponse.json(
        { error: '缺少必要参数：option 和 text' },
        { status: 400 }
      );
    }

    const prompt = generatePrompt(option, text, command);
    const ollamaResponse = await callOllamaAPI(prompt);
    return createStreamResponse(ollamaResponse, prompt);
  } catch (error: any) {
    console.error('AI API错误:', error);
    const errorMessage =
      error instanceof Error
        ? error.message.includes('fetch')
          ? 'AI服务暂时不可用，请确保Ollama服务正在运行'
          : error.message
        : 'AI服务发生未知错误';
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}