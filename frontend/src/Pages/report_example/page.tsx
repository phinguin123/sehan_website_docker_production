"use client"

import React from "react"

import { ReportCard } from "@/components/report-card"
import { TrendingUp, BookOpen, MessageSquare, Target, Zap, Brain, CheckCircle } from "lucide-react"

export default function Home() {
  const studentInfo = {
    name: "Suhyun Kim",
    grade: "Grade 11",
    school: "International School",
    subject: "Mathematics",
    period: "2025.07.01 – 2025.09.15",
    instructor: "Hong Gil-dong",
  }

  const progressCards = [
    {
      title: "Score",
      value: "High 6 to Low 7",
      subtitle: "Based on recent mock test conversion",
      icon: <TrendingUp className="w-5 h-5" />,
      color: "bg-primary",
    },
    {
      title: "Focus Units",
      value: "3 Units",
      subtitle: "Functions • Quadratics • Transformations",
      icon: <BookOpen className="w-5 h-5" />,
      color: "bg-secondary",
    },
    {
      title: "Parent Message",
      value: "Excellent",
      subtitle: "Detailed feedback about student progress",
      icon: <MessageSquare className="w-5 h-5" />,
      color: "bg-success",
    },
    {
      title: "Goal",
      value: "Functions",
      subtitle: "Function is seen as a weak point hence solving more function problems is required",
      icon: <Target className="w-5 h-5" />,
      color: "bg-accent",
    },
  ]

  const sessionLogs = [
    {
      session: "01",
      date: "2025.07.01",
      comment:
        "Reviewed function basics and graphing techniques. Student showed good understanding of domain and range concepts but struggled with composite functions.",
    },
    {
      session: "02",
      date: "2025.07.08",
      comment:
        "Practiced substitution and composite problems extensively. Speed needs improvement but accuracy is developing well with consistent practice.",
    },
    {
      session: "03",
      date: "2025.07.15",
      comment:
        "Applied quadratic functions to real-world problems. Student demonstrated improved problem-solving approach and better time management.",
    },
    {
      session: "04",
      date: "2025.07.22",
      comment:
        "Worked on complex function transformations including reflections and translations. Conceptual understanding is solid.",
    },
    {
      session: "05",
      date: "2025.07.29",
      comment:
        "Focused on inverse functions and domain/range restrictions. Student showed excellent progress in identifying key characteristics.",
    },
    {
      session: "06",
      date: "2025.08.05",
      comment:
        "Practice test simulation with emphasis on time management. Student improved speed by 20% while maintaining accuracy.",
    },
    {
      session: "07",
      date: "2025.08.12",
      comment:
        "Advanced function applications and modeling problems. Student demonstrated strong analytical thinking skills.",
    },
    {
      session: "08",
      date: "2025.08.19",
      comment:
        "Review session covering all three focus units. Identified areas for continued practice and reinforcement.",
    },
  ]

  const keyObservations = [
    {
      icon: <Zap className="w-4 h-4" />,
      title: "Problem-solving speed",
      description: "Needs improvement in timed settings, but showing consistent progress",
    },
    {
      icon: <Brain className="w-4 h-4" />,
      title: "Conceptual understanding",
      description: "Solid foundation across all three focus units with strong analytical skills",
    },
    {
      icon: <CheckCircle className="w-4 h-4" />,
      title: "Consistency",
      description: "Excellent participation and homework completion across all sessions",
    },
  ]

  const nextSteps = [
    "Functions is seen as a weak point hence solving more function problems is required",
    "Focus on composite function applications and inverse function properties",
    "Complete 3 practice sets per week using PM7 Workbook Vol. 2",
    "Emphasize time management strategies for test conditions",
  ]

  const parentMessage =
    "Dear Parents, Suhyun has demonstrated exceptional dedication and analytical thinking throughout this 12-session period, consistently completing assignments and actively participating in problem-solving discussions. Her conceptual understanding of functions, quadratics, and transformations has grown significantly, though she would benefit from additional practice in timed problem-solving scenarios. With continued focus on function applications and regular practice, we expect her to achieve her target score range and build confidence for upcoming assessments."

  const [currentColorScheme, setCurrentColorScheme] = React.useState(1)

  React.useEffect(() => {
    const themeClass = currentColorScheme > 1 ? `theme-${currentColorScheme}` : ""

    for (let i = 2; i <= 10; i++) {
      document.documentElement.classList.remove(`theme-${i}`)
    }

    if (themeClass) {
      document.documentElement.classList.add(themeClass)
    }
  }, [currentColorScheme])

  return (
    <main className="min-h-screen bg-background">
      <div className="fixed top-4 right-4 z-50 bg-card text-card-foreground rounded-lg shadow-lg p-2 border">
        <select
          value={currentColorScheme}
          onChange={(e) => setCurrentColorScheme(Number(e.target.value))}
          className="text-sm border rounded px-2 py-1 bg-background"
        >
          {Array.from({ length: 10 }, (_, i) => (
            <option key={i + 1} value={i + 1}>
              Color Scheme {i + 1}
            </option>
          ))}
        </select>
      </div>

      <ReportCard
        studentInfo={studentInfo}
        progressCards={progressCards}
        sessionLogs={sessionLogs}
        keyObservations={keyObservations}
        parentMessage={parentMessage}
        nextSteps={nextSteps}
      />
    </main>
  )
}
