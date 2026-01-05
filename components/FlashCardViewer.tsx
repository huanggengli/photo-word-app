"use client";

import { useState } from "react";
import { speak } from "@/utils/speak";
import Image from "next/image";
import { FlashCardData } from "./FlashCard";

interface FlashCardViewerProps {
  cardData: FlashCardData;
  onClose: () => void;
  onDelete?: () => void;
  showDelete?: boolean;
}

export default function FlashCardViewer({
  cardData,
  onClose,
  onDelete,
  showDelete = false,
}: FlashCardViewerProps) {
  const [isFlipped, setIsFlipped] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  // 发音功能 - 朗读单词
  const speakWord = () => {
    speak(cardData.word);
  };

  // 发音功能 - 朗读例句
  const speakExample = () => {
    if (cardData.example) {
      speak(cardData.example);
    }
  };

  const handleDeleteClick = () => {
    setShowDeleteConfirm(true);
  };

  const handleConfirmDelete = () => {
    if (onDelete) {
      onDelete();
      onClose();
    }
  };

  // 格式化日期
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const cardDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());

    if (cardDate.getTime() === today.getTime()) {
      return "今天";
    }

    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    if (cardDate.getTime() === yesterday.getTime()) {
      return "昨天";
    }

    return date.toLocaleDateString("zh-CN", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="max-w-md w-full">
        {/* 删除确认提示 */}
        {showDeleteConfirm && (
          <div className="absolute inset-0 bg-black bg-opacity-70 flex items-center justify-center z-10 rounded-2xl">
            <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 max-w-xs w-full mx-4">
              <h3 className="text-xl font-bold text-gray-800 dark:text-white mb-4 text-center">
                确认删除？
              </h3>
              <p className="text-gray-600 dark:text-gray-400 mb-6 text-center">
                删除后无法恢复
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => setShowDeleteConfirm(false)}
                  className="flex-1 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-800 dark:text-white font-semibold py-3 px-6 rounded-lg transition-colors"
                >
                  取消
                </button>
                <button
                  onClick={handleConfirmDelete}
                  className="flex-1 bg-red-500 hover:bg-red-600 text-white font-semibold py-3 px-6 rounded-lg transition-colors"
                >
                  删除
                </button>
              </div>
            </div>
          </div>
        )}

        {/* 闪卡容器 */}
        <div
          className="relative w-full aspect-[3/4] cursor-pointer"
          style={{ perspective: "1000px" }}
          onClick={() => setIsFlipped(!isFlipped)}
        >
          <div
            className={`relative w-full h-full transition-transform duration-700 ${
              isFlipped ? "rotate-y-180" : ""
            }`}
            style={{
              transformStyle: "preserve-3d",
            }}
          >
            {/* 卡片正面 - 图片 */}
            <div
              className="absolute inset-0 rounded-2xl overflow-hidden shadow-2xl bg-white"
              style={{
                backfaceVisibility: "hidden",
                WebkitBackfaceVisibility: "hidden",
                transform: "rotateY(0deg)",
              }}
            >
              <div className="relative w-full h-full">
                {cardData.image && (
                  <Image
                    src={cardData.image}
                    alt={cardData.word}
                    fill
                    className="object-cover"
                  />
                )}
                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-4">
                  <p className="text-white text-sm text-center">点击卡片翻转</p>
                </div>
              </div>
            </div>

            {/* 卡片背面 - 单词信息 */}
            <div
              className="absolute inset-0 rounded-2xl overflow-hidden shadow-2xl bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-800 dark:to-gray-700"
              style={{
                backfaceVisibility: "hidden",
                WebkitBackfaceVisibility: "hidden",
                transform: "rotateY(180deg)",
              }}
            >
              <div className="h-full flex flex-col justify-between p-6 md:p-8">
                <div className="flex-1 flex flex-col justify-center items-center text-center space-y-4">
                  {/* 英文单词 */}
                  <div className="flex items-center gap-3">
                    <h2 className="text-5xl md:text-6xl font-bold text-blue-600 dark:text-blue-400">
                      {cardData.word}
                    </h2>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        speakWord();
                      }}
                      className="bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white font-semibold py-2 px-4 rounded-full shadow-md transform transition-all duration-200 hover:scale-110 active:scale-95 flex items-center justify-center"
                      title="朗读单词"
                    >
                      🔊
                    </button>
                  </div>

                  {/* 中文翻译 */}
                  <p className="text-2xl md:text-3xl text-gray-700 dark:text-gray-300">
                    {cardData.translation}
                  </p>

                  {/* 例句 */}
                  {cardData.example && (
                    <div className="mt-6 p-4 bg-white/60 dark:bg-gray-900/60 rounded-lg w-full">
                      <div className="flex items-start gap-3">
                        <p className="text-lg text-gray-800 dark:text-gray-200 italic flex-1">
                          {cardData.example}
                        </p>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            speakExample();
                          }}
                          className="bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white font-semibold py-2 px-4 rounded-full shadow-md transform transition-all duration-200 hover:scale-110 active:scale-95 flex items-center justify-center flex-shrink-0"
                          title="朗读例句"
                        >
                          🔊
                        </button>
                      </div>
                    </div>
                  )}

                  {/* 保存日期 */}
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
                    {formatDate(cardData.savedAt)}
                  </p>
                </div>

                <p className="text-center text-sm text-gray-500 dark:text-gray-400">
                  点击卡片翻转
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* 操作按钮 */}
        <div className="mt-6 flex gap-4">
          <button
            onClick={onClose}
            className="flex-1 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-800 dark:text-white font-semibold py-3 px-6 rounded-lg transition-colors"
          >
            关闭
          </button>
          {showDelete && onDelete && (
            <button
              onClick={handleDeleteClick}
              className="flex-1 bg-red-500 hover:bg-red-600 text-white font-semibold py-3 px-6 rounded-lg transition-colors"
            >
              🗑️ 删除
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

