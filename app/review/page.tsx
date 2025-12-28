"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { FlashCardData } from "@/components/FlashCard";
import { getFlashCards, updateFlashCard } from "@/utils/storage";
import {
  getCardsToReview,
  getMasteredCards,
  getLearningCards,
  getNextReviewDate,
  handleRemember,
  handleReviewAgain,
  getTodayISO,
} from "@/utils/review";
import BottomNav from "@/components/BottomNav";

export default function ReviewPage() {
  const [cards, setCards] = useState<FlashCardData[]>([]);
  const [currentCardIndex, setCurrentCardIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [showCelebration, setShowCelebration] = useState(false);
  const [queue, setQueue] = useState<FlashCardData[]>([]);

  useEffect(() => {
    loadCards();
  }, []);

  const loadCards = () => {
    const allCards = getFlashCards();
    setCards(allCards);
    // 重新计算待复习卡片后，重置索引
    const newCardsToReview = getCardsToReview(allCards);
    setQueue(newCardsToReview);
    if (newCardsToReview.length > 0 && currentCardIndex >= newCardsToReview.length) {
      setCurrentCardIndex(0);
    }
  };

  const cardsToReview = getCardsToReview(cards);
  const masteredCards = getMasteredCards(cards);
  const learningCards = getLearningCards(cards);
  const nextReviewDate = getNextReviewDate(cards);
  const currentCard = queue[currentCardIndex] || queue[0];

  // 发音功能 - 朗读单词
  const speakWord = (word: string) => {
    if ("speechSynthesis" in window) {
      speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(word);
      utterance.lang = "en-US";
      utterance.rate = 0.9;
      utterance.pitch = 1;
      speechSynthesis.speak(utterance);
    }
  };

  // 发音功能 - 朗读例句
  const speakExample = (example: string) => {
    if ("speechSynthesis" in window && example) {
      speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(example);
      utterance.lang = "en-US";
      utterance.rate = 0.85;
      utterance.pitch = 1;
      speechSynthesis.speak(utterance);
    }
  };

  // 处理"记住了"
  const handleRememberClick = () => {
    if (!currentCard) return;

    // 找到卡片在原始列表中的索引
    const allCards = getFlashCards();
    const cardIndex = allCards.findIndex(
      (c) =>
        c.word === currentCard.word &&
        c.savedAt === currentCard.savedAt &&
        c.image === currentCard.image
    );

    if (cardIndex === -1) return;

    // 更新卡片
    const updatedCard = handleRemember(currentCard);
    updateFlashCard(cardIndex, updatedCard);

    // 重新加载卡片
    loadCards();

    // 如果还有待复习的卡片，切换到下一张
    const newCardsToReview = getCardsToReview(getFlashCards());
    if (newCardsToReview.length > 0) {
      // 找到下一张卡片（可能是新的列表中的第一张）
      setCurrentCardIndex(0);
      setIsFlipped(false);
    } else {
      // 所有卡片都复习完了，显示庆祝动画
      setShowCelebration(true);
      setTimeout(() => {
        setShowCelebration(false);
      }, 3000);
    }
  };

  // 处理"再看看"
  const handleReviewAgainClick = () => {
    if (!currentCard) return;

    // 找到卡片在原始列表中的索引
    const allCards = getFlashCards();
    const cardIndex = allCards.findIndex(
      (c) =>
        c.word === currentCard.word &&
        c.savedAt === currentCard.savedAt &&
        c.image === currentCard.image
    );

    if (cardIndex === -1) return;

    // 更新卡片
    const updatedCard = handleReviewAgain(currentCard);
    updateFlashCard(cardIndex, updatedCard);

    // 重新加载卡片
    loadCards();

    // 切换到下一张卡片
    const newCardsToReview = getCardsToReview(getFlashCards());
    if (newCardsToReview.length > 0) {
      setCurrentCardIndex(0);
      setIsFlipped(false);
    } else {
      setShowCelebration(true);
      setTimeout(() => {
        setShowCelebration(false);
      }, 3000);
    }
  };

·  const handleForgotClick = () => {
    if (!currentCard) return;
    const newQueue = [...queue];
    const idx = currentCardIndex;
    if (idx >= 0 && idx < newQueue.length) {
      const [item] = newQueue.splice(idx, 1);
      newQueue.push(item);
    }
    setQueue(newQueue);
    setIsFlipped(false);
    setCurrentCardIndex((prev) => (prev >= newQueue.length - 1 ? 0 : prev));
  };

  // 格式化日期
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("zh-CN", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 pb-20">
      <div className="max-w-2xl mx-auto px-4 py-8">
        {/* 页面标题和统计 */}
        <div className="mb-6">
          <h1 className="text-4xl font-bold text-center mb-4 text-gray-800 dark:text-white">
            复习
          </h1>
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-6">
            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                  {queue.length}
                </p>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  今日待复习
                </p>
              </div>
              <div>
                <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                  {masteredCards.length}
                </p>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  已掌握
                </p>
              </div>
              <div>
                <p className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                  {learningCards.length}
                </p>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  学习中
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* 复习内容 */}
        {queue.length === 0 ? (
          // 没有待复习的卡片
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-12 text-center">
            {showCelebration ? (
              <div className="animate-bounce">
                <div className="text-6xl mb-4">🎉</div>
                <h2 className="text-3xl font-bold text-gray-800 dark:text-white mb-4">
                  今日复习完成！
                </h2>
                <p className="text-gray-600 dark:text-gray-400">
                  太棒了！继续保持这个节奏
                </p>
              </div>
            ) : (
              <>
                <div className="text-6xl mb-4">🎉</div>
                <h2 className="text-3xl font-bold text-gray-800 dark:text-white mb-4">
                  今日复习完成！
                </h2>
                {nextReviewDate && (
                  <p className="text-gray-600 dark:text-gray-400 mb-6">
                    下次复习：{formatDate(nextReviewDate)}
                  </p>
                )}
                <Link
                  href="/"
                  className="inline-block bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white font-semibold py-3 px-8 rounded-xl shadow-lg transform transition-all duration-200 hover:scale-105"
                >
                  📷 去学习新单词
                </Link>
              </>
            )}
          </div>
        ) : (
          // 显示当前复习卡片
          <div className="space-y-6">
            {/* 进度提示 */}
            <div className="text-center text-gray-600 dark:text-gray-400">
              {currentCardIndex + 1} / {queue.length}
            </div>

            {/* 闪卡 */}
            {currentCard && (
            <div
              className="relative w-full aspect-[3/4] cursor-pointer mx-auto max-w-md"
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
                    {currentCard.image && (
                      <Image
                        src={currentCard.image}
                        alt={currentCard.word}
                        fill
                        className="object-cover"
                      />
                    )}
                    <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-4">
                      <p className="text-white text-sm text-center">
                        点击卡片翻转
                      </p>
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
                          {currentCard.word}
                        </h2>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            speakWord(currentCard.word);
                          }}
                          className="bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white font-semibold py-2 px-4 rounded-full shadow-md transform transition-all duration-200 hover:scale-110 active:scale-95 flex items-center justify-center"
                          title="朗读单词"
                        >
                          🔊
                        </button>
                      </div>

                      {/* 中文翻译 */}
                      <p className="text-2xl md:text-3xl text-gray-700 dark:text-gray-300">
                        {currentCard.translation}
                      </p>

                      {/* 例句 */}
                      {currentCard.example && (
                        <div className="mt-6 p-4 bg-white/60 dark:bg-gray-900/60 rounded-lg w-full">
                          <div className="flex items-start gap-3">
                            <p className="text-lg text-gray-800 dark:text-gray-200 italic flex-1">
                              {currentCard.example}
                            </p>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                speakExample(currentCard.example);
                              }}
                              className="bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white font-semibold py-2 px-4 rounded-full shadow-md transform transition-all duration-200 hover:scale-110 active:scale-95 flex items-center justify-center flex-shrink-0"
                              title="朗读例句"
                            >
                              🔊
                            </button>
                          </div>
                        </div>
                      )}
                    </div>

                    <p className="text-center text-sm text-gray-500 dark:text-gray-400">
                      点击卡片翻转
                    </p>
                  </div>
                </div>
              </div>
            </div>
            )}

            {/* 操作按钮 */}
            {currentCard && (
            <div className="flex gap-4 max-w-md mx-auto">
              <button
                onClick={handleForgotClick}
                className="flex-1 bg-gradient-to-r from-gray-400 to-blue-500 hover:from-gray-500 hover:to-blue-600 text-white font-bold py-4 px-6 rounded-xl shadow-lg transform transition-all duration-200 hover:scale-105 active:scale-95 text-lg"
              >
                😵 忘了
              </button>
              <button
                onClick={handleReviewAgainClick}
                className="flex-1 bg-gradient-to-r from-orange-500 to-red-600 hover:from-orange-600 hover:to-red-700 text-white font-bold py-4 px-6 rounded-xl shadow-lg transform transition-all duration-200 hover:scale-105 active:scale-95 text-lg"
              >
                😕 模糊
              </button>
              <button
                onClick={handleRememberClick}
                className="flex-1 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white font-bold py-4 px-6 rounded-xl shadow-lg transform transition-all duration-200 hover:scale-105 active:scale-95 text-lg"
              >
                😊 记住了
              </button>
            </div>
            )}
          </div>
        )}
      </div>

      {/* 底部导航 */}
      <BottomNav />
    </div>
  );
}

