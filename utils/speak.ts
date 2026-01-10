export const speak = (text: string) => {
  if (!text) return;

  // 方案 A：有道词典 API（音质好）
  const youdaoUrl = `https://dict.youdao.com/dictvoice?audio=${encodeURIComponent(text)}&type=2`;
  const audio = new Audio(youdaoUrl);

  audio.play().catch((err) => {
    console.warn("有道发音失败，切换到浏览器原生发音:", err);
    fallbackSpeak(text);
  });
};

// 方案 B：浏览器原生发音（兜底）
const fallbackSpeak = (text: string) => {
  if (typeof window === "undefined" || !window.speechSynthesis) {
    console.error("浏览器不支持发音功能");
    return;
  }

  window.speechSynthesis.cancel();

  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = "en-US";
  utterance.rate = 0.9;

  const voices = window.speechSynthesis.getVoices();
  const bestVoice = voices.find(v =>
    v.name.includes("Google US") ||
    v.name.includes("Samantha") ||
    v.lang === "en-US"
  );
  if (bestVoice) utterance.voice = bestVoice;

  window.speechSynthesis.speak(utterance);
};