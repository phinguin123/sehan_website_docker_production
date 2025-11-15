import React, { useState, useEffect } from 'react';
import {
  Card,
  CardBody,
  CardHeader,
  Button,
  Table,
  Row,
  Col,
  Alert,
  Form,
  FormGroup,
  Label,
  Input,
  Badge,
  Modal,
  ModalHeader,
  ModalBody,
  ModalFooter
} from 'reactstrap';
import axios from 'axios';
import privateTutoringAxios from '../../utils/privateTutoringAxios';

const Reports = () => {
  const [sessionSummary, setSessionSummary] = useState([]);
  const [students, setStudents] = useState([]);
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [alert, setAlert] = useState({ type: '', message: '', visible: false });
  
  // Filter state
  const [filters, setFilters] = useState({
    student_id: '',
    subject: '',
    status: 'all'
  });

  // Report modal state
  const [showReportModal, setShowReportModal] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [reportData, setReportData] = useState(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      await Promise.all([
        fetchSessionSummary(),
        fetchStudents(),
        fetchAlerts()
      ]);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching data:', error);
      setLoading(false);
    }
  };

  const fetchSessionSummary = async () => {
    try {
      const response = await privateTutoringAxios.get('/sessions/summary');
      setSessionSummary(response.data);
    } catch (error) {
      console.error('Error fetching session summary:', error);
    }
  };

  const fetchStudents = async () => {
    try {
      const response = await privateTutoringAxios.get('/students');
      setStudents(response.data);
    } catch (error) {
      console.error('Error fetching students:', error);
    }
  };

  const fetchAlerts = async () => {
    try {
      const response = await privateTutoringAxios.get('/alerts');
      setAlerts(response.data);
    } catch (error) {
      console.error('Error fetching alerts:', error);
    }
  };

  const showAlert = (type, message) => {
    setAlert({ type, message, visible: true });
    setTimeout(() => setAlert({ ...alert, visible: false }), 5000);
  };

  const getProgressColor = (completed, total) => {
    const percentage = (completed / total) * 100;
    if (percentage >= 90) return 'danger';
    if (percentage >= 70) return 'warning';
    return 'success';
  };

  const getStatusBadgeColor = (remaining) => {
    if (remaining === 0) return 'danger';
    if (remaining <= 2) return 'warning';
    return 'success';
  };

  const getAlertBadgeColor = (alertType) => {
    switch (alertType) {
      case 'sessions_completed':
        return 'danger';
      case 'sessions_warning':
        return 'warning';
      case 'sessions_transferred':
        return 'info';
      default:
        return 'secondary';
    }
  };

  const canGenerateReport = (summary) => {
    return summary.completed_sessions >= summary.applied_sessions;
  };

  const generateReport = async (studentId, subject) => {
    try {
      // Fetch detailed session data for the student and subject
      const student = students.find(s => s.student_id === studentId);
      const summary = sessionSummary.find(s => s.student_id === studentId && s.subject_name === subject);
      
      if (!student || !summary) {
        showAlert('danger', 'Unable to find student or session data');
        return;
      }

      // Get session history
      const sessionResponse = await privateTutoringAxios.get(`/students/${studentId}/sessions?subject=${subject}`);
      const sessions = sessionResponse.data;

      const reportData = {
        student: student,
        summary: summary,
        sessions: sessions,
        generatedAt: new Date().toISOString()
      };

      setSelectedStudent(student);
      setReportData(reportData);
      setShowReportModal(true);
    } catch (error) {
      console.error('Error generating report:', error);
      showAlert('danger', 'Failed to generate report');
    }
  };

  const downloadPDF = () => {
    if (!reportData) return;

    // Create HTML content for PDF
    const htmlContent = generateHTMLReport(reportData);
    
    // Open print dialog (browser will handle PDF generation)
    const printWindow = window.open('', '_blank');
    printWindow.document.write(htmlContent);
    printWindow.document.close();
    printWindow.print();
    
    showAlert('success', 'Report generated! Use your browser\'s print dialog to save as PDF.');
  };

  const generateHTMLReport = (data) => {
    const { student, summary, sessions } = data;
    
    return `
    <!DOCTYPE html>
    <html>
    <head>
        <title>Private Tutoring Report - ${student.name}</title>
        <style>
            body { font-family: Arial, sans-serif; margin: 20px; }
            .header { text-align: center; border-bottom: 2px solid #333; padding-bottom: 20px; margin-bottom: 30px; }
            .student-info { background-color: #f8f9fa; padding: 20px; border-radius: 5px; margin-bottom: 30px; }
            .summary { margin-bottom: 30px; }
            .sessions { margin-bottom: 30px; }
            table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
            th, td { border: 1px solid #dee2e6; padding: 8px 12px; text-align: left; }
            th { background-color: #e9ecef; font-weight: bold; }
            .footer { text-align: center; margin-top: 50px; font-size: 12px; color: #666; }
            .progress-bar { width: 100%; height: 20px; background-color: #e9ecef; border-radius: 10px; overflow: hidden; }
            .progress-fill { height: 100%; background-color: #28a745; }
            @media print { body { margin: 0; } }
        </style>
    </head>
    <body>
        <div class="header">
            <h1>Private Tutoring Progress Report</h1>
            <h2>${student.name} - ${summary.subject_name}</h2>
            <p>Generated on: ${new Date().toLocaleDateString()}</p>
        </div>
        
        <div class="student-info">
            <h3>Student Information</h3>
            <table>
                <tr><td><strong>Name:</strong></td><td>${student.name}</td></tr>
                <tr><td><strong>Grade:</strong></td><td>${student.grade}</td></tr>
                <tr><td><strong>School:</strong></td><td>${student.school || 'N/A'}</td></tr>
                <tr><td><strong>Parent Phone:</strong></td><td>${student.parent_phone || 'N/A'}</td></tr>
                <tr><td><strong>Subject:</strong></td><td>${summary.subject_name}</td></tr>
            </table>
        </div>
        
        <div class="summary">
            <h3>Session Summary</h3>
            <table>
                <tr><td><strong>Total Sessions Applied:</strong></td><td>${summary.applied_sessions}</td></tr>
                <tr><td><strong>Sessions Completed:</strong></td><td>${summary.completed_sessions}</td></tr>
                <tr><td><strong>Sessions Remaining:</strong></td><td>${summary.remaining_sessions}</td></tr>
                <tr><td><strong>Progress:</strong></td><td>
                    <div class="progress-bar">
                        <div class="progress-fill" style="width: ${(summary.completed_sessions / summary.applied_sessions) * 100}%"></div>
                    </div>
                    ${Math.round((summary.completed_sessions / summary.applied_sessions) * 100)}%
                </td></tr>
                <tr><td><strong>Application Date:</strong></td><td>${new Date(summary.application_date).toLocaleDateString()}</td></tr>
            </table>
        </div>
        
        <div class="sessions">
            <h3>Session History</h3>
            <table>
                <thead>
                    <tr>
                        <th>Date</th>
                        <th>Duration</th>
                        <th>Session Notes</th>
                        <th>Homework Assigned</th>
                    </tr>
                </thead>
                <tbody>
                    ${sessions.map(session => `
                        <tr>
                            <td>${new Date(session.start_time).toLocaleDateString()}</td>
                            <td>${session.duration_hours} hours</td>
                            <td>${session.session_notes || 'No notes'}</td>
                            <td>${session.homework_assigned || 'No homework'}</td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        </div>
        
        <div class="footer">
            <p>This report was automatically generated by the Private Tutoring Management System</p>
            <p>Report ID: ${Date.now()}</p>
        </div>
    </body>
    </html>
    `;
  };

  const dismissAlert = async (alertId) => {
    try {
      await privateTutoringAxios.post(`/alerts/${alertId}/dismiss`);
      fetchAlerts(); // Refresh alerts
      showAlert('success', 'Alert dismissed');
    } catch (error) {
      console.error('Error dismissing alert:', error);
      showAlert('danger', 'Failed to dismiss alert');
    }
  };

  // Filter session summary based on filters
  const filteredSummary = sessionSummary.filter(summary => {
    if (filters.student_id && summary.student_id !== parseInt(filters.student_id)) {
      return false;
    }
    if (filters.subject && !summary.subject_name.toLowerCase().includes(filters.subject.toLowerCase())) {
      return false;
    }
    if (filters.status !== 'all') {
      if (filters.status === 'completed' && summary.remaining_sessions > 0) {
        return false;
      }
      if (filters.status === 'active' && summary.remaining_sessions === 0) {
        return false;
      }
      if (filters.status === 'warning' && summary.remaining_sessions > 2) {
        return false;
      }
    }
    return true;
  });

  if (loading) {
    return (
      <div className="d-flex justify-content-center align-items-center" style={{ height: '400px' }}>
        <div className="spinner-border" role="status">
          <span className="sr-only">Loading...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="container-fluid">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2>Reports & Analytics</h2>
        <Button 
          color="info" 
          onClick={() => window.open('/private-tutoring/example-report', '_blank')}
          className="ms-2"
        >
          Example Report
        </Button>
      </div>

      {alert.visible && (
        <Alert color={alert.type} className="mb-4">
          {alert.message}
        </Alert>
      )}

      <Row className="mb-4">
        {/* Filters */}
        <Col md="12">
          <Card>
            <CardHeader>
              <h5>Filters</h5>
            </CardHeader>
            <CardBody>
              <Form>
                <Row>
                  <Col md="3">
                    <FormGroup>
                      <Label for="student_filter">Student</Label>
                      <Input
                        type="select"
                        id="student_filter"
                        value={filters.student_id}
                        onChange={(e) => setFilters({ ...filters, student_id: e.target.value })}
                      >
                        <option value="">All Students</option>
                        {students.map((student) => (
                          <option key={student.student_id} value={student.student_id}>
                            {student.name}
                          </option>
                        ))}
                      </Input>
                    </FormGroup>
                  </Col>
                  <Col md="3">
                    <FormGroup>
                      <Label for="subject_filter">Subject</Label>
                      <Input
                        type="text"
                        id="subject_filter"
                        placeholder="Filter by subject..."
                        value={filters.subject}
                        onChange={(e) => setFilters({ ...filters, subject: e.target.value })}
                      />
                    </FormGroup>
                  </Col>
                  <Col md="3">
                    <FormGroup>
                      <Label for="status_filter">Status</Label>
                      <Input
                        type="select"
                        id="status_filter"
                        value={filters.status}
                        onChange={(e) => setFilters({ ...filters, status: e.target.value })}
                      >
                        <option value="all">All</option>
                        <option value="active">Active</option>
                        <option value="completed">Completed</option>
                        <option value="warning">Near Completion</option>
                      </Input>
                    </FormGroup>
                  </Col>
                  <Col md="3">
                    <FormGroup>
                      <Label>&nbsp;</Label>
                      <div>
                        <Button 
                          color="secondary" 
                          onClick={() => setFilters({ student_id: '', subject: '', status: 'all' })}
                        >
                          Clear Filters
                        </Button>
                      </div>
                    </FormGroup>
                  </Col>
                </Row>
              </Form>
            </CardBody>
          </Card>
        </Col>
      </Row>

      <Row>
        {/* Session Progress Table */}
        <Col md="8">
          <Card>
            <CardHeader>
              <h5>Session Progress Overview ({filteredSummary.length})</h5>
            </CardHeader>
            <CardBody>
              <Table responsive>
                <thead>
                  <tr>
                    <th>Student</th>
                    <th>Subject</th>
                    <th>Progress</th>
                    <th>Sessions</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredSummary.map((summary, index) => (
                    <tr key={index}>
                      <td>
                        <strong>{summary.student_name}</strong>
                        <br />
                        <small className="text-muted">{summary.grade}</small>
                      </td>
                      <td>{summary.subject_name}</td>
                      <td style={{ width: '150px' }}>
                        <div className="progress">
                          <div 
                            className={`progress-bar bg-${getProgressColor(summary.completed_sessions, summary.applied_sessions)}`}
                            role="progressbar"
                            style={{ width: `${(summary.completed_sessions / summary.applied_sessions) * 100}%` }}
                          />
                        </div>
                        <small>
                          {Math.round((summary.completed_sessions / summary.applied_sessions) * 100)}%
                        </small>
                      </td>
                      <td>
                        {summary.completed_sessions} / {summary.applied_sessions}
                      </td>
                      <td>
                        <Badge color={getStatusBadgeColor(summary.remaining_sessions)}>
                          {summary.remaining_sessions === 0 ? 'Complete' : 
                           summary.remaining_sessions <= 2 ? 'Near Complete' : 'Active'}
                        </Badge>
                      </td>
                      <td>
                        <Button
                          size="sm"
                          color={canGenerateReport(summary) ? 'success' : 'secondary'}
                          disabled={!canGenerateReport(summary)}
                          onClick={() => generateReport(summary.student_id, summary.subject_name)}
                        >
                          {canGenerateReport(summary) ? 'Generate Report' : 'In Progress'}
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </Table>
            </CardBody>
          </Card>
        </Col>

        {/* Active Alerts */}
        <Col md="4">
          <Card>
            <CardHeader>
              <h5>Active Alerts ({alerts.length})</h5>
            </CardHeader>
            <CardBody>
              {alerts.length === 0 ? (
                <Alert color="success">No active alerts</Alert>
              ) : (
                alerts.map((alertItem, index) => (
                  <Alert 
                    key={index} 
                    color={getAlertBadgeColor(alertItem.alert_type)}
                    className="d-flex justify-content-between align-items-start"
                  >
                    <div>
                      <Badge color={getAlertBadgeColor(alertItem.alert_type)} className="mb-2">
                        {alertItem.alert_type.replace('_', ' ').toUpperCase()}
                      </Badge>
                      <div>
                        <strong>{alertItem.student_name}</strong> - {alertItem.subject_name}
                      </div>
                      <small>{alertItem.message}</small>
                      <br />
                      <small className="text-muted">
                        {new Date(alertItem.created_at).toLocaleDateString()}
                      </small>
                    </div>
                    <Button 
                      size="sm" 
                      color="light"
                      onClick={() => dismissAlert(alertItem.alert_id)}
                    >
                      ×
                    </Button>
                  </Alert>
                ))
              )}
            </CardBody>
          </Card>
        </Col>
      </Row>

      {/* Report Preview Modal */}
      <Modal isOpen={showReportModal} toggle={() => setShowReportModal(false)} size="xl">
        <ModalHeader toggle={() => setShowReportModal(false)}>
          Report Preview - {selectedStudent?.name}
        </ModalHeader>
        <ModalBody>
          {reportData && (
            <div>
              <Alert color="info">
                This is a preview of the report that will be generated. Click "Download PDF" to save or print.
              </Alert>
              
              <h5>Student Information</h5>
              <Table bordered>
                <tbody>
                  <tr>
                    <td><strong>Name:</strong></td>
                    <td>{reportData.student.name}</td>
                    <td><strong>Grade:</strong></td>
                    <td>{reportData.student.grade}</td>
                  </tr>
                  <tr>
                    <td><strong>School:</strong></td>
                    <td>{reportData.student.school || 'N/A'}</td>
                    <td><strong>Subject:</strong></td>
                    <td>{reportData.summary.subject_name}</td>
                  </tr>
                </tbody>
              </Table>

              <h5>Session Summary</h5>
              <Table bordered>
                <tbody>
                  <tr>
                    <td><strong>Total Sessions:</strong></td>
                    <td>{reportData.summary.applied_sessions}</td>
                    <td><strong>Completed:</strong></td>
                    <td>{reportData.summary.completed_sessions}</td>
                  </tr>
                  <tr>
                    <td><strong>Remaining:</strong></td>
                    <td>{reportData.summary.remaining_sessions}</td>
                    <td><strong>Progress:</strong></td>
                    <td>{Math.round((reportData.summary.completed_sessions / reportData.summary.applied_sessions) * 100)}%</td>
                  </tr>
                </tbody>
              </Table>

              <h5>Recent Sessions</h5>
              <Table striped bordered>
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Duration</th>
                    <th>Notes</th>
                    <th>Homework</th>
                  </tr>
                </thead>
                <tbody>
                  {reportData.sessions?.slice(0, 5).map((session, index) => (
                    <tr key={index}>
                      <td>{new Date(session.start_time).toLocaleDateString()}</td>
                      <td>{session.duration_hours} hours</td>
                      <td>{session.session_notes || 'No notes'}</td>
                      <td>{session.homework_assigned || 'No homework'}</td>
                    </tr>
                  )) || (
                    <tr>
                      <td colSpan="4" className="text-center">No session data available</td>
                    </tr>
                  )}
                </tbody>
              </Table>
            </div>
          )}
        </ModalBody>
        <ModalFooter>
          <Button color="primary" onClick={downloadPDF}>
            Download PDF
          </Button>
          <Button color="secondary" onClick={() => setShowReportModal(false)}>
            Close
          </Button>
        </ModalFooter>
      </Modal>
    </div>
  );
};

export default Reports;
