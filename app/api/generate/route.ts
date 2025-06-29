import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { option, command } = body;

    // 构建发送给Ollama的提示词
    let prompt = '';
    const text = body.text || '';
    
    switch (option) {
      case 'improve':
        prompt = `请改进以下文本的表达和流畅性，保持原意不变：\n\n${text}`;
        break;
      case 'fix':
        prompt = `请修正以下文本的语法和拼写错误：\n\n${text}`;
        break;
      case 'shorter':
        prompt = `请将以下文本简化，保留核心信息：\n\n${text}`;
        break;
      case 'longer':
        prompt = `请扩展以下文本，添加更多细节和信息：\n\n${text}`;
        break;
      case 'continue':
        prompt = `请继续写下去：\n\n${text}`;
        break;
      case 'zap':
        prompt = `${command}\n\n原文：${text}`;
        break;
      default:
        prompt = `请处理以下文本：\n\n${text}`;
    }

    // 调用Ollama API
    const ollamaResponse = await fetch('http://localhost:11434/api/generate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'qwen2.5:0.5b', // 使用你安装的模型
        prompt: prompt,
        stream: true,
      }),
    });

    if (!ollamaResponse.ok) {
      throw new Error(`Ollama API error: ${ollamaResponse.status}`);
    }

    // 创建流式响应
    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      async start(controller) {
        const reader = ollamaResponse.body?.getReader();
        if (!reader) return;

        try {
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            const chunk = new TextDecoder().decode(value);
            const lines = chunk.split('\n').filter(line => line.trim());
            
            for (const line of lines) {
              try {
                const data = JSON.parse(line);
                if (data.response) {
                  // 使用 Vercel AI SDK 期望的格式
                  const formattedChunk = `0:"${data.response.replace(/"/g, '\\"')}"\n`;
                  controller.enqueue(encoder.encode(formattedChunk));
                }
                
                if (data.done) {
                  controller.enqueue(encoder.encode('d:\n'));
                  controller.close();
                  return;
                }
              } catch (e) {
                // 忽略JSON解析错误
                console.warn('JSON parse error:', e);
              }
            }
          }
        } catch (error) {
          console.error('Stream error:', error);
          controller.error(error);
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
      },
    });

  } catch (error) {
    console.error('AI API Error:', error);
    return NextResponse.json(
      { error: 'AI服务暂时不可用，请确保Ollama服务正在运行' },
      { status: 500 }
    );
  }
} 