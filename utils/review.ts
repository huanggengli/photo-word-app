import { FlashCardData } from "@/components/FlashCard";

// 艾宾浩斯复习间隔（天数）
export const REVIEW_INTERVALS = [1, 2, 4, 7, 15, 30];

// 获取今天的日期（ISO格式，只包含日期部分）
export function getTodayISO(): string {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return today.toISOString().split("T")[0];
}

// 获取明天的日期
export function getTomorrowISO(): string {
  const tomorrow = new Date();
  tomorrow.setHours(0, 0, 0, 0);
  tomorrow.setDate(tomorrow.getDate() + 1);
  return tomorrow.toISOString().split("T")[0];
}

// 获取指定天数后的日期
export function getDateAfterDays(days: number): string {
  const date = new Date();
  date.setHours(0, 0, 0, 0);
  date.setDate(date.getDate() + days);
  return date.toISOString().split("T")[0];
}

// 判断日期是否在今天或之前
export function isDateTodayOrBefore(dateString: string): boolean {
  const date = new Date(dateString);
  date.setHours(0, 0, 0, 0);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return date.getTime() <= today.getTime();
}

// 初始化新闪卡的复习字段
export function initializeReviewFields(): {
  reviewStage: number;
  nextReviewDate: string;
  reviewCount: number;
  lastReviewDate: string;
} {
  const today = getTodayISO();
  const tomorrow = getTomorrowISO();

  return {
    reviewStage: 0,
    nextReviewDate: tomorrow, // 明天开始第一次复习
    reviewCount: 0,
    lastReviewDate: today,
  };
}

// 处理"记住了"操作
export function handleRemember(card: FlashCardData): FlashCardData {
  const today = getTodayISO();
  let newStage = (card.reviewStage || 0) + 1;

  // 如果已经是最后一个阶段，标记为已掌握（stage 6）
  if (newStage >= REVIEW_INTERVALS.length) {
    newStage = 6;
  }

  const updatedCard: FlashCardData = {
    ...card,
    reviewStage: newStage,
    reviewCount: (card.reviewCount || 0) + 1,
    lastReviewDate: today,
  };

  // 如果已掌握，不再设置下次复习日期
  if (newStage === 6) {
    // 已掌握，可以设置一个很远的日期或者不设置
    updatedCard.nextReviewDate = getDateAfterDays(365); // 一年后（实际上不会再复习）
  } else {
    // 根据新阶段设置下次复习日期
    const interval = REVIEW_INTERVALS[newStage];
    updatedCard.nextReviewDate = getDateAfterDays(interval);
  }

  return updatedCard;
}

// 处理"再看看"操作
export function handleReviewAgain(card: FlashCardData): FlashCardData {
  const today = getTodayISO();
  const tomorrow = getTomorrowISO();

  return {
    ...card,
    reviewStage: 0,
    nextReviewDate: tomorrow,
    lastReviewDate: today,
  };
}

// 获取待复习的卡片
export function getCardsToReview(cards: FlashCardData[]): FlashCardData[] {
  const today = getTodayISO();
  return cards.filter((card) => {
    // 已掌握的卡片不参与复习
    if (card.reviewStage === 6) return false;

    const nextReviewDate = card.nextReviewDate || getTomorrowISO();
    return isDateTodayOrBefore(nextReviewDate);
  });
}

// 获取已掌握的卡片
export function getMasteredCards(cards: FlashCardData[]): FlashCardData[] {
  return cards.filter((card) => card.reviewStage === 6);
}

// 获取学习中的卡片（非已掌握且有待复习的）
export function getLearningCards(cards: FlashCardData[]): FlashCardData[] {
  return cards.filter((card) => {
    if (card.reviewStage === 6) return false;
    const nextReviewDate = card.nextReviewDate || getTomorrowISO();
    return !isDateTodayOrBefore(nextReviewDate);
  });
}

// 获取下次复习时间（最近的待复习卡片的下次复习日期）
export function getNextReviewDate(cards: FlashCardData[]): string | null {
  const learningCards = getLearningCards(cards);
  if (learningCards.length === 0) return null;

  const sortedCards = learningCards.sort((a, b) => {
    const dateA = new Date(a.nextReviewDate || getTomorrowISO());
    const dateB = new Date(b.nextReviewDate || getTomorrowISO());
    return dateA.getTime() - dateB.getTime();
  });

  return sortedCards[0].nextReviewDate || null;
}

