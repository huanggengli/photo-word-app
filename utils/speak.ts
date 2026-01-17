export const speak = (text: string) => {
  if (!text) return;

  // 统一使用有道 API（音质好，支持长句子）
  const youdaoUrl = `https://dict.youdao.com/dictvoice?audio=${encodeURIComponent(text)}&type=2`;
  const audio = new Audio(youdaoUrl);

  // 预加载
  audio.preload = "auto";

  // 播放
  const playPromise = audio.play();
  
  if (playPromise !== undefined) {
    playPromise.catch((err) => {
      console.warn("有道发音失败，尝试浏览器原生发音:", err);
      browserSpeak(text);
    });
  }
};

// 浏览器原生发音（兜底）
const browserSpeak = (text: string) => {
  if (typeof window === "undefined") return;
  if (!window.speechSynthesis) {
    console.error("浏览器不支持发音");
    return;
  }

  // 等待语音列表加载
  const doSpeak = () => {
    window.speechSynthesis.cancel();
    
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = "en-US";
    utterance.rate = 0.85;
    utterance.pitch = 1;

    const voices = window.speechSynthesis.getVoices();
    const goodVoice = voices.find(v =>
      v.lang.startsWith("en") && v.localService
    );
    if (goodVoice) utterance.voice = goodVoice;

    window.speechSynthesis.speak(utterance);
  };

  // 如果语音列表还没加载，等待加载完成
  if (window.speechSynthesis.getVoices().length === 0) {
    window.speechSynthesis.onvoiceschanged = doSpeak;
  } else {
    doSpeak();
  }
};