"use client"

import { useEffect, useRef, useState } from "react"

// Animation tuning
const SEGMENT_DURATION_MS = 1200
const SEGMENT_STAGGER_MS = 120
const SEGMENT_EASING = "cubic-bezier(0.22, 1, 0.36, 1)"
const OPACITY_DURATION_MS = 300

// Updated data with your new colors and levels.
// Note: I renamed 'bars' to 'segments' to match the component.
const assessmentData = [
  {
    level: "Higher Level",
    segments: [
      { label: "P1", percentage: 40, color: "bg-[#325491]" },
      { label: "IA", percentage: 20, color: "bg-[#9A8ECB]" },
      { label: "P2", percentage: 40, color: "bg-[#EEA7C4]" },
    ],
  },
  {
    level: "Standard Level",
    segments: [
      { label: "P1", percentage: 35, color: "bg-[#325491]" },
      { label: "IA", percentage: 30, color: "bg-[#9A8ECB]" },
      { label: "P2", percentage: 35, color: "bg-[#EEA7C4]" },
    ],
  },
]

// This is the main component that holds the two bars
export function AssessmentSegmentedBars() { // Renamed for clarity
  const [isVisible, setIsVisible] = useState(false)
  const containerRef = useRef(null)
  const hasScrolledRef = useRef(false)
  const wasInitiallyVisibleRef = useRef(false)

  useEffect(() => {
    // Check if element is already in view on mount
    const checkInitialVisibility = () => {
      if (containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect()
        const viewportHeight = window.innerHeight
        const threshold = viewportHeight * 0.9
        const rootMargin = viewportHeight * 0.2
        const isInView = rect.top < threshold - rootMargin && rect.bottom > rootMargin
        wasInitiallyVisibleRef.current = isInView
      }
    }

    checkInitialVisibility()

    // Track scroll events
    const handleScroll = () => {
      hasScrolledRef.current = true
    }

    window.addEventListener('scroll', handleScroll, { once: true, passive: true })

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          // Only trigger if user has scrolled, or if element wasn't initially visible
          if (hasScrolledRef.current || !wasInitiallyVisibleRef.current) {
            setIsVisible(true)
          }
        }
      },
      { threshold: 0.7, rootMargin: "-10% 0px" },
    )

    if (containerRef.current) {
      observer.observe(containerRef.current)
    }

    return () => {
      window.removeEventListener('scroll', handleScroll)
      if (containerRef.current) {
        observer.unobserve(containerRef.current)
      }
    }
  }, [])

  return (
    <div ref={containerRef} className="w-full max-w-md mx-auto space-y-8">
      {assessmentData.map((assessment, levelIndex) => (
        <SegmentedProgressBar
          key={assessment.level}
          level={assessment.level}
          segments={assessment.segments}
          isVisible={isVisible}
          delay={levelIndex * 400} // Stagger delay for HL bar
        />
      ))}
    </div>
  )
}

