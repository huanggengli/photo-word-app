import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    // 首先检查环境变量是否加载
    console.log("环境变量检查:");
    console.log("SILICONFLOW_API_KEY 存在:", !!process.env.SILICONFLOW_API_KEY);
    
    const formData = await request.formData();
    const file = formData.get("image") as File;

    if (!file) {
      return NextResponse.json(
        { error: "未提供图片文件" },
        { status: 400 }
      );
    }

    // 获取 API Key 和配置
    const apiKey = process.env.SILICONFLOW_API_KEY;
    const apiUrl = process.env.SILICONFLOW_API_URL || "https://api.siliconflow.cn/v1/chat/completions";
    const modelName = process.env.SILICONFLOW_MODEL || "Qwen/Qwen2-VL-72B-Instruct";

    if (!apiKey) {
      console.error("SILICONFLOW_API_KEY 未配置");
      return NextResponse.json(
        { error: "未配置硅基流动 API Key，请检查 .env.local 文件" },
        { status: 500 }
      );
    }

    console.log("API Key 已加载，长度:", apiKey.length);
    console.log("API URL:", apiUrl);
    console.log("模型名称:", modelName);

    // 将文件转换为 base64
    const arrayBuffer = await file.arrayBuffer();
    const base64Image = Buffer.from(arrayBuffer).toString("base64");
    const mimeType = file.type || "image/jpeg";

    // 构建提示词
    const prompt = `请分析这张图片，识别出图片中的主要物体（最多5个），并以JSON格式返回结果。
要求：
1. 返回格式：{"words": [{"english": "英文单词", "chinese": "中文翻译"}, ...]}
2. 只返回图片中清晰可见的主要物体
3. 最多返回5个单词
4. 每个单词提供准确的英文单词和对应的中文翻译
5. 只返回JSON，不要其他文字说明`;

    // 构建图片 URL（base64 格式）
    const imageUrl = `data:${mimeType};base64,${base64Image}`;

    // 调用硅基流动 API（OpenAI 兼容格式）
    let response;
    try {
      console.log("开始调用硅基流动 API，图片大小:", base64Image.length, "字节，MIME类型:", mimeType);
      
      response = await fetch(apiUrl, {
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
                {
                  type: "text",
                  text: prompt,
                },
                {
                  type: "image_url",
                  image_url: {
                    url: imageUrl,
                  },
                },
              ],
            },
          ],
          max_tokens: 1000,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: "未知错误" }));
        throw new Error(`API 调用失败: ${response.status} - ${JSON.stringify(errorData)}`);
      }

      console.log("硅基流动 API 调用成功");
    } catch (apiError: any) {
      console.error("硅基流动 API 调用失败:");
      console.error("错误类型:", apiError?.constructor?.name);
      console.error("错误消息:", apiError?.message);
      console.error("错误堆栈:", apiError?.stack);
      
      // 提供更详细的错误信息
      let errorMessage = "API 调用失败";
      
      if (apiError?.message?.includes("fetch failed") || apiError?.message?.includes("ECONNREFUSED")) {
        errorMessage = "网络连接失败。请检查网络连接或 API 地址是否正确";
      } else if (apiError?.message?.includes("401") || apiError?.message?.includes("unauthorized")) {
        errorMessage = "API Key 无效或已过期，请检查 .env.local 文件中的 SILICONFLOW_API_KEY 是否正确";
      } else if (apiError?.message?.includes("403") || apiError?.message?.includes("forbidden")) {
        errorMessage = "API Key 没有访问权限，请检查 API Key 是否有效";
      } else if (apiError?.message?.includes("429") || apiError?.message?.includes("quota")) {
        errorMessage = "API 调用次数超限，请稍后再试";
      } else {
        errorMessage = `API 调用失败: ${apiError?.message || "未知错误"}`;
      }
      
      return NextResponse.json(
        { error: errorMessage },
        { status: 500 }
      );
    }

    // 解析响应
    const data = await response.json();
    let text;
    
    try {
      // 硅基流动返回格式：{ choices: [{ message: { content: "..." } }] }
      if (data.choices && data.choices[0] && data.choices[0].message) {
        text = data.choices[0].message.content;
      } else if (data.content) {
        text = data.content;
      } else {
        throw new Error("无法从响应中提取内容");
      }
    } catch (textError: any) {
      console.error("获取响应文本失败:", textError);
      console.error("响应数据:", JSON.stringify(data, null, 2));
      return NextResponse.json(
        { error: "无法获取 AI 响应，请重试" },
        { status: 500 }
      );
    }

    // 解析 JSON 响应
    let words;
    try {
      // 尝试提取 JSON 部分（如果响应包含其他文本）
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        words = JSON.parse(jsonMatch[0]);
      } else {
        words = JSON.parse(text);
      }
    } catch (parseError) {
      // 如果解析失败，尝试手动提取
      console.error("解析响应失败:", text);
      console.error("解析错误详情:", parseError);
      
      // 尝试更宽松的 JSON 提取
      try {
        // 移除可能的 markdown 代码块标记
        const cleanedText = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
        const jsonMatch = cleanedText.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          words = JSON.parse(jsonMatch[0]);
        } else {
          throw new Error("无法找到 JSON 格式");
        }
      } catch (retryError) {
        return NextResponse.json(
          { error: `无法解析AI响应。响应内容: ${text.substring(0, 200)}` },
          { status: 500 }
        );
      }
    }

    // 确保返回格式正确
    if (!words.words || !Array.isArray(words.words)) {
      return NextResponse.json(
        { error: `AI返回格式不正确。返回内容: ${JSON.stringify(words)}` },
        { status: 500 }
      );
    }

    // 限制最多5个单词
    const limitedWords = words.words.slice(0, 5);

    return NextResponse.json({ words: limitedWords });
  } catch (error: any) {
    console.error("分析图片时出错:", error);
    console.error("错误堆栈:", error.stack);
    return NextResponse.json(
      { error: `分析图片时发生错误: ${error.message || "未知错误，请检查服务器日志"}` },
      { status: 500 }
    );
  }
}

