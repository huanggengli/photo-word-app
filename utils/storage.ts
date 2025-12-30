import { FlashCardData } from "@/components/FlashCard";
import { initializeReviewFields } from "./review";

const STORAGE_KEY = "flashcard_wordbook";

export function saveFlashCard(cardData: FlashCardData): void {
  try {
    const existingCards = getFlashCards();
    
    // 如果卡片没有复习字段，初始化它们
    const reviewFields = initializeReviewFields();
    const cardWithReview: FlashCardData = {
      ...cardData,
      // 如果已有复习字段，保留它们；否则使用初始值
      reviewStage: cardData.reviewStage !== undefined ? cardData.reviewStage : reviewFields.reviewStage,
      nextReviewDate: cardData.nextReviewDate || reviewFields.nextReviewDate,
      reviewCount: cardData.reviewCount !== undefined ? cardData.reviewCount : reviewFields.reviewCount,
      lastReviewDate: cardData.lastReviewDate || reviewFields.lastReviewDate,
    };
    
    existingCards.push(cardWithReview);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(existingCards));
  } catch (error) {
    console.error("保存闪卡失败:", error);
    throw new Error("保存失败，请检查浏览器存储权限");
  }
}

// 更新闪卡（用于复习时更新）
export function updateFlashCard(index: number, cardData: FlashCardData): void {
  try {
    const cards = getFlashCards();
    if (index < 0 || index >= cards.length) {
      throw new Error("索引超出范围");
    }
    cards[index] = cardData;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(cards));
  } catch (error) {
    console.error("更新闪卡失败:", error);
    throw new Error("更新失败");
  }
}

export function getFlashCards(): FlashCardData[] {
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    if (!data) return [];
    return JSON.parse(data);
  } catch (error) {
    console.error("读取闪卡失败:", error);
    return [];
  }
}

export function deleteFlashCard(index: number): void {
  try {
    const cards = getFlashCards();
    cards.splice(index, 1);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(cards));
  } catch (error) {
    console.error("删除闪卡失败:", error);
    throw new Error("删除失败");
  }
}

export function clearFlashCards(): void {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch (error) {
    console.error("清空闪卡失败:", error);
    throw new Error("清空失败");
  }
}

