"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { FlashCardData } from "@/components/FlashCard";
import { getFlashCards, deleteFlashCard } from "@/utils/storage";
import FlashCardViewer from "@/components/FlashCardViewer";
import BottomNav from "@/components/BottomNav";

export default function WordBookPage() {
  const [cards, setCards] = useState<FlashCardData[]>([]);
  const [selectedCard, setSelectedCard] = useState<FlashCardData | null>(null);

  // 加载单词本
  useEffect(() => {
    loadCards();
  }, []);

  const loadCards = () => {
    const savedCards = getFlashCards();
    // 按保存时间倒序排列（最新的在前）
    savedCards.sort((a, b) => {
      return new Date(b.savedAt).getTime() - new Date(a.savedAt).getTime();
    });
    setCards(savedCards);
  };

  // 打开闪卡查看器
  const handleCardClick = (card: FlashCardData) => {
    setSelectedCard(card);
  };

  // 关闭闪卡查看器
  const handleCloseViewer = () => {
    setSelectedCard(null);
  };

  // 删除闪卡
  const handleDelete = () => {
    if (selectedCard) {
      try {
        // 获取所有卡片，找到要删除的卡片索引
        const allCards = getFlashCards();
        const indexToDelete = allCards.findIndex(
          (c) =>
            c.word === selectedCard.word &&
            c.translation === selectedCard.translation &&
            c.savedAt === selectedCard.savedAt &&
            c.image === selectedCard.image
        );

        if (indexToDelete !== -1) {
          deleteFlashCard(indexToDelete);
          loadCards(); // 重新加载列表
          setSelectedCard(null);
        } else {
          alert("未找到要删除的卡片");
        }
      } catch (error) {
        console.error("删除失败:", error);
        alert("删除失败，请重试");
      }
    }
  };

  // 统计今日新增
  const getTodayCount = () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return cards.filter((card) => {
      const cardDate = new Date(card.savedAt);
      cardDate.setHours(0, 0, 0, 0);
      return cardDate.getTime() === today.getTime();
    }).length;
  };

  // 格式化日期（用于显示）
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
      month: "short",
      day: "numeric",
    });
  };


  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 pb-20">
      <div className="max-w-2xl mx-auto px-4 py-8">
        {/* 页面标题和统计 */}
        <div className="mb-6">
          <h1 className="text-4xl font-bold text-center mb-4 text-gray-800 dark:text-white">
            单词本
          </h1>
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                  {cards.length}
                </p>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  已收集单词
                </p>
              </div>
              {getTodayCount() > 0 && (
                <div className="text-right">
                  <p className="text-xl font-bold text-green-600 dark:text-green-400">
                    +{getTodayCount()}
                  </p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    今日新增
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* 单词卡片列表 */}
        {cards.length === 0 ? (
          // 空状态
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-12 text-center">
            <div className="mb-6">
              <svg
                className="w-24 h-24 mx-auto text-gray-400 dark:text-gray-500"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
                />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-4">
              还没有收集单词
            </h2>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              去拍照识别单词，生成闪卡并保存吧
            </p>
            <Link
              href="/"
              className="inline-block bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white font-semibold py-3 px-8 rounded-xl shadow-lg transform transition-all duration-200 hover:scale-105"
            >
              📷 去拍照
            </Link>
          </div>
        ) : (
          // 卡片网格
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {cards.map((card, index) => (
              <div
                key={`${card.word}-${card.savedAt}-${index}`}
                onClick={() => handleCardClick(card)}
                className="bg-white dark:bg-gray-800 rounded-xl shadow-md overflow-hidden cursor-pointer transform transition-all duration-200 hover:scale-105 hover:shadow-lg"
              >
                {/* 缩略图 */}
                <div className="relative w-full aspect-square">
                  {card.image && (
                    <Image
                      src={card.image}
                      alt={card.word}
                      fill
                      className="object-cover"
                    />
                  )}
                </div>
                {/* 单词和日期 */}
                <div className="p-3">
                  <h3 className="text-lg font-bold text-blue-600 dark:text-blue-400 mb-1 truncate">
                    {card.word}
                  </h3>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {formatDate(card.savedAt)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 底部导航 */}
      <BottomNav />

      {/* 闪卡查看器 */}
      {selectedCard && (
        <FlashCardViewer
          cardData={selectedCard}
          onClose={handleCloseViewer}
          onDelete={handleDelete}
          showDelete={true}
        />
      )}
    </div>
  );
}

