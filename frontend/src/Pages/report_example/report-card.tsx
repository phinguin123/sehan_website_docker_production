import type React from "react"

interface StudentInfo {
  name: string
  grade: string
  school: string
  subject: string
  period: string
  instructor: string
}

interface ProgressCard {
  title: string
  value: string
  subtitle: string
  icon: React.ReactNode
  color: string
}

interface SessionLog {
  session: string
  date: string
  comment: string
}

interface KeyObservation {
  icon: React.ReactNode
  title: string
  description: string
}

interface ReportCardProps {
  studentInfo: StudentInfo
  progressCards: ProgressCard[]
  sessionLogs: SessionLog[]
  keyObservations: KeyObservation[]
  parentMessage: string
  nextSteps: string[]
}

export function ReportCard({
  studentInfo,
  progressCards,
  sessionLogs,
  keyObservations,
  parentMessage,
  nextSteps,
}: ReportCardProps) {
  return (
    <div
      className="max-w-sm mx-auto min-h-screen bg-gradient-to-b from-green-50 to-orange-50"
      style={{ aspectRatio: "9/16" }}
    >
      {/* Curved Header */}
      <div className="bg-gradient-to-r from-green-300 to-orange-300 text-white relative">
        <div className="p-6 pb-12">
          <h1 className="text-xl font-bold text-center mb-4">SEHAN ACADEMY IB</h1>
          <div className="text-center">
            <h2 className="text-lg font-semibold mb-1">{studentInfo.name}</h2>
            <p className="text-sm opacity-90 mb-3">
              Grade {studentInfo.grade} • {studentInfo.subject}
            </p>
            <div className="inline-flex items-center bg-white/20 backdrop-blur-sm rounded-full px-4 py-2">
              <span className="text-2xl font-bold mr-2">{progressCards[0]?.value}</span>
              <span className="text-xs">/ 7</span>
            </div>
          </div>
        </div>
        <div className="absolute bottom-0 left-0 right-0 h-6 bg-gradient-to-b from-green-50 to-orange-50 rounded-t-3xl"></div>
      </div>

      <div className="p-4 -mt-6">
        {/* Parent Communication */}
        <div className="bg-white rounded-3xl p-5 shadow-xl mb-4 border-l-4 border-green-300">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-8 h-8 bg-gradient-to-r from-green-300 to-orange-300 rounded-full flex items-center justify-center">
              <span className="text-white text-sm font-bold">💬</span>
            </div>
            <h3 className="text-lg font-bold text-green-600">Parent Message</h3>
          </div>
          <p className="text-sm text-gray-700 leading-relaxed bg-green-50 rounded-2xl p-3">{parentMessage}</p>
        </div>

        {/* Observations */}
        <div className="bg-white rounded-3xl p-5 shadow-xl mb-4 border-l-4 border-orange-300">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-8 h-8 bg-gradient-to-r from-orange-300 to-green-300 rounded-full flex items-center justify-center">
              <span className="text-white text-sm font-bold">👁</span>
            </div>
            <h3 className="text-lg font-bold text-orange-600">Key Insights</h3>
          </div>
          <div className="space-y-3">
            {keyObservations.map((obs, i) => (
              <div key={i} className="bg-orange-50 rounded-2xl p-3 border-l-2 border-orange-200">
                <h4 className="font-semibold text-orange-700 text-sm mb-1">{obs.title}</h4>
                <p className="text-xs text-gray-600 leading-relaxed">{obs.description}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Action Items */}
        <div className="bg-white rounded-3xl p-5 shadow-xl mb-4 border-l-4 border-green-300">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-8 h-8 bg-gradient-to-r from-green-300 to-orange-300 rounded-full flex items-center justify-center">
              <span className="text-white text-sm font-bold">🎯</span>
            </div>
            <h3 className="text-lg font-bold text-green-600">Action Plan</h3>
          </div>
          <div className="space-y-3">
            {nextSteps.map((step, i) => (
              <div key={i} className="flex items-start gap-3 bg-green-50 rounded-2xl p-3">
                <div className="w-6 h-6 bg-gradient-to-r from-green-400 to-orange-400 text-white rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5">
                  {i + 1}
                </div>
                <p className="text-sm text-gray-700 leading-relaxed">{step}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Session Timeline */}
        <div className="bg-white rounded-3xl p-5 shadow-xl border-l-4 border-orange-300">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-8 h-8 bg-gradient-to-r from-orange-300 to-green-300 rounded-full flex items-center justify-center">
              <span className="text-white text-sm font-bold">📚</span>
            </div>
            <h3 className="text-lg font-bold text-orange-600">Learning Journey</h3>
          </div>
          <div className="space-y-3">
            {sessionLogs.map((session, i) => (
              <div key={i} className="relative">
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 bg-gradient-to-r from-orange-200 to-green-200 rounded-full flex items-center justify-center text-xs font-bold text-gray-600 flex-shrink-0">
                    {session.session}
                  </div>
                  <div className="bg-orange-50 rounded-2xl p-3 flex-1">
                    <div className="flex justify-between items-center mb-2">
                      <span className="font-semibold text-orange-700 text-sm">Session {session.session}</span>
                      <span className="text-xs text-gray-500 bg-white px-2 py-1 rounded-full">{session.date}</span>
                    </div>
                    <p className="text-xs text-gray-600 leading-relaxed">{session.comment}</p>
                  </div>
                </div>
                {i < sessionLogs.length - 1 && (
                  <div className="w-0.5 h-4 bg-gradient-to-b from-orange-200 to-green-200 ml-4 mt-1"></div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
