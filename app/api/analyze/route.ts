import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get("image") as File;

    if (!file) {
      return NextResponse.json({ error: "未提供图片文件" }, { status: 400 });
    }

    const apiKey = process.env.SILICONFLOW_API_KEY;
    const apiUrl = process.env.SILICONFLOW_API_URL || "https://api.siliconflow.cn/v1/chat/completions";
    const modelName = process.env.SILICONFLOW_MODEL || "Qwen/Qwen2-VL-72B-Instruct";

    if (!apiKey) {
      return NextResponse.json({ error: "未配置 API Key" }, { status: 500 });
    }

    const arrayBuffer = await file.arrayBuffer();
    const base64Image = Buffer.from(arrayBuffer).toString("base64");
    const mimeType = file.type || "image/jpeg";
    const imageUrl = `data:${mimeType};base64,${base64Image}`;

    const prompt = `分析这张图片，识别图片中的物体，返回JSON格式。

要求：
1. 返回1到5个物体（图片中有几个就返回几个，可以只返回1个）
2. 格式必须是：{"words":[{"english":"单词","chinese":"翻译"}]}
3. 只返回JSON，不要其他任何文字
4. 不要用代码块包裹

示例：
{"words":[{"english":"apple","chinese":"苹果"}]}`;

    const response = await fetch(apiUrl, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: modelName,
        messages: [
          {
            role: "user",
            content: [
              { type: "text", text: prompt },
              { type: "image_url", image_url: { url: imageUrl } },
            ],
          },
        ],
        max_tokens: 500,
      }),
    });

    if (!response.ok) {
      return NextResponse.json({ error: `API错误: ${response.status}` }, { status: 500 });
    }

    const data = await response.json();
    const text = data.choices?.[0]?.message?.content || "";

    const words = parseJSON(text);
    
    if (!words) {
      return NextResponse.json({ error: `无法解析: ${text.substring(0, 100)}` }, { status: 500 });
    }

    return NextResponse.json({ words: words.slice(0, 5) });

  } catch (error: any) {
    return NextResponse.json({ error: `错误: ${error.message}` }, { status: 500 });
  }
}

function parseJSON(text: string): any[] | null {
  if (!text) return null;

  // 清理文本
  let s = text.trim();
  s = s.replace(/```json\s*/gi, "");
  s = s.replace(/```\s*/g, "");
  s = s.replace(/^json\s*/i, "");
  s = s.trim();

  // 尝试解析
  try {
    const match = s.match(/\{[\s\S]*\}/);
    if (match) {
      const obj = JSON.parse(match[0]);
      if (obj.words && Array.isArray(obj.words)) {
        return obj.words;
      }
    }
  } catch (e) {}

  // 修复并重试
  try {
    let fixed = s;
    const match = fixed.match(/\{[\s\S]*\}/);
    if (match) {
      fixed = match[0];
      fixed = fixed.replace(/\}\s*\{/g, "},{");
      fixed = fixed.replace(/"\s+"/g, '","');
      const obj = JSON.parse(fixed);
      if (obj.words && Array.isArray(obj.words)) {
        return obj.words;
      }
    }
  } catch (e) {}

  // 手动提取
  try {
    const matches = [...text.matchAll(/"english"\s*:\s*"([^"]+)"\s*,\s*"chinese"\s*:\s*"([^"]+)"/g)];
    if (matches.length > 0) {
      return matches.map(m => ({ english: m[1], chinese: m[2] }));
    }
  } catch (e) {}

  return null;
}