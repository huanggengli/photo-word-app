"use client";

import { useState, useRef, useEffect } from "react";
import Image from "next/image";
import FlashCard, { FlashCardData } from "@/components/FlashCard";
import { saveFlashCard } from "@/utils/storage";
import BottomNav from "@/components/BottomNav";

interface Word {
  english: string;
  chinese: string;
}

export default function Home() {
  const [image, setImage] = useState<string | null>(null);
  const [words, setWords] = useState<Word[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showCamera, setShowCamera] = useState(false);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [videoReady, setVideoReady] = useState(false);
  const [currentFlashCard, setCurrentFlashCard] = useState<{ word: Word; originalImage: string } | null>(null);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // 验证文件类型
    if (!file.type.startsWith('image/')) {
      setError('请选择图片文件');
      return;
    }

    // 验证文件大小（限制为 10MB）
    if (file.size > 10 * 1024 * 1024) {
      setError('图片文件太大，请选择小于 10MB 的图片');
      return;
    }

    // 显示预览
    const reader = new FileReader();
    reader.onloadend = () => {
      setImage(reader.result as string);
    };
    reader.onerror = () => {
      setError('读取图片失败，请重试');
    };
    reader.readAsDataURL(file);

    // 调用 API
    await analyzeImage(file);
  };

  // 启动摄像头
  const startCamera = async () => {
    try {
      setError(null);
      setVideoReady(false);
      
      // 检测是否为移动设备
      const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
      
      // 移动端使用后置摄像头，桌面端使用前置摄像头
      const videoConstraints = isMobile 
        ? { facingMode: 'environment' } 
        : { facingMode: 'user' };
      
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: videoConstraints,
        audio: false
      });
      setStream(mediaStream);
      setShowCamera(true);
      
      // 等待下一个渲染周期，确保 video 元素已渲染
      setTimeout(() => {
        if (videoRef.current) {
          videoRef.current.srcObject = mediaStream;
          // 立即尝试播放
          videoRef.current.play().catch(err => {
            console.error("立即播放失败，等待元数据加载:", err);
          });
        }
      }, 100);
    } catch (err: any) {
      console.error("启动摄像头失败:", err);
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        setError('摄像头权限被拒绝，请在浏览器设置中允许访问摄像头');
      } else if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
        setError('未找到摄像头设备，请检查设备连接');
      } else {
        setError('无法访问摄像头，请检查设备权限');
      }
    }
  };

  // 停止摄像头
  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
    setShowCamera(false);
    setVideoReady(false);
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
  };

  // 拍照
  const takePhoto = () => {
    if (!videoRef.current || !canvasRef.current) {
      setError('摄像头未就绪，请稍候再试');
      return;
    }
    
    const video = videoRef.current;
    const canvas = canvasRef.current;
    
    // 检查视频是否已加载并正在播放
    if (video.readyState !== video.HAVE_ENOUGH_DATA) {
      setError('视频未就绪，请等待摄像头加载完成');
      return;
    }
    
    // 检查视频尺寸是否有效
    if (video.videoWidth === 0 || video.videoHeight === 0) {
      setError('无法获取视频画面，请检查摄像头是否正常工作');
      return;
    }
    
    const context = canvas.getContext('2d');
    
    if (!context) {
      setError('无法创建画布上下文');
      return;
    }
    
    try {
      // 设置 canvas 尺寸与视频一致
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      
      // 绘制当前视频帧到 canvas
      context.drawImage(video, 0, 0);
      
      // 将 canvas 转换为 blob，然后转换为 File
      canvas.toBlob(async (blob) => {
        if (!blob) {
          setError('拍照失败，无法生成图片');
          return;
        }
        
        // 停止摄像头
        stopCamera();
        
        // 转换为 base64 用于预览
        const reader = new FileReader();
        reader.onloadend = () => {
          setImage(reader.result as string);
        };
        reader.onerror = () => {
          setError('读取图片失败');
        };
        reader.readAsDataURL(blob);
        
        // 转换为 File 对象
        const file = new File([blob], 'photo.jpg', { type: 'image/jpeg' });
        
        // 调用 API 分析
        await analyzeImage(file);
      }, 'image/jpeg', 0.95);
    } catch (err) {
      console.error("拍照错误:", err);
      setError('拍照失败，请重试');
    }
  };

  // 监听视频状态变化
  useEffect(() => {
    if (!videoRef.current || !stream) return;
    
    const video = videoRef.current;
    
    const handleLoadedMetadata = () => {
      console.log("视频元数据已加载");
      video.play().catch(err => {
        console.error("视频播放失败:", err);
        setError('视频播放失败，请刷新页面重试');
      });
    };
    
    const handleCanPlay = () => {
      console.log("视频可以播放");
      setVideoReady(true);
    };
    
    const handlePlaying = () => {
      console.log("视频正在播放");
      setVideoReady(true);
    };
    
    const handleError = (e: Event) => {
      console.error("视频错误:", e);
      setError('视频加载失败，请刷新页面重试');
    };
    
    video.addEventListener('loadedmetadata', handleLoadedMetadata);
    video.addEventListener('canplay', handleCanPlay);
    video.addEventListener('playing', handlePlaying);
    video.addEventListener('error', handleError);
    
    return () => {
      video.removeEventListener('loadedmetadata', handleLoadedMetadata);
      video.removeEventListener('canplay', handleCanPlay);
      video.removeEventListener('playing', handlePlaying);
      video.removeEventListener('error', handleError);
    };
  }, [stream]);
  
  // 清理摄像头资源
  useEffect(() => {
    return () => {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, [stream]);

  const handleCameraClick = () => {
    // 检查是否在移动设备上
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    
    if (isMobile) {
      // 移动端：使用 input 的 capture 属性
      if (fileInputRef.current) {
        fileInputRef.current.setAttribute("capture", "environment");
        fileInputRef.current.click();
      }
    } else {
      // 桌面端：使用浏览器摄像头 API
      startCamera();
    }
  };

  const handleUploadClick = () => {
    if (fileInputRef.current) {
      fileInputRef.current.removeAttribute("capture");
      fileInputRef.current.click();
    }
  };

  const analyzeImage = async (file: File) => {
    setLoading(true);
    setError(null);
    setWords([]);

    try {
      const formData = new FormData();
      formData.append("image", file);

      const response = await fetch("/api/analyze", {
        method: "POST",
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        // 从响应中获取错误信息
        throw new Error(data.error || "分析图片失败，请重试");
      }

      if (data.error) {
        throw new Error(data.error);
      }

      setWords(data.words || []);
      
      if (data.words && data.words.length === 0) {
        setError("未识别到物体，请尝试上传更清晰的图片");
      }
    } catch (err) {
      console.error("分析图片错误:", err);
      setError(err instanceof Error ? err.message : "发生未知错误，请检查网络连接或稍后重试");
    } finally {
      setLoading(false);
    }
  };

  const reset = () => {
    stopCamera(); // 确保摄像头已关闭
    setImage(null);
    setWords([]);
    setError(null);
    setCurrentFlashCard(null);
    setSaveSuccess(false);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleGenerateFlashCard = (word: Word) => {
    if (!image) {
      setError("请先上传图片");
      return;
    }
    setCurrentFlashCard({ word, originalImage: image });
  };

  const handleCloseFlashCard = () => {
    setCurrentFlashCard(null);
  };

  const handleSaveFlashCard = (cardData: FlashCardData) => {
    try {
      saveFlashCard(cardData);
      setSaveSuccess(true);
      setTimeout(() => {
        setSaveSuccess(false);
      }, 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "保存失败");
    }
  };

  return (
    <main className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 px-4 py-8 pb-20">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-4xl font-bold text-center mb-8 text-gray-800 dark:text-white">
          拍照学单词
        </h1>

        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-6 md:p-8">
          {showCamera ? (
            // 摄像头预览界面
            <div className="space-y-6">
              <div className="relative w-full aspect-video rounded-xl overflow-hidden shadow-lg bg-black">
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 border-4 border-white rounded-xl pointer-events-none" />
                {stream && !videoReady && (
                  <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50">
                    <p className="text-white">正在加载摄像头...</p>
                  </div>
                )}
              </div>
              
              <div className="flex gap-4">
                <button
                  onClick={stopCamera}
                  className="flex-1 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-800 dark:text-white font-semibold py-3 px-6 rounded-lg transition-colors"
                >
                  取消
                </button>
                <button
                  onClick={takePhoto}
                  className="flex-1 bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white font-semibold py-3 px-6 rounded-lg shadow-lg transform transition-all duration-200 hover:scale-105 active:scale-95"
                >
                  📸 拍照
                </button>
              </div>
              
              <canvas ref={canvasRef} className="hidden" />
            </div>
          ) : !image ? (
            // 初始选择界面
            <div className="text-center">
              <div className="mb-6">
                <button
                  onClick={handleCameraClick}
                  className="w-full max-w-md mx-auto bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white font-semibold py-6 px-8 rounded-xl shadow-lg transform transition-all duration-200 hover:scale-105 active:scale-95 text-lg md:text-xl"
                >
                  📷 拍照
                </button>
              </div>
              <div className="mb-4">
                <span className="text-gray-500 dark:text-gray-400">或</span>
              </div>
              <div>
                <button
                  onClick={handleUploadClick}
                  className="w-full max-w-md mx-auto bg-gradient-to-r from-purple-500 to-pink-600 hover:from-purple-600 hover:to-pink-700 text-white font-semibold py-6 px-8 rounded-xl shadow-lg transform transition-all duration-200 hover:scale-105 active:scale-95 text-lg md:text-xl"
                >
                  📁 从相册选择
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              <div className="relative w-full aspect-square rounded-xl overflow-hidden shadow-lg">
                <Image
                  src={image}
                  alt="上传的图片"
                  fill
                  className="object-cover"
                />
              </div>

              {loading && (
                <div className="text-center py-8">
                  <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-blue-500 border-t-transparent"></div>
                  <p className="mt-4 text-gray-600 dark:text-gray-400">
                    正在识别图片中的物体...
                  </p>
                </div>
              )}

              {error && (
                <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
                  <p className="text-red-600 dark:text-red-400 text-center">
                    {error}
                  </p>
                </div>
              )}

              {words.length > 0 && (
                <div className="space-y-3">
                  <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-4">
                    识别到的单词：
                  </h2>
                  <div className="grid gap-3">
                    {words.map((word, index) => (
                      <div
                        key={index}
                        className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-gray-700 dark:to-gray-600 rounded-lg p-4 shadow-md transform transition-all duration-200 hover:scale-102"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <span className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                              {word.english}
                            </span>
                            <span className="text-xl text-gray-700 dark:text-gray-300 ml-4">
                              {word.chinese}
                            </span>
                          </div>
                          <button
                            onClick={() => handleGenerateFlashCard(word)}
                            className="ml-4 bg-gradient-to-r from-purple-500 to-pink-600 hover:from-purple-600 hover:to-pink-700 text-white font-semibold py-2 px-4 rounded-lg shadow-md transform transition-all duration-200 hover:scale-105 text-sm flex items-center gap-2"
                          >
                            🎴 生成闪卡
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {saveSuccess && (
                <div className="fixed top-4 right-4 bg-green-500 text-white px-6 py-3 rounded-lg shadow-lg z-50 animate-slide-in">
                  ✅ 已保存到单词本！
                </div>
              )}

              <div className="flex gap-4">
                <button
                  onClick={reset}
                  className="flex-1 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-800 dark:text-white font-semibold py-3 px-6 rounded-lg transition-colors"
                >
                  重新选择
                </button>
              </div>
            </div>
          )}

          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileSelect}
            className="hidden"
          />
        </div>
      </div>

      {/* 闪卡组件 */}
      {currentFlashCard && (
        <FlashCard
          word={currentFlashCard.word}
          originalImage={currentFlashCard.originalImage}
          onClose={handleCloseFlashCard}
          onSave={handleSaveFlashCard}
        />
      )}

      {/* 底部导航 */}
      <BottomNav />
    </main>
  );
}

