"use client"

import { useEffect, useRef, useState } from "react"

export function PaperTopicsList({
  title = "Paper",
  topics = [],
  headerColor = "#325491",
}) {
  const [isVisible, setIsVisible] = useState(false)
  const containerRef = useRef(null)

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true)
        }
      },
      { threshold: 0.7, rootMargin: "0px 0px -10% 0px" },
    )

    if (containerRef.current) {
      observer.observe(containerRef.current)
    }

    return () => {
      if (containerRef.current) {
        observer.unobserve(containerRef.current)
      }
    }
  }, [])

  return (
    <div ref={containerRef} className="w-full max-w-md mx-auto" style={{ paddingTop: '3rem' }}>
      <div className="bg-white rounded-2xl overflow-hidden shadow-lg ring-1 ring-black/5">
        {/* Header */}
        <div className="px-6 py-3" style={{ backgroundColor: headerColor }}>
          <h2 className="text-2xl font-bold text-white text-center">{title}</h2>
        </div>

        {/* Topics List */}
        <div className="divide-y divide-gray-200">
          {topics.map((topic, index) => (
            <TopicItem
              key={topic}
              topic={topic}
              index={index}
              isVisible={isVisible}
            />
          ))}
        </div>
      </div>
    </div>
  )
}

function TopicItem({ topic, index, isVisible }) {
  const [show, setShow] = useState(false)

  useEffect(() => {
    if (!isVisible) return

    const delay = index * 150 // Stagger each item by 150ms
    const timeout = setTimeout(() => {
      setShow(true)
    }, delay)

    return () => clearTimeout(timeout)
  }, [isVisible, index])

  return (
    <div
      className="px-6 py-3 text-foreground text-center"
      style={{
        opacity: show ? 1 : 0,
        transform: show ? "translateX(0)" : "translateX(-20px)",
        transition: "opacity 400ms ease-out, transform 400ms ease-out",
      }}
    >
      {topic}
    </div>
  )
}

export default PaperTopicsList

