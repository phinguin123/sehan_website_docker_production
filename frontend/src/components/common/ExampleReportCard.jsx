import React from 'react';

const ExampleReportCard = () => {
  const studentInfo = {
    name: "Suhyun Kim",
    grade: "Grade 11",
    school: "International School",
    subject: "Mathematics",
    period: "2025.07.01 – 2025.09.15",
    instructor: "Hong Gil-dong",
  };

  const progressCards = [
    {
      title: "Score",
      value: "High 6 to Low 7",
      subtitle: "Based on recent mock test conversion",
    },
    {
      title: "Focus Units",
      value: "3 Units",
      subtitle: "Functions • Quadratics • Transformations",
    },
    {
      title: "Parent Message",
      value: "Excellent",
      subtitle: "Detailed feedback about student progress",
    },
    {
      title: "Goal",
      value: "Functions",
      subtitle: "Function is seen as a weak point hence solving more function problems is required",
    },
  ];

  const sessionLogs = [
    {
      session: "01",
      date: "2025.07.01",
      comment: "Reviewed function basics and graphing techniques. Student showed good understanding of domain and range concepts but struggled with composite functions.",
    },
    {
      session: "02",
      date: "2025.07.08",
      comment: "Practiced substitution and composite problems extensively. Speed needs improvement but accuracy is developing well with consistent practice.",
    },
    {
      session: "03",
      date: "2025.07.15",
      comment: "Applied quadratic functions to real-world problems. Student demonstrated improved problem-solving approach and better time management.",
    },
    {
      session: "04",
      date: "2025.07.22",
      comment: "Worked on complex function transformations including reflections and translations. Conceptual understanding is solid.",
    },
    {
      session: "05",
      date: "2025.07.29",
      comment: "Focused on inverse functions and domain/range restrictions. Student showed excellent progress in identifying key characteristics.",
    },
    {
      session: "06",
      date: "2025.08.05",
      comment: "Practice test simulation with emphasis on time management. Student improved speed by 20% while maintaining accuracy.",
    },
    {
      session: "07",
      date: "2025.08.12",
      comment: "Advanced function applications and modeling problems. Student demonstrated strong analytical thinking skills.",
    },
    {
      session: "08",
      date: "2025.08.19",
      comment: "Review session covering all three focus units. Identified areas for continued practice and reinforcement.",
    },
  ];

  const keyObservations = [
    {
      title: "Problem-solving speed",
      description: "Needs improvement in timed settings, but showing consistent progress",
    },
    {
      title: "Conceptual understanding",
      description: "Solid foundation across all three focus units with strong analytical skills",
    },
    {
      title: "Consistency",
      description: "Excellent participation and homework completion across all sessions",
    },
  ];

  const nextSteps = [
    "Functions is seen as a weak point hence solving more function problems is required",
    "Focus on composite function applications and inverse function properties",
    "Complete 3 practice sets per week using PM7 Workbook Vol. 2",
    "Emphasize time management strategies for test conditions",
  ];

  const parentMessage = "Dear Parents, Suhyun has demonstrated exceptional dedication and analytical thinking throughout this 12-session period, consistently completing assignments and actively participating in problem-solving discussions. Her conceptual understanding of functions, quadratics, and transformations has grown significantly, though she would benefit from additional practice in timed problem-solving scenarios. With continued focus on function applications and regular practice, we expect her to achieve her target score range and build confidence for upcoming assessments.";

  return (
    <div className="example-report-card">
      <div className="report-container">
        {/* Curved Header */}
        <div className="report-header">
          <div className="header-content">
            <h1 className="academy-title">SEHAN ACADEMY IB</h1>
            <div className="student-info">
              <h2 className="student-name">{studentInfo.name}</h2>
              <p className="student-details">
                Grade {studentInfo.grade} • {studentInfo.subject}
              </p>
              <div className="score-badge">
                <span className="score-value">{progressCards[0]?.value}</span>
                <span className="score-max">/ 7</span>
              </div>
            </div>
          </div>
          <div className="header-curve"></div>
        </div>

        <div className="report-content">
          {/* Parent Communication */}
          <div className="report-section parent-message">
            <div className="section-header">
              <div className="section-icon">💬</div>
              <h3 className="section-title">Parent Message</h3>
            </div>
            <p className="section-content">{parentMessage}</p>
          </div>

          {/* Observations */}
          <div className="report-section observations">
            <div className="section-header">
              <div className="section-icon">👁</div>
              <h3 className="section-title">Key Insights</h3>
            </div>
            <div className="observations-list">
              {keyObservations.map((obs, i) => (
                <div key={i} className="observation-item">
                  <h4 className="observation-title">{obs.title}</h4>
                  <p className="observation-description">{obs.description}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Action Items */}
          <div className="report-section action-plan">
            <div className="section-header">
              <div className="section-icon">🎯</div>
              <h3 className="section-title">Action Plan</h3>
            </div>
            <div className="action-items">
              {nextSteps.map((step, i) => (
                <div key={i} className="action-item">
                  <div className="action-number">{i + 1}</div>
                  <p className="action-text">{step}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Session Timeline */}
          <div className="report-section session-timeline">
            <div className="section-header">
              <div className="section-icon">📚</div>
              <h3 className="section-title">Learning Journey</h3>
            </div>
            <div className="sessions-list">
              {sessionLogs.map((session, i) => (
                <div key={i} className="session-item">
                  <div className="session-number">{session.session}</div>
                  <div className="session-content">
                    <div className="session-header">
                      <span className="session-title">Session {session.session}</span>
                      <span className="session-date">{session.date}</span>
                    </div>
                    <p className="session-comment">{session.comment}</p>
                  </div>
                  {i < sessionLogs.length - 1 && <div className="session-connector"></div>}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ExampleReportCard;

