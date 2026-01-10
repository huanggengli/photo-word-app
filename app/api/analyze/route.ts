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

    const prompt = `请分析这张图片，识别出图片中的主要物体（最多5个），并以JSON格式返回结果。
要求：
1. 返回格式：{"words": [{"english": "英文单词", "chinese": "中文翻译"}, ...]}
2. 只返回图片中清晰可见的主要物体
3. 最多返回5个单词
4. 只返回JSON，不要其他文字`;

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
        max_tokens: 1000,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      return NextResponse.json({ error: `API错误: ${response.status}` }, { status: 500 });
    }

    const data = await response.json();
    const text = data.choices?.[0]?.message?.content || "";

    let words;
    try {
      let cleanedText = text.trim();
      cleanedText = cleanedText.replace(/```[a-z]*\n?/gi, "").replace(/\n?```/g, "").trim();
      cleanedText = cleanedText.replace(/^json\s*/i, "").trim();
      
      const jsonMatch = cleanedText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        words = JSON.parse(jsonMatch[0]);
      } else {
        words = JSON.parse(cleanedText);
      }
    } catch (parseError) {
      const fallbackMatch = text.match(/\{[\s\S]*\}/);
      if (fallbackMatch) {
        words = JSON.parse(fallbackMatch[0]);
      } else {
        return NextResponse.json({ error: `无法解析AI响应: ${text.substring(0, 100)}` }, { status: 500 });
      }
    }

    if (!words.words || !Array.isArray(words.words)) {
      return NextResponse.json({ error: "AI返回格式不正确" }, { status: 500 });
    }

    return NextResponse.json({ words: words.words.slice(0, 5) });

  } catch (error: any) {
    return NextResponse.json({ error: `发生错误: ${error.message}` }, { status: 500 });
  }
}


