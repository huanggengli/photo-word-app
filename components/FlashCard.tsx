"use client";

import { useState } from "react";
import Image from "next/image";
import { speak } from "@/utils/speak";

interface FlashCardProps {
  word: { english: string; chinese: string };
  originalImage: string;
  onClose: () => void;
  onSave: (cardData: FlashCardData) => void;
}

export interface FlashCardData {
  image: string;
  word: string;
  translation: string;
  example: string;
  savedAt: string;
  reviewStage?: number;
  nextReviewDate?: string;
  reviewCount?: number;
  lastReviewDate?: string;
}

export default function FlashCard({ word, originalImage, onClose, onSave }: FlashCardProps) {
  const [isFlipped, setIsFlipped] = useState(false);
  const [imageSource, setImageSource] = useState<"original" | "ai" | null>(null);
  const [aiImage, setAiImage] = useState<string | null>(null);
  const [example, setExample] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleImageSourceSelect = async (source: "original" | "ai") => {
    setImageSource(source);
    setError(null);
    setLoading(true);
    
    try {
      const response = await fetch("/api/flashcard", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ word: word.english, chinese: word.chinese, generateImage: source === "ai" }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "生成失败");
      if (source === "ai" && data.image) setAiImage(data.image);
      if (data.example) setExample(data.example);
    } catch (err) {
      setError(err instanceof Error ? err.message : "生成失败");
      setImageSource(null);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = () => {
    const selectedImage = imageSource === "original" ? originalImage : aiImage;
    if (!selectedImage || !example) {
      setError("请先选择图片并生成例句");
      return;
    }
    onSave({
      image: selectedImage,
      word: word.english,
      translation: word.chinese,
      example: example,
      savedAt: new Date().toISOString(),
    });
    onClose();
  };

  if (imageSource === null) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl p-6 max-w-md w-full">
          <h3 className="text-2xl font-bold text-center mb-6">选择图片</h3>
          <div className="space-y-4">
            <button onClick={() => handleImageSourceSelect("original")} disabled={loading} className="w-full bg-blue-500 hover:bg-blue-600 text-white font-semibold py-4 px-6 rounded-xl disabled:opacity-50">
              📷 使用原图
            </button>
            <button onClick={() => handleImageSourceSelect("ai")} disabled={loading} className="w-full bg-purple-500 hover:bg-purple-600 text-white font-semibold py-4 px-6 rounded-xl disabled:opacity-50">
              🎨 生成AI图片
            </button>
          </div>
          {error && <p className="mt-4 text-red-500 text-center">{error}</p>}
          <button onClick={onClose} className="mt-4 w-full bg-gray-200 hover:bg-gray-300 py-3 px-6 rounded-lg">取消</button>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl p-6 max-w-md w-full text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-500 border-t-transparent mx-auto mb-4"></div>
          <p>正在生成...</p>
        </div>
      </div>
    );
  }

  const displayImage = imageSource === "original" ? originalImage : aiImage;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="max-w-md w-full">
        <div className="relative w-full aspect-[3/4] cursor-pointer" style={{ perspective: "1000px" }} onClick={() => setIsFlipped(!isFlipped)}>
          <div className={`relative w-full h-full transition-transform duration-700 ${isFlipped ? "rotate-y-180" : ""}`} style={{ transformStyle: "preserve-3d" }}>
            
            {/* 正面 - 图片 */}
            <div className="absolute inset-0 rounded-2xl overflow-hidden shadow-2xl bg-white" style={{ backfaceVisibility: "hidden" }}>
              {displayImage && <Image src={displayImage} alt={word.english} fill className="object-cover" />}
              {/* 底部操作栏 */}
              <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-4">
                <div className="flex items-center justify-between">
                  <button 
                    onClick={(e) => { e.stopPropagation(); onClose(); }} 
                    className="bg-white/20 hover:bg-white/30 text-white font-bold py-2 px-4 rounded-lg backdrop-blur-sm"
                  >
                    ✕ 关闭
                  </button>
                  <p className="text-white text-sm">点击翻转</p>
                  <button 
                    onClick={(e) => { e.stopPropagation(); handleSave(); }} 
                    disabled={!example || (imageSource === "ai" && !aiImage)}
                    className="bg-green-500 hover:bg-green-600 text-white font-bold py-2 px-4 rounded-lg disabled:opacity-50"
                  >
                    ❤️ 保存
                  </button>
                </div>
              </div>
            </div>

            {/* 背面 - 单词信息 */}
            <div className="absolute inset-0 rounded-2xl overflow-hidden shadow-2xl bg-blue-50 dark:bg-gray-700 flex flex-col" style={{ backfaceVisibility: "hidden", transform: "rotateY(180deg)" }}>
              {/* 内容区域 */}
              <div className="flex-1 p-6 flex flex-col justify-center items-center">
                <div className="flex items-center gap-2 mb-4">
                  <h2 className="text-4xl font-bold text-blue-600">{word.english}</h2>
                  <button onClick={(e) => { e.stopPropagation(); speak(word.english); }} className="bg-green-500 text-white py-2 px-3 rounded-full">🔊</button>
                </div>
                <p className="text-2xl text-gray-700 dark:text-gray-300 mb-4">{word.chinese}</p>
                {example && (
                  <div className="bg-white/60 dark:bg-gray-800/60 rounded-lg p-4 w-full">
                    <div className="flex items-start gap-2">
                      <p className="text-lg italic flex-1">{example}</p>
                      <button onClick={(e) => { e.stopPropagation(); speak(example); }} className="bg-blue-500 text-white py-2 px-3 rounded-full">🔊</button>
                    </div>
                  </div>
                )}
              </div>
              
              {/* 底部操作栏 */}
              <div className="bg-gradient-to-t from-blue-100 dark:from-gray-800 to-transparent p-4">
                <div className="flex items-center justify-between">
                  <button 
                    onClick={(e) => { e.stopPropagation(); onClose(); }} 
                    className="bg-gray-200 hover:bg-gray-300 dark:bg-gray-600 dark:hover:bg-gray-500 font-bold py-2 px-4 rounded-lg"
                  >
                    ✕ 关闭
                  </button>
                  <p className="text-sm text-gray-500">点击翻转</p>
                  <button 
                    onClick={(e) => { e.stopPropagation(); handleSave(); }} 
                    disabled={!example || (imageSource === "ai" && !aiImage)}
                    className="bg-green-500 hover:bg-green-600 text-white font-bold py-2 px-4 rounded-lg disabled:opacity-50"
                  >
                    ❤️ 保存
                  </button>
                </div>
              </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}