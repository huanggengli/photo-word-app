"use client";

import { useState } from "react";
import Image from "next/image";
import { speak } from "@/utils/speak";

interface FlashCardProps {
  word: {
    english: string;
    chinese: string;
  };
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
    
    if (source === "ai" && !aiImage) {
      setLoading(true);
      try {
        const response = await fetch("/api/flashcard", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ word: word.english, chinese: word.chinese }),
        });
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || "生成闪卡失败");
        setAiImage(data.image);
        setExample(data.example);
      } catch (err) {
        console.error("生成闪卡错误:", err);
        setError(err instanceof Error ? err.message : "生成闪卡失败");
        setImageSource(null);
      } finally {
        setLoading(false);
      }
    } else if (source === "original" && !example) {
      setLoading(true);
      try {
        const response = await fetch("/api/flashcard", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ word: word.english, chinese: word.chinese, imageOnly: false }),
        });
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || "生成例句失败");
        setExample(data.example);
      } catch (err) {
        console.error("生成例句错误:", err);
        setError(err instanceof Error ? err.message : "生成例句失败");
        setImageSource(null);
      } finally {
        setLoading(false);
      }
    }
  };

  const speakWord = () => speak(word.english);
  const speakExample = () => { if (example) speak(example); };

  const handleSave = () => {
    const selectedImage = imageSource === "original" ? originalImage : aiImage;
    if (!selectedImage || !example) {
      setError("请先选择图片并生成例句");
      return;
    }
    const cardData: FlashCardData = {
      image: selectedImage,
      word: word.english,
      translation: word.chinese,
      example: example,
      savedAt: new Date().toISOString(),
    };
    onSave(cardData);
    onClose();
  };

  // 选择图片界面
  if (imageSource === null) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl p-6 md:p-8 max-w-md w-full">
          <h3 className="text-2xl font-bold text-gray-800 dark:text-white mb-6 text-center">选择图片</h3>
          <div className="space-y-4">
            <button
              onClick={() => handleImageSourceSelect("original")}
              disabled={loading}
              className="w-full bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white font-semibold py-4 px-6 rounded-xl shadow-lg transform transition-all duration-200 hover:scale-105 disabled:opacity-50"
            >
              📷 使用原图
            </button>
            <button
              onClick={() => handleImageSourceSelect("ai")}
              disabled={loading}
              className="w-full bg-gradient-to-r from-purple-500 to-pink-600 hover:from-purple-600 hover:to-pink-700 text-white font-semibold py-4 px-6 rounded-xl shadow-lg transform transition-all duration-200 hover:scale-105 disabled:opacity-50"
            >
              🎨 生成AI图片
            </button>
          </div>
          {error && (
            <div className="mt-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-3">
              <p className="text-red-600 dark:text-red-400 text-sm text-center">{error}</p>
            </div>
          )}
          <button
            onClick={onClose}
            className="mt-4 w-full bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-800 dark:text-white font-semibold py-3 px-6 rounded-lg"
          >
            取消
          </button>
        </div>
      </div>
    );
  }

  // 加载中界面
  if (loading) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl p-6 md:p-8 max-w-md w-full text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-blue-500 border-t-transparent mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">
            {imageSource === "ai" ? "正在生成AI图片和例句..." : "正在生成例句..."}
          </p>
        </div>
      </div>
    );
  }

  // AI图片生成失败界面
  if (imageSource === "ai" && !aiImage && !loading) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl p-6 md:p-8 max-w-md w-full">
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 mb-4">
            <p className="text-red-600 dark:text-red-400 text-center">{error || "生成失败"}</p>
          </div>
          <button onClick={onClose} className="w-full bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-800 dark:text-white font-semibold py-3 px-6 rounded-lg">
            关闭
          </button>
        </div>
      </div>
    );
  }

  const displayImage = imageSource === "original" ? originalImage : aiImage;

  // 主闪卡界面
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="max-w-md w-full">
        <div
          className="relative w-full aspect-[3/4] cursor-pointer"
          style={{ perspective: "1000px" }}
          onClick={() => setIsFlipped(!isFlipped)}
        >
          <div
            className={`relative w-full h-full transition-transform duration-700 ${isFlipped ? "rotate-y-180" : ""}`}
            style={{ transformStyle: "preserve-3d" }}
          >
            {/* 正面 */}
            <div
              className="absolute inset-0 rounded-2xl overflow-hidden shadow-2xl bg-white"
              style={{ backfaceVisibility: "hidden", transform: "rotateY(0deg)" }}
            >
              <div className="relative w-full h-full">
                {displayImage && <Image src={displayImage} alt={word.english} fill className="object-cover" />}
                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-4">
                  <p className="text-white text-sm text-center">点击卡片翻转</p>
                </div>
              </div>
            </div>

            {/* 背面 */}
            <div
              className="absolute inset-0 rounded-2xl overflow-hidden shadow-2xl bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-800 dark:to-gray-700"
              style={{ backfaceVisibility: "hidden", transform: "rotateY(180deg)" }}
            >
              <div className="h-full flex flex-col justify-between p-6">
                <div className="flex-1 flex flex-col justify-center items-center text-center space-y-4">
                  <div className="flex items-center gap-3">
                    <h2 className="text-4xl font-bold text-blue-600 dark:text-blue-400">{word.english}</h2>
                    <button
                      onClick={(e) => { e.stopPropagation(); speakWord(); }}
                      className="bg-green-500 hover:bg-green-600 text-white py-2 px-3 rounded-full"
                    >
                      🔊
                    </button>
                  </div>
                  <p className="text-2xl text-gray-700 dark:text-gray-300">{word.chinese}</p>
                  {example && (
                    <div className="mt-4 p-4 bg-white/60 dark:bg-gray-900/60 rounded-lg w-full">
                      <div className="flex items-start gap-3">
                        <p className="text-lg text-gray-800 dark:text-gray-200 italic flex-1">{example}</p>
                        <button
                          onClick={(e) => { e.stopPropagation(); speakExample(); }}
                          className="bg-blue-500 hover:bg-blue-600 text-white py-2 px-3 rounded-full"
                        >
                          🔊
                        </button>
                      </div>
                    </div>
                  )}
                </div>
                <p className="text-center text-sm text-gray-500">点击卡片翻转</p>
              </div>
            </div>
          </div>
        </div>

        {/* 操作按钮 */}
        <div className="mt-4 flex gap-3 w-full">
          <button
            onClick={(e) => { e.stopPropagation(); onClose(); }}
            className="flex-1 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-800 dark:text-white font-bold py-4 px-6 rounded-xl text-lg"
          >
            ✕ 关闭
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); handleSave(); }}
            disabled={!example || (imageSource === "ai" && !aiImage)}
            className="flex-1 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white font-bold py-4 px-6 rounded-xl shadow-lg disabled:opacity-50 text-lg"
          >
            ❤️ 保存
          </button>
        </div>
      </div>
    </div>
  );
}