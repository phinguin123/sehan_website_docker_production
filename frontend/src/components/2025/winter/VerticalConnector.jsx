"use client"

import { useEffect, useRef, useState } from "react"

export default function VerticalConnector({ dots = 6 }) {
  const [isVisible, setIsVisible] = useState(false)
  const ref = useRef(null)

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) setIsVisible(true)
      },
      { threshold: 0.9, rootMargin: "-20% 0px" },
    )
    if (ref.current) observer.observe(ref.current)
    return () => {
      if (ref.current) observer.unobserve(ref.current)
    }
  }, [])

  const dotArray = Array.from({ length: dots })

  // Calculate gradient opacity: starts lighter, gets darker
  const getDotOpacity = (index, total) => {
    const minOpacity = 0.2
    const maxOpacity = 0.9
    return minOpacity + (index / (total - 1)) * (maxOpacity - minOpacity)
  }

  return (
    <div ref={ref} className="flex flex-col items-center justify-center py-6">
      <div className="flex flex-col items-center justify-center space-y-3">
        {dotArray.map((_, i) => {
          const opacity = getDotOpacity(i, dots)
          return (
            <span
              key={i}
              className="block w-3 h-3 rounded-full bg-foreground"
              style={{
                opacity: isVisible ? opacity : 0,
                transform: isVisible ? "scale(1)" : "scale(0.6)",
                transition: "opacity 300ms ease-out, transform 300ms ease-out",
                transitionDelay: `${i * 100}ms`,
              }}
            />
          )
        })}
      </div>
    </div>
  )
}


