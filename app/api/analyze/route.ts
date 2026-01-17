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
1. 返回格式必须是：{"words": [{"english": "英文单词", "chinese": "中文翻译"}]}
2. 只返回图片中清晰可见的主要物体
3. 最多返回5个单词
4. 只返回纯JSON，不要任何其他文字、解释或代码块标记
5. 确保JSON格式正确，数组元素之间用逗号分隔`;

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
      return NextResponse.json({ error: `API错误: ${response.status}` }, { status: 500 });
    }

    const data = await response.json();
    const text = data.choices?.[0]?.message?.content || "";

    // 解析并修复 JSON
    const words = parseAndFixJSON(text);
    
    if (!words) {
      return NextResponse.json({ error: `无法解析AI响应: ${text.substring(0, 150)}` }, { status: 500 });
    }

    if (!words.words || !Array.isArray(words.words)) {
      return NextResponse.json({ error: "AI返回格式不正确" }, { status: 500 });
    }

    return NextResponse.json({ words: words.words.slice(0, 5) });

  } catch (error: any) {
    return NextResponse.json({ error: `发生错误: ${error.message}` }, { status: 500 });
  }
}

// 解析并修复 JSON 的函数
function parseAndFixJSON(text: string): any {
  if (!text) return null;

  // 第一步：清理文本
  let cleaned = text.trim();
  
  // 移除 Markdown 代码块
  cleaned = cleaned.replace(/```[a-z]*\n?/gi, "").replace(/\n?```/g, "").trim();
  
  // 移除开头的 "json" 单词
  cleaned = cleaned.replace(/^json\s*/i, "").trim();

  // 第二步：尝试直接解析
  try {
    const jsonMatch = cleaned.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }
  } catch (e) {
    // 继续尝试修复
  }

  // 第三步：尝试修复常见问题
  try {
    let fixed = cleaned;
    
    // 提取 JSON 对象
    const jsonMatch = fixed.match(/\{[\s\S]*\}/);
    if (!jsonMatch) return null;
    fixed = jsonMatch[0];

    // 修复：对象之间缺少逗号 }{ → },{
    fixed = fixed.replace(/\}\s*\{/g, "},{");
    
    // 修复：数组元素之间缺少逗号 "] [" → "],["
    fixed = fixed.replace(/\]\s*\[/g, "],[");
    
    // 修复：属性之间缺少逗号 "" " → "","
    fixed = fixed.replace(/"\s+"/g, '","');
    
    // 修复：值和键之间缺少逗号 "value" "key" → "value","key"
    fixed = fixed.replace(/(":\s*"[^"]*")\s+(")/g, '$1,$2');
    
    // 修复：对象结尾和下一个对象开头缺少逗号
    fixed = fixed.replace(/("\s*)\}\s*\{/g, '$1},{');

    return JSON.parse(fixed);
  } catch (e) {
    // 继续尝试
  }

  // 第四步：手动提取单词
  try {
    const wordMatches = text.matchAll(/"english"\s*:\s*"([^"]+)"\s*,\s*"chinese"\s*:\s*"([^"]+)"/g);
    const words = [];
    for (const match of wordMatches) {
      words.push({ english: match[1], chinese: match[2] });
    }
    if (words.length > 0) {
      return { words };
    }
  } catch (e) {
    // 放弃
  }

  return null;
}