const speak = (text: string) => {
  const audio = new Audio(`https://dict.youdao.com/dictvoice?audio=${encodeURIComponent(text)}&type=2`);
  audio.play().catch(err => console.log('发音失败:', err));
};

export { speak };