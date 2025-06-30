import { NextRequest, NextResponse } from 'next/server';

// 定义选项类型
type GenerateOption = 'improve' | 'fix' | 'shorter' | 'longer' | 'continue' | 'zap';

// 定义请求体类型
interface GenerateRequestBody {
  option: GenerateOption;
  command?: string;
  text?: string;
}

// 定义Ollama响应类型
interface OllamaResponse {
  response?: string;
  done?: boolean;
}

// 提示词模板
const PROMPT_TEMPLATES: Record<GenerateOption, (text: string, command?: string) => string> = {
  improve: (text) => `请改进以下文本的表达和流畅性，保持原意不变：\n\n${text}`,
  fix: (text) => `请修正以下文本的语法和拼写错误：\n\n${text}`,
  shorter: (text) => `请将以下文本简化，保留核心信息：\n\n${text}`,
  longer: (text) => `请扩展以下文本，添加更多细节和信息：\n\n${text}`,
  continue: (text) => `请继续写下去：\n\n${text}`,
  zap: (text, command) => `${command}\n\n原文：${text}`,
};

// Ollama配置
const OLLAMA_CONFIG = {
  url: 'http://localhost:11434/api/generate',
  model: 'qwen2.5:0.5b',
} as const;

// 转义特殊字符
function escapeJsonString(str: string): string {
  return str
    .replace(/\\/g, '\\\\')
    .replace(/"/g, '\\"')
    .replace(/\n/g, '\\n')
    .replace(/\r/g, '\\r')
    .replace(/\t/g, '\\t');
}

// 生成提示词
function generatePrompt(option: GenerateOption, text: string, command?: string): string {
  const template = PROMPT_TEMPLATES[option];
  return template ? template(text, command) : `请处理以下文本：\n\n${text}`;
}

// 调用Ollama API
async function callOllamaAPI(prompt: string): Promise<Response> {
  const response = await fetch(OLLAMA_CONFIG.url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: OLLAMA_CONFIG.model,
      prompt,
      stream: true,
    }),
  });

  if (!response.ok) {
    throw new Error(`Ollama API error: ${response.status}`);
  }

  return response;
}

// 创建流式响应
function createStreamResponse(ollamaResponse: Response, prompt: string): Response {
  const encoder = new TextEncoder();
  
  const stream = new ReadableStream({
    async start(controller) {
      const reader = ollamaResponse.body?.getReader();
      if (!reader) {
        controller.error(new Error('无法获取响应流'));
        return;
      }

      let totalTokens = 0;

      try {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          const chunk = new TextDecoder().decode(value);
          const lines = chunk.split('\n').filter(line => line.trim());
          
          for (const line of lines) {
            try {
              const data: OllamaResponse = JSON.parse(line);
              
              if (data.response) {
                const escapedResponse = escapeJsonString(data.response);
                const formattedChunk = `0:"${escapedResponse}"\n`;
                controller.enqueue(encoder.encode(formattedChunk));
                totalTokens += data.response.length;
              }
              
              if (data.done) {
                const finishMessage = `d:{"finishReason":"stop","usage":{"promptTokens":${prompt.length},"completionTokens":${totalTokens}}}\n`;
                controller.enqueue(encoder.encode(finishMessage));
                controller.close();
                return;
              }
            } catch (parseError) {
              console.warn('JSON解析错误:', parseError, '行内容:', line);
            }
          }
        }
      } catch (streamError) {
        console.error('流处理错误:', streamError);
        controller.error(streamError);
      } finally {
        reader.releaseLock();
      }
    }
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
      'x-vercel-ai-data-stream': 'v1',
    },
  });
}

export async function POST(request: NextRequest) {
  try {
    const body: GenerateRequestBody = await request.json();
    const { option, command, text = '' } = body;

    // 验证必要参数
    if (!option || !text.trim()) {
      return NextResponse.json(
        { error: '缺少必要参数：option 和 text' },
        { status: 400 }
      );
    }

    // 生成提示词
    const prompt = generatePrompt(option, text, command);

    // 调用Ollama API
    const ollamaResponse = await callOllamaAPI(prompt);

    // 返回流式响应
    return createStreamResponse(ollamaResponse, prompt);

  } catch (error) {
    console.error('AI API错误:', error);
    
    // 根据错误类型返回不同的错误信息
    const errorMessage = error instanceof Error 
      ? error.message.includes('fetch') 
        ? 'AI服务暂时不可用，请确保Ollama服务正在运行'
        : error.message
      : 'AI服务发生未知错误';

    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}