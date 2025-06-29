import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { option, command, text = '' } = body;

    // 模拟响应用于测试
    const mockResponse = "你好，这是一个测试响应。";
    
    // 创建正确的Vercel AI SDK流式响应
    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      async start(controller) {
        try {
          // 模拟逐字符流式输出
          for (let i = 0; i < mockResponse.length; i++) {
            const char = mockResponse[i];
            
            // 正确转义特殊字符
            const escapedChar = char
              .replace(/\\/g, '\\\\')
              .replace(/"/g, '\\"')
              .replace(/\n/g, '\\n')
              .replace(/\r/g, '\\r')
              .replace(/\t/g, '\\t');
            
            // 使用正确的Vercel AI SDK流格式
            const formattedChunk = `0:"${escapedChar}"\n`;
            controller.enqueue(encoder.encode(formattedChunk));
            
            // 添加小延迟以模拟真实流
            await new Promise(resolve => setTimeout(resolve, 50));
          }
          
          // 发送流结束标记
          controller.enqueue(encoder.encode('d:\n'));
          controller.close();
        } catch (error) {
          console.error('Stream error:', error);
          controller.error(error);
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
    console.error('Test API Error:', error);
    return NextResponse.json(
      { error: '测试API出错' },
      { status: 500 }
    );
  }
} 