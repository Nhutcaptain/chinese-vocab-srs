import { NextRequest, NextResponse } from 'next/server';

/**
 * API Proxy to fetch audio from TTS providers.
 * v3: Optimized for Chinese with Baidu Dict & Google VN.
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const text = searchParams.get('text');

  if (!text) {
    return NextResponse.json({ error: 'Text is required' }, { status: 400 });
  }

  const encoded = encodeURIComponent(text);

  // List of high-reliability sources specifically for Chinese text
  const sources = [
    {
      name: 'Baidu Dict',
      // 'tex' instead of 'text' is often more reliable on some Baidu endpoints
      url: `https://tts.baidu.com/text2audio?per=0&spd=5&lan=zh&cuid=dict&pdt=1&vol=9&tex=${encoded}`,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Referer': 'https://fanyi.baidu.com/',
      }
    },
    {
      name: 'Google VN',
      // Using .com.vn can bypass some regional redirects/blocks
      url: `https://translate.google.com.vn/translate_tts?ie=UTF-8&q=${encoded}&tl=zh-CN&total=1&idx=0&textlen=${text.length}&client=tw-ob`,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Referer': 'https://translate.google.com.vn/',
      }
    },
    {
      name: 'Google Global',
      url: `https://translate.google.com/translate_tts?ie=UTF-8&tl=zh-CN&client=tw-ob&q=${encoded}`,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Referer': 'https://translate.google.com/',
      }
    }
  ];

  for (const source of sources) {
    try {
      console.log(`TTS Proxy: Trying ${source.name}...`);
      const response = await fetch(source.url, { headers: source.headers });

      if (response.ok) {
        const audioBuffer = await response.arrayBuffer();
        
        /**
         * Valid short Chinese audio is typically > 5 KB.
         * Anything less than 2 KB is almost certainly an error page (1920 bytes seen previously).
         */
        if (audioBuffer.byteLength > 2500) { 
          console.log(`TTS Proxy: Success with ${source.name} (${audioBuffer.byteLength} bytes)`);
          return new NextResponse(audioBuffer, {
            headers: {
              'Content-Type': 'audio/mpeg',
              'Cache-Control': 'public, max-age=31536000, immutable',
              'Content-Length': audioBuffer.byteLength.toString(),
            },
          });
        } else {
          console.warn(`TTS Proxy: ${source.name} returned suspicious small payload (${audioBuffer.byteLength} bytes). Possible soft-block.`);
        }
      } else {
        console.warn(`TTS Proxy: ${source.name} returned status ${response.status}`);
      }
    } catch (error) {
      console.error(`TTS Proxy: Error fetching from ${source.name}:`, error);
    }
  }

  // Final fallback: Return a 404 so the client-side can try Web Speech API
  return NextResponse.json({ error: 'All TTS sources failed' }, { status: 404 });
}