// This is the component for the single segmented bar
function SegmentedProgressBar({ level, segments, isVisible, delay }) {
  const [segmentProgress, setSegmentProgress] = useState(
    new Array(segments.length).fill(0)
  )

  const cumulativeSegments = segments.map((segment, index) => {
    const start = segments.slice(0, index).reduce((sum, s) => sum + s.percentage, 0)
    return {
      ...segment,
      start,
      end: start + segment.percentage,
    }
  })

  useEffect(() => {
    if (!isVisible) return

    // Optimize for mobile: use requestAnimationFrame with better timing
    const startAnimation = () => {
      const perSegmentDurationMs = SEGMENT_DURATION_MS
      const followThroughDelayMs = SEGMENT_STAGGER_MS
      const timeouts = []
      const rafIds = []

      const animateSegment = (index) => {
        if (index >= segments.length) return
        
        // For mobile performance: use RAF for smooth state updates
        const rafId = requestAnimationFrame(() => {
          setSegmentProgress((prev) => {
            const newProgress = [...prev]
            newProgress[index] = 100
            return newProgress
          })
        })
        rafIds.push(rafId)
        
        const nextTimeout = setTimeout(() => animateSegment(index + 1), perSegmentDurationMs + followThroughDelayMs)
        timeouts.push(nextTimeout)
      }

      // Start first segment immediately with optimized timing
      animateSegment(0)

      return () => {
        timeouts.forEach((t) => clearTimeout(t))
        rafIds.forEach((id) => cancelAnimationFrame(id))
      }
    }

    // For the first bar (delay === 0), start immediately for mobile performance
    let cleanup
    if (delay === 0) {
      // Single RAF for immediate start - mobile browsers are ready
      const rafId = requestAnimationFrame(() => {
        cleanup = startAnimation()
      })
      return () => {
        cancelAnimationFrame(rafId)
        if (cleanup) cleanup()
      }
    } else {
      const timeout = setTimeout(() => {
        cleanup = startAnimation()
      }, delay)
      return () => {
        clearTimeout(timeout)
        if (cleanup) cleanup()
      }
    }
  }, [isVisible, delay, segments.length])

  return (
    <div className="space-y-3">
      <div className="flex flex-col items-center px-1 gap-1">
        <h2 className="text-2xl font-bold text-foreground/90 tracking-tight text-center">{level}</h2>
        <div className="flex items-baseline gap-1 flex-wrap justify-center">
          {segments.map((segment, index) => (
            <div key={segment.label} className="flex items-baseline gap-1 text-[18px] font-medium text-foreground/70">
              <span className="font-semibold">{segment.percentage}%</span>
              <span className="text-[16px] text-foreground/50">{segment.label}</span>
              {index < segments.length - 1 && <span className="text-foreground/30 mx-0.5">·</span>}
            </div>
          ))}
        </div>
      </div>

      <div className="relative h-5 rounded-full bg-muted/40" style={{ overflow: 'visible', willChange: isVisible && delay === 0 ? 'contents' : 'auto' }}>
        <div className="absolute left-0 top-0 bottom-0 flex" style={{ overflow: 'visible', width: 'calc(100% + 15px)', transform: 'translateZ(0)' }}>
          {cumulativeSegments.map((segment, index) => {
            // Z-index ensures earlier segments (higher index) overlap later ones
            const zIndex = segments.length - index

            // Check if it's the last segment (no overlap needed on the right)
            const isLastSegment = index === segments.length - 1

            // Overlap amount: each segment extends this many pixels to overlap the next
            const overlapPixels = isLastSegment ? 0 : 15

            // Calculate the animated width
            // The bar should fill its container based on progress, and always extend by overlapPixels
            // to show the rounded end that overlaps the next segment
            const progressPercent = segmentProgress[index]
            // When progress > 0, calculate width as: percentage of container + overlap extension
            // This ensures the rounded end always extends beyond the container to overlap the next segment
            // The percentage is relative to the segment container (which is segment.percentage% of total width)
            const animatedWidth = progressPercent > 0
              ? `calc(${progressPercent}% + ${overlapPixels}px)`
              : '0px'

            return (
              <div
                key={segment.label}
                className="relative h-full"
                style={{
                  width: `${segment.percentage}%`,
                  marginRight: isLastSegment ? 0 : `-${overlapPixels}px`,
                  zIndex: zIndex,
                  overflow: 'visible',
                }}
              >
                {/* This is the inner animated bar.
                It fills the segment container based on progress and extends beyond
                by overlapPixels to create a rounded end that overlaps the next segment.
                The rounded-full class ensures both ends are rounded, and the extension
                ensures the right rounded end overlaps the next segment.
              */}
                <div
                  className={`absolute left-0 top-0 h-full ${segment.color} rounded-full`}
                  style={{
                    width: animatedWidth,
                    opacity: segmentProgress[index] > 0 ? 1 : 0,
                    // Mobile optimization: set willChange early for first segment when visible
                    // This prepares the browser for animation before it starts
                    willChange: (segmentProgress[index] > 0 && segmentProgress[index] < 100) || (index === 0 && isVisible) ? 'width, opacity' : 'auto',
                    // Force GPU acceleration for mobile
                    transform: 'translateZ(0) scale(1)',
                    transformOrigin: 'left center',
                    backfaceVisibility: 'hidden',
                    WebkitBackfaceVisibility: 'hidden',
                    // iOS Safari optimization
                    WebkitTransform: 'translateZ(0) scale(1)',
                    // Optimized transition for mobile
                    transition: `width ${SEGMENT_DURATION_MS}ms ${SEGMENT_EASING}, opacity ${OPACITY_DURATION_MS}ms ease-out`,
                    borderRadius: '9999px',
                    minHeight: '100%',
                    // Reduce paint operations on mobile
                    isolation: 'isolate',
                  }}
                />
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

// Make sure to export the component
export default AssessmentSegmentedBars;