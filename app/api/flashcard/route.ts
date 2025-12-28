import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const { word, chinese, imageOnly } = await request.json();

    if (!word || !chinese) {
      return NextResponse.json(
        { error: "缺少单词或翻译" },
        { status: 400 }
      );
    }

    // 获取 API Key 和配置
    const apiKey = process.env.SILICONFLOW_API_KEY;
    const apiUrl = process.env.SILICONFLOW_API_URL || "https://api.siliconflow.cn/v1/chat/completions";
    const modelName = process.env.SILICONFLOW_MODEL || "Qwen/Qwen2-VL-72B-Instruct";

    if (!apiKey) {
      return NextResponse.json(
        { error: "未配置 API Key" },
        { status: 500 }
      );
    }

    // 构建提示词 - 生成图片和例句
    const prompt = `请为英文单词 "${word}"（中文：${chinese}）生成以下内容：

1. 一个简洁的英文例句（使用这个单词，句子要简单易懂）
2. 一个图片的英文描述（用于AI生成图片，描述应该清晰简洁，适合作为单词闪卡的配图，使用英文）

请以JSON格式返回：
{
  "example": "英文例句",
  "imageDescription": "英文图片描述（简洁明了，适合AI图片生成）"
}

只返回JSON，不要其他文字说明。`;

    // 调用硅基流动 API 生成例句和图片描述
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
            content: prompt,
          },
        ],
        temperature: 0.7,
        max_tokens: 500,
      }),
    });

    if (!response.ok) {
      const errorData = await response.text();
      console.error("API 调用失败:", errorData);
      return NextResponse.json(
        { error: "生成内容失败" },
        { status: response.status }
      );
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content || "";

    // 解析返回的JSON
    let flashCardData;
    try {
      // 尝试提取JSON部分
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        flashCardData = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error("无法解析JSON");
      }
    } catch (parseError) {
      console.error("解析JSON失败:", parseError);
      // 如果解析失败，使用默认值
      flashCardData = {
        example: `This is a ${word}.`,
        imageDescription: word,
      };
    }

    // 如果只需要生成例句（选择原图时），不生成图片
    if (imageOnly === false) {
      return NextResponse.json({
        example: flashCardData.example || `This is a ${word}.`,
      });
    }

    // 使用硅基流动图片生成API
    let imageUrl: string;
    try {
      imageUrl = await generateImage(flashCardData.imageDescription || word);
    } catch (imageError) {
      console.error("图片生成失败:", imageError);
      return NextResponse.json(
        { error: "图片生成失败，请稍后重试" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      example: flashCardData.example || `This is a ${word}.`,
      image: imageUrl,
    });
  } catch (error) {
    console.error("生成闪卡错误:", error);
    return NextResponse.json(
      { error: "生成闪卡时发生错误" },
      { status: 500 }
    );
  }
}

// 生成图片的函数 - 使用硅基流动图片生成API
async function generateImage(description: string): Promise<string> {
  try {
    const apiKey = process.env.SILICONFLOW_API_KEY;
    const imageApiUrl = "https://api.siliconflow.cn/v1/images/generations";
    const model = "black-forest-labs/FLUX.1-schnell";

    if (!apiKey) {
      throw new Error("未配置 API Key");
    }

    // 构建图片生成提示词 - 不限制风格，让AI自由生成
    const imagePrompt = `${description}, clean background, educational flashcard`;

    // 调用硅基流动图片生成API
    const response = await fetch(imageApiUrl, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: model,
        prompt: imagePrompt,
        image_size: "512x512",
      }),
    });

    if (!response.ok) {
      const errorData = await response.text();
      console.error("图片生成API调用失败:", errorData);
      throw new Error("图片生成失败");
    }

    const data = await response.json();
    
    // 硅基流动API返回格式：{ "data": [{ "url": "..." }] }
    if (data.data && data.data[0] && data.data[0].url) {
      return data.data[0].url;
    }
    
    // 如果返回格式不同，尝试其他可能的字段
    if (data.url) {
      return data.url;
    }
    
    if (data.images && data.images[0]) {
      return data.images[0];
    }

    throw new Error("无法从API响应中获取图片URL");
  } catch (error) {
    console.error("生成图片错误:", error);
    throw error; // 抛出错误，让上层处理
  }
}

