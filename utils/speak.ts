export const speak = (text: string) => {
  if (!text) return;

  // 如果是长文本（句子），优先用浏览器原生发音（更稳定）
  if (text.length > 20) {
    browserSpeak(text);
    return;
  }

  // 短文本（单词）用有道 API（音质更好）
  const youdaoUrl = `https://dict.youdao.com/dictvoice?audio=${encodeURIComponent(text)}&type=2`;
  const audio = new Audio(youdaoUrl);

  // 设置超时：2秒内没播放就切换备用方案
  const timeout = setTimeout(() => {
    audio.pause();
    browserSpeak(text);
  }, 2000);

  audio.onplay = () => clearTimeout(timeout);
  audio.onerror = () => {
    clearTimeout(timeout);
    browserSpeak(text);
  };

  audio.play().catch(() => {
    clearTimeout(timeout);
    browserSpeak(text);
  });
};

// 浏览器原生发音
const browserSpeak = (text: string) => {
  if (typeof window === "undefined" || !window.speechSynthesis) {
    console.error("浏览器不支持发音");
    return;
  }

  window.speechSynthesis.cancel();

  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = "en-US";
  utterance.rate = 0.9;

  // 尝试获取更好的语音
  const voices = window.speechSynthesis.getVoices();
  const goodVoice = voices.find(v =>
    v.name.includes("Google") ||
    v.name.includes("Samantha") ||
    v.name.includes("Daniel") ||
    (v.lang === "en-US" && v.localService)
  );
  if (goodVoice) utterance.voice = goodVoice;

  window.speechSynthesis.speak(utterance);
};