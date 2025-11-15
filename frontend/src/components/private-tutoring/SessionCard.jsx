"use client"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ChevronDown, ChevronRight, Eye, Edit, Clock, User, BookOpen, Calendar, GraduationCap } from "lucide-react"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"

export function SessionCard({
  session,
  sessionHistory,
  expandedSessions,
  toggleSessionExpansion,
  openDetailModal,
  openEditModal,
  formatDate,
  formatTime,
  getDurationLabel,
  getStudentSubjectBalance,
}) {
  const isExpanded = expandedSessions.has(session.session_id)

  const getSubjectColor = (subject) => {
    const colors = {
      "Math AA": "bg-blue-100 text-blue-800 border-blue-200",
      "Biology": "bg-green-100 text-green-800 border-green-200",
      "English": "bg-purple-100 text-purple-800 border-purple-200",
      "Korean": "bg-amber-100 text-amber-800 border-amber-200",
      "Art": "bg-pink-100 text-pink-800 border-pink-200",
    }
    return colors[subject] || "bg-gray-100 text-gray-800 border-gray-200"
  }

  const getGradeColor = (grade) => {
    if (grade == 12) return "bg-emerald-100 text-emerald-700"
    if (grade == 11) return "bg-blue-100 text-blue-700"
    return "bg-indigo-100 text-indigo-700"
  }

  const getCircleColor = (grade) => {
    if (grade == 12) return "bg-emerald-500"
    if (grade == 11) return "bg-blue-500"
    return "bg-indigo-500"
  }

  return (
    <Card className="mb-4 overflow-hidden border-0 shadow-sm hover:shadow-md transition-all duration-200 bg-white">
      <Collapsible open={isExpanded} onOpenChange={() => toggleSessionExpansion(session.session_id)}>
        <CollapsibleTrigger asChild>
          <CardHeader className="cursor-pointer hover:bg-gray-50/50 transition-colors duration-150 p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="flex-shrink-0">
                  <div
                    className={`w-12 h-12 rounded-full ${getCircleColor(session.grade)} flex items-center justify-center text-white font-bold text-lg shadow-sm`}
                  >
                    {session.grade}
                  </div>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center space-x-3 mb-2">
                    <h3 className="text-lg font-semibold text-gray-900 truncate">{session.student_name}</h3>
                    <Badge variant="secondary" className={`${getGradeColor(session.grade)} border font-medium`}>
                      <GraduationCap className="w-3 h-3 mr-1" />
                      Grade {session.grade}
                    </Badge>
                  </div>
                  <div className="flex items-center space-x-4 text-sm text-gray-600">
                    <div className="flex items-center space-x-1">
                      <BookOpen className="w-4 h-4" />
                      <Badge
                        variant="outline"
                        className={`${getSubjectColor(session.subject_name)} border font-medium`}
                      >
                        {session.subject_name}
                      </Badge>
                    </div>
                    <div className="flex items-center space-x-1">
                      <Clock className="w-4 h-4" />
                      <span className="font-medium">{getDurationLabel(session.duration_hours)}</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex items-center space-x-6">
                <div className="text-right">
                  <div className="flex items-center space-x-1 text-gray-900 font-semibold mb-1">
                    <Calendar className="w-4 h-4" />
                    <span>{formatDate(session.start_time)}</span>
                  </div>
                  <div className="text-sm text-gray-500">{formatTime(session.start_time)}</div>
                </div>

                <div className="text-right">
                  <div className="flex items-center space-x-1 text-gray-900 font-semibold mb-1">
                    <User className="w-4 h-4" />
                    <span>{session.teacher_name}</span>
                  </div>
                  <div className="text-sm text-gray-500">Teacher</div>
                </div>

                {/* Session Balance Display */}
                <div className="text-right">
                  <div className="flex items-center space-x-1 text-green-900 font-semibold mb-1">
                    <BookOpen className="w-4 h-4" />
                    <span>{getStudentSubjectBalance ? getStudentSubjectBalance(session.student_id, session.subject_id) : '-'}</span>
                  </div>
                  <div className="text-sm text-gray-500">Remaining</div>
                </div>

                <div className="flex-shrink-0">
                  {isExpanded ? (
                    <ChevronDown className="w-5 h-5 text-gray-400" />
                  ) : (
                    <ChevronRight className="w-5 h-5 text-gray-400" />
                  )}
                </div>
              </div>
            </div>
          </CardHeader>
        </CollapsibleTrigger>

        <CollapsibleContent>
          <CardContent className="px-6 pb-6 pt-0">
            <div className="border-t border-gray-100 pt-6">
              <div className="grid md:grid-cols-2 gap-8">
                {/* Session Details */}
                <div className="space-y-4">
                  <h4 className="text-sm font-semibold text-gray-900 uppercase tracking-wide border-b border-gray-200 pb-2">
                    Session Details
                  </h4>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between py-2 border-b border-gray-50">
                      <span className="text-sm font-medium text-gray-600">Student</span>
                      <span className="text-sm text-gray-900">
                        {session.student_name} (Grade {session.grade})
                      </span>
                    </div>
                    <div className="flex items-center justify-between py-2 border-b border-gray-50">
                      <span className="text-sm font-medium text-gray-600">Subject</span>
                      <Badge
                        variant="outline"
                        className={`${getSubjectColor(session.subject_name)} border font-medium`}
                      >
                        {session.subject_name}
                      </Badge>
                    </div>
                    <div className="flex items-center justify-between py-2 border-b border-gray-50">
                      <span className="text-sm font-medium text-gray-600">Duration</span>
                      <span className="text-sm text-gray-900 font-medium">
                        {getDurationLabel(session.duration_hours)}
                      </span>
                    </div>
                    <div className="flex items-center justify-between py-2 border-b border-gray-50">
                      <span className="text-sm font-medium text-gray-600">Teacher</span>
                      <span className="text-sm text-gray-900">{session.teacher_name}</span>
                    </div>
                    <div className="flex items-center justify-between py-2 border-b border-gray-50">
                      <span className="text-sm font-medium text-gray-600">Remaining Sessions</span>
                      <Badge className="bg-green-100 text-green-800 border-green-200">
                        {getStudentSubjectBalance(session.student_id, session.subject_id)} sessions
                      </Badge>
                    </div>
                    {session.session_notes && (
                      <div className="pt-2">
                        <span className="text-sm font-medium text-gray-600 block mb-2">Notes</span>
                        <div className="bg-gray-50 rounded-lg p-3 text-sm text-gray-700 border border-gray-200 whitespace-pre-wrap">
                          {session.session_notes}
                        </div>
                      </div>
                    )}
                  </div>
                </div>


                {/* Session History */}
                <div className="space-y-4">
                  <h4 className="text-sm font-semibold text-gray-900 uppercase tracking-wide border-b border-gray-200 pb-2">
                    Session History
                  </h4>
                  {sessionHistory[session.session_id] ? (
                    <div className="space-y-3 max-h-80 overflow-y-auto">
                      {sessionHistory[session.session_id]
                        .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
                        .map((historyItem, historyIndex) => (
                        <div
                          key={historyItem.audit_id || historyIndex}
                          className={`transition-all duration-150 rounded-lg border p-4 ${
                            historyIndex === 0 
                              ? "bg-blue-50 border-blue-200 shadow-sm" 
                              : "bg-red-50 border-red-200"
                          }`}
                        >
                          <div className="flex justify-between items-start mb-3">
                            <div className="flex-1">
                              <div className="font-semibold text-gray-900 mb-1">
                                {historyItem.created_at ? new Date(historyItem.created_at).toLocaleDateString('en-US', {
                                  year: 'numeric',
                                  month: 'short',
                                  day: 'numeric',
                                  hour: '2-digit',
                                  minute: '2-digit'
                                }) : 'Unknown time'}
                              </div>
                              <div className="text-sm text-gray-600 mb-2">
                                <span className="font-medium">{historyItem.action || 'Action'}</span>
                              </div>
                            </div>
                            <div className="flex flex-col gap-1">
                              {historyIndex === 0 ? (
                                <Badge className="bg-blue-600 hover:bg-blue-700">
                                  Current
                                </Badge>
                              ) : (
                                <Badge variant="destructive">Deleted</Badge>
                              )}
                            </div>
                          </div>

                          <div className="text-sm text-gray-700 mb-2">
                            <strong>Teacher:</strong> {historyItem.teacher_name || 'Unknown'}
                          </div>

                          {historyItem.session_notes && (
                            <div className="text-sm mb-3 p-3 rounded border text-gray-700 bg-white border-gray-100">
                              <strong>Session Notes:</strong>
                              <div className="mt-1 whitespace-pre-wrap line-height-1.4">
                                {historyItem.session_notes}
                              </div>
                            </div>
                          )}

                          <div className="text-xs text-gray-500 space-y-1">
                            {historyItem.created_at && (
                              <div>
                                <strong>Created:</strong> {new Date(historyItem.created_at).toLocaleString()}
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8 text-gray-500">
                      <div className="animate-pulse">Loading history...</div>
                    </div>
                  )}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex justify-end space-x-3 mt-8 pt-6 border-t border-gray-100">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => openDetailModal(session)}
                  className="flex items-center space-x-2 hover:bg-blue-50 hover:border-blue-300 hover:text-blue-700 transition-colors"
                >
                  <Eye className="w-4 h-4" />
                  <span>View Details</span>
                </Button>
                <Button
                  size="sm"
                  onClick={() => openEditModal(session)}
                  className="flex items-center space-x-2 bg-blue-600 hover:bg-blue-700 text-white"
                >
                  <Edit className="w-4 h-4" />
                  <span>Edit Session</span>
                </Button>
              </div>
            </div>
          </CardContent>
        </CollapsibleContent>
      </Collapsible>
    </Card>
  )
}
