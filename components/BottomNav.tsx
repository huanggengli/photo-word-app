"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { getFlashCards } from "@/utils/storage";
import { getCardsToReview } from "@/utils/review";

export default function BottomNav() {
  const pathname = usePathname();
  const [reviewCount, setReviewCount] = useState(0);

  useEffect(() => {
    // 计算今日待复习数量
    const cards = getFlashCards();
    const toReview = getCardsToReview(cards);
    setReviewCount(toReview.length);
  }, [pathname]); // 当路由变化时重新计算

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 z-50">
      <div className="max-w-2xl mx-auto">
        <div className="flex items-center justify-around h-16">
          {/* 首页 */}
          <Link
            href="/"
            className={`flex flex-col items-center justify-center flex-1 h-full transition-colors ${
              pathname === "/"
                ? "text-blue-600 dark:text-blue-400"
                : "text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
            }`}
          >
            <svg
              className="w-6 h-6 mb-1"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"
              />
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 22V12h6v10"
              />
            </svg>
            <span className="text-xs font-medium">首页</span>
          </Link>

          {/* 复习 */}
          <Link
            href="/review"
            className={`flex flex-col items-center justify-center flex-1 h-full transition-colors relative ${
              pathname === "/review"
                ? "text-blue-600 dark:text-blue-400"
                : "text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
            }`}
          >
            <svg
              className="w-6 h-6 mb-1"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4"
              />
            </svg>
            <span className="text-xs font-medium">复习</span>
            {/* 角标 */}
            {reviewCount > 0 && (
              <span className="absolute top-1 right-1/4 bg-red-500 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
                {reviewCount > 99 ? "99+" : reviewCount}
              </span>
            )}
          </Link>

          {/* 单词本 */}
          <Link
            href="/wordbook"
            className={`flex flex-col items-center justify-center flex-1 h-full transition-colors ${
              pathname === "/wordbook"
                ? "text-blue-600 dark:text-blue-400"
                : "text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
            }`}
          >
            <svg
              className="w-6 h-6 mb-1"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
              />
            </svg>
            <span className="text-xs font-medium">单词本</span>
          </Link>
        </div>
      </div>
    </nav>
  );
}

