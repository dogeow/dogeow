import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { option, command } = body;

    // 这里应该集成实际的AI服务，比如 OpenAI API
    // 目前返回一个占位符响应
    let response = '';
    
    switch (option) {
      case 'improve':
        response = '这是改进后的文本版本。';
        break;
      case 'fix':
        response = '这是修正语法后的文本。';
        break;
      case 'shorter':
        response = '这是简化后的版本。';
        break;
      case 'longer':
        response = '这是扩展后的详细版本，包含更多信息和细节。';
        break;
      case 'continue':
        response = '继续写作的内容...';
        break;
      case 'zap':
        response = `根据您的要求："${command}"，这里是AI生成的响应。`;
        break;
      default:
        response = '这是AI生成的响应。';
    }

    // 创建符合 Vercel AI SDK 格式的流式响应
    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      start(controller) {
        const words = response.split('');
        let index = 0;
        
        const sendChunk = () => {
          if (index < words.length) {
            // 使用 Vercel AI SDK 期望的格式
            const chunk = `0:"${words[index]}"\n`;
            controller.enqueue(encoder.encode(chunk));
            index++;
            setTimeout(sendChunk, 50); // 50ms 延迟模拟打字效果
          } else {
            // 发送结束标记
            controller.enqueue(encoder.encode('d:\n'));
            controller.close();
          }
        };
        
        sendChunk();
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
      { error: 'AI服务暂时不可用' },
      { status: 500 }
    );
  }
} 