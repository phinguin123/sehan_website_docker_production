import React, { useState, useEffect, useRef } from "react";
import musicFile from "@/assets/music/secrect_v02_music.mp3";

export default function NotificationPage() {
  const fullText = `Happy New Year!

올해도, 정말 수고 많았어요.

아무도 보지 않는 자리에서
혼자 문제를 붙잡고 앉아 있던 날들,
잘하고 있는 건지조차 확신이 없던 순간들,
그래도 그냥 하루를 넘기지 않으려고
다시 책을 펼쳤던 기억들.

그 시간들이
겉으로는 아무 일도 없는 것처럼 보여도
사실은 가장 큰 용기였다는 걸
누군가는 꼭 알아줬으면 했어요.

공부는 늘 결과로만 평가되지만,
저는 여러분이
포기하지 않고 오늘까지 왔다는 사실 자체가
이미 충분히 대단하다고 생각합니다.

이 공간도, 이 시스템도
"조금이라도 덜 외롭게 공부했으면 좋겠다"는 마음으로 만들었어요.
여러분이 혼자가 아니라는 걸,
아주 작은 방식으로라도 느낄 수 있었으면 했습니다.

새해에는
조금 느려도 괜찮고,
조금 흔들려도 괜찮아요.
중요한 건
끝까지 자기 편으로 남아주는 것이니까요.

여러분의 다음 한 해가
지금보다 덜 불안하고,
조금 더 따뜻해지길 진심으로 바랍니다.

새해 복 많이 받으세요.
여러분을 응원합니다.


— 해커 김지태`;

  const [displayedText, setDisplayedText] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [showCursor, setShowCursor] = useState(false);
  const [hasStarted, setHasStarted] = useState(false);
  
  const currentIndexRef = useRef(0);
  const timeoutRef = useRef(null);
  const hasStartedRef = useRef(false);
  const cursorRef = useRef(null);
  const audioRef = useRef(null);

  // Start the experience (typing + music)
  const handleStart = () => {
    setHasStarted(true);
    setIsTyping(true);
    setShowCursor(true);
    
    // Start music
    if (audioRef.current) {
      audioRef.current.volume = 0.5;
      audioRef.current.loop = true;
      audioRef.current.play().catch((error) => {
        console.error("Error playing music:", error);
      });
    }
  };

  // TYPING LOGIC - Only starts when hasStarted is true
  useEffect(() => {
    if (!hasStarted || hasStartedRef.current) return;
    hasStartedRef.current = true;

    const textArray = fullText.split("");
    currentIndexRef.current = 0;

    const typeNextChar = () => {
      if (currentIndexRef.current >= textArray.length) {
        setIsTyping(false);
        setShowCursor(false);
        return;
      }

      const char = textArray[currentIndexRef.current];
      setDisplayedText((prev) => prev + char);
      currentIndexRef.current++;

      let delay;
      if (char === ",") {
        delay = 400;
      } else if (char === "." || char === "!" || char === "\n") {
        delay = 600;
      } else {
        delay = 40 + Math.random() * 40; // Slightly faster for smoother flow
      }

      timeoutRef.current = setTimeout(typeNextChar, delay);
    };

    timeoutRef.current = setTimeout(typeNextChar, 800);

    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, [hasStarted]);

  // --- IMPROVED SCROLL LOGIC ---
  useEffect(() => {
    if (cursorRef.current && isTyping) {
      const cursorRect = cursorRef.current.getBoundingClientRect();
      const viewportHeight = window.innerHeight;
      
      // Target Zone: We want the cursor to be around 40-50% down the screen.
      // Trigger scroll ONLY if cursor goes below 55% of screen height.
      const triggerPoint = viewportHeight * 0.55;

      if (cursorRect.top > triggerPoint) {
        // Calculate how much we need to scroll to bring it back to the center
        const scrollAmount = cursorRect.top - (viewportHeight * 0.45);
        
        window.scrollBy({
          top: scrollAmount,
          behavior: "smooth" // Smooth scroll makes it feel like a camera pan
        });
      }
    }
  }, [displayedText, isTyping]);

  const handleSkip = () => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    setIsTyping(false);
    setDisplayedText(fullText);
    setShowCursor(false);
    // On skip, scroll to bottom to show signature
    setTimeout(() => {
       window.scrollTo({ top: document.body.scrollHeight, behavior: "smooth" });
    }, 100);
  };

  return (
    <div
      className="min-h-screen w-full flex items-center justify-center"
      style={{
        backgroundColor: "#1a1a1a",
        fontFamily: "'Pretendard', sans-serif",
      }}
    >
      {/* Start Button - Shows before experience starts */}
      {!hasStarted && (
        <div 
          className="fixed inset-0 flex items-center justify-center"
          style={{ 
            zIndex: 5, // Lower than sidebar (z-10) so sidebar is clickable
            pointerEvents: "none" // Allow clicks to pass through to sidebar
          }}
        >
          <button
            onClick={handleStart}
            className="px-8 py-4 text-xl md:text-2xl font-semibold text-white bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 rounded-full shadow-2xl transform transition-all duration-300 hover:scale-105 active:scale-95"
            style={{
              boxShadow: "0 0 30px rgba(59, 130, 246, 0.5)",
              pointerEvents: "auto" // Button itself is clickable
            }}
          >
            Read Me
          </button>
        </div>
      )}

      {hasStarted && (
        <div className="max-w-4xl mx-auto px-4 w-full flex flex-col items-center justify-center min-h-screen">
          {/* Skip Button */}
          {isTyping && (
            <div className="fixed top-6 right-6" style={{ zIndex: 20 }}>
              <button
                onClick={handleSkip}
                className="text-gray-500 hover:text-white text-xs md:text-sm transition-colors duration-200 border border-gray-700 hover:border-gray-500 px-3 py-1 rounded-full backdrop-blur-sm"
              >
                Skip Animation
              </button>
            </div>
          )}

          {/* Centered text container */}
          <div 
              className="relative w-full flex items-center justify-center"
              style={{
                  paddingTop: "20vh", 
                  paddingBottom: "20vh",
                  minHeight: "100vh"
              }}
          >
          {/* Optional: Fade gradient at the top to make text disappear smoothly */}
          <div 
            className="fixed top-0 left-0 w-full h-32 bg-gradient-to-b from-[#1a1a1a] to-transparent pointer-events-none z-10" 
          />

          <div
            className="text-lg md:text-xl leading-relaxed whitespace-pre-wrap text-gray-100 w-full"
            style={{ 
              lineHeight: "1.8",
              textAlign: "left"
            }}
          >
            {displayedText}
            
            {showCursor && (
              <span
                ref={cursorRef}
                className="inline-block w-2.5 h-5 bg-green-500 align-middle ml-1 shadow-[0_0_8px_rgba(74,222,128,0.5)]"
                style={{ animation: "blink 1s infinite" }}
              />
            )}
          </div>
        </div>
      </div>
      )}

      {/* Hidden audio element */}
      <audio
        ref={audioRef}
        src={musicFile}
        preload="auto"
      />

      <style>{`
        @keyframes blink {
          0%, 50% { opacity: 1; }
          51%, 100% { opacity: 0; }
        }
        /* Hide scrollbar for cleaner look, optional */
        body::-webkit-scrollbar {
            width: 8px;
            background: #1a1a1a;
        }
        body::-webkit-scrollbar-thumb {
            background: #333;
            border-radius: 4px;
        }
      `}</style>
    </div>
  );
}