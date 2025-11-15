import React, { useState, useEffect } from 'react';
import {
  Card,
  CardBody,
  CardHeader,
  Row,
  Col,
  Alert,
  Badge,
  Table,
  Button,
  Modal,
  ModalHeader,
  ModalBody,
  ModalFooter
} from 'reactstrap';
import { CChartLine, CChartDoughnut } from '@coreui/react-chartjs';
import axios from 'axios';
import privateTutoringAxios from '../../utils/privateTutoringAxios';

const Dashboard = () => {
  console.log('Private Tutoring Dashboard rendering...');
  
  const [stats, setStats] = useState({
    total_students: 0,
    active_sessions: 0,
    active_alerts: 0,
    session_summary: [],
    students: [],
    alerts: []
  });
  const [loading, setLoading] = useState(true);
  const [selectedAlert, setSelectedAlert] = useState(null);
  const [showAlertModal, setShowAlertModal] = useState(false);

  useEffect(() => {
    fetchDashboardStats();
  }, []);

  const fetchDashboardStats = async () => {
    try {
      const [studentsRes, progressRes, alertsRes] = await Promise.all([
        privateTutoringAxios.get('/students'),
        privateTutoringAxios.get('/students/progress'),
        privateTutoringAxios.get('/alerts')
      ]);

      const students = studentsRes.data || [];
      const progress = progressRes.data || [];
      // Near complete: remaining_sessions == 1
      const sessionSummary = progress.map(p => ({
        student_name: students.find(s => s.student_id === p.student_id)?.name || 'Unknown',
        subject_name: p.subject_name,
        completed_sessions: p.completed_sessions,
        applied_sessions: p.applied_sessions,
        remaining_sessions: p.remaining_sessions
      }));

      // Alerts: include all session warning alerts (remaining hours ≤ 1)
      const rawAlerts = alertsRes.data || [];
      const alerts = rawAlerts.filter(a => a.alert_type === 'sessions_warning');

      const activeSessions = sessionSummary.filter(s => s.remaining_sessions > 0).length;

      setStats({
        total_students: students.length,
        active_sessions: activeSessions,
        active_alerts: alerts.length,
        session_summary: sessionSummary,
        students: students,
        alerts: alerts
      });
      setLoading(false);
    } catch (error) {
      console.error('Error fetching dashboard stats:', error);
      setLoading(false);
    }
  };

  const handleAlertClick = (alert) => {
    setSelectedAlert(alert);
    setShowAlertModal(true);
  };

  // Removing dismiss functionality per requirements

  const getProgressColor = (completed, total) => {
    const percentage = (completed / total) * 100;
    if (percentage >= 90) return 'danger';
    if (percentage >= 70) return 'warning';
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
      <h2 className="mb-4">Private Tutoring Dashboard</h2>
      
      {/* Quick Stats Cards */}
      <Row className="mb-4">
        <Col md="3">
          <Card className="bg-primary text-white">
            <CardBody className="text-center">
              <h3>{stats.total_students}</h3>
              <p className="mb-0">Total Students</p>
            </CardBody>
          </Card>
        </Col>
        <Col md="3">
          <Card className="bg-success text-white">
            <CardBody className="text-center">
              <h3>{stats.active_sessions}</h3>
              <p className="mb-0">Active Sessions</p>
            </CardBody>
          </Card>
        </Col>
        <Col md="3">
          <Card className="bg-warning text-white">
            <CardBody className="text-center">
              <h3>{stats.active_alerts}</h3>
              <p className="mb-0">Active Alerts</p>
            </CardBody>
          </Card>
        </Col>
        <Col md="3">
          <Card className="bg-info text-white">
            <CardBody className="text-center">
              <h3>{stats.session_summary.length}</h3>
              <p className="mb-0">Subject Programs</p>
            </CardBody>
          </Card>
        </Col>
      </Row>

      <Row>
        {/* Hour Progress Overview */}
        <Col md="8">
          <Card>
            <CardHeader>
              <h5>Hour Progress Overview</h5>
            </CardHeader>
            <CardBody>
              <Table responsive>
                <thead>
                  <tr>
                    <th>Student</th>
                    <th>Subject</th>
                    <th>Progress</th>
                    <th>Hours</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {stats.session_summary.slice(0, 10).map((summary, index) => (
                    <tr key={index}>
                      <td>{summary.student_name}</td>
                      <td>{summary.subject_name}</td>
                      <td>
                        <div className="progress">
                          <div 
                            className={`progress-bar bg-${getProgressColor(summary.completed_sessions, summary.applied_sessions)}`}
                            role="progressbar"
                            style={{ width: `${(summary.completed_sessions / summary.applied_sessions) * 100}%` }}
                          />
                        </div>
                      </td>
                      <td>
                        {summary.completed_sessions} / {summary.applied_sessions}
                      </td>
                      <td>
                        <Badge 
                          color={summary.remaining_sessions === 0 ? 'danger' : 
                                 (summary.remaining_sessions > 0 && summary.remaining_sessions <= 1 ? 'warning' : 'success')}
                        >
                          {summary.remaining_sessions === 0 ? 'Complete' : 
                           (summary.remaining_sessions > 0 && summary.remaining_sessions <= 1 ? 'Near Complete' : 'Active')}
                        </Badge>
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
              <h5>Active Alerts</h5>
            </CardHeader>
            <CardBody>
              {stats.alerts.length === 0 ? (
                <Alert color="success">No active alerts</Alert>
              ) : (
                stats.alerts.map((alert, index) => (
                  <Alert 
                    key={index} 
                    color={getAlertBadgeColor(alert.alert_type)}
                    className="d-flex justify-content-between align-items-center"
                  >
                    <div 
                      style={{ cursor: 'pointer' }}
                      onClick={() => handleAlertClick(alert)}
                    >
                      <Badge color={getAlertBadgeColor(alert.alert_type)} className="me-2">
                        {alert.alert_type.replace('_', ' ').toUpperCase()}
                      </Badge>
                      <small>{alert.student_name} - {alert.subject_name}</small>
                    </div>
                    {/* Remove delete (X) per requirement */}
                  </Alert>
                ))
              )}
            </CardBody>
          </Card>

          {/* Recent Students */}
          <Card className="mt-3">
            <CardHeader>
              <h5>Recent Students</h5>
            </CardHeader>
            <CardBody>
              {stats.students.length === 0 ? (
                <p className="text-muted">No students found</p>
              ) : (
                <div>
                  {stats.students.map((student, index) => (
                    <div key={index} className="d-flex justify-content-between align-items-center mb-2 p-2 border-bottom">
                      <div>
                        <strong>{student.name}</strong>
                        <br />
                        <small className="text-muted">{student.grade} • {student.school}</small>
                      </div>
                      <Badge color="primary">{student.subjects?.length || 0} subjects</Badge>
                    </div>
                  ))}
                </div>
              )}
            </CardBody>
          </Card>
        </Col>
      </Row>

      {/* Alert Detail Modal */}
      <Modal isOpen={showAlertModal} toggle={() => setShowAlertModal(false)}>
        <ModalHeader toggle={() => setShowAlertModal(false)}>
          Alert Details
        </ModalHeader>
        <ModalBody>
          {selectedAlert && (
            <div>
              <h6>
                <Badge color={getAlertBadgeColor(selectedAlert.alert_type)}>
                  {selectedAlert.alert_type.replace('_', ' ').toUpperCase()}
                </Badge>
              </h6>
              <p><strong>Student:</strong> {selectedAlert.student_name}</p>
              <p><strong>Subject:</strong> {selectedAlert.subject_name}</p>
              <p><strong>Message:</strong> {selectedAlert.message}</p>
              <p><strong>Created:</strong> {new Date(selectedAlert.created_at).toLocaleString()}</p>
            </div>
          )}
        </ModalBody>
        <ModalFooter>
          {/* Dismiss disabled per requirement */}
          <Button color="secondary" onClick={() => setShowAlertModal(false)}>
            Close
          </Button>
        </ModalFooter>
      </Modal>
    </div>
  );
};

export default Dashboard;
