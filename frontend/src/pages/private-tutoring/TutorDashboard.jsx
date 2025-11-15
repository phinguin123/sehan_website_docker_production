import React, { useState, useEffect } from 'react';
import { Card, CardBody, CardHeader, Button, Row, Col, Badge } from 'reactstrap';
import axios from 'axios';

const TutorDashboard = () => {
  const [dashboardData, setDashboardData] = useState({
    active_sessions: 0,
    today_sessions: 0,
    upcoming_sessions: 0,
    total_students: 0
  });

  const [activeSessions, setActiveSessions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
    fetchActiveSessions();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const response = await axios.get('/api/private_tutor/dashboard');
      setDashboardData(response.data);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    }
  };

  const fetchActiveSessions = async () => {
    try {
      const response = await axios.get('/api/private_tutor/sessions/active');
      setActiveSessions(response.data);
    } catch (error) {
      console.error('Error fetching active sessions:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <div className="container-fluid">
      <h2 className="mb-4">Private Tutoring Dashboard</h2>
      
      {/* Statistics Cards */}
      <Row className="mb-4">
        <Col md={3}>
          <Card className="text-center">
            <CardBody>
              <h3 className="text-primary">{dashboardData.active_sessions}</h3>
              <p className="mb-0">Active Sessions</p>
            </CardBody>
          </Card>
        </Col>
        <Col md={3}>
          <Card className="text-center">
            <CardBody>
              <h3 className="text-success">{dashboardData.today_sessions}</h3>
              <p className="mb-0">Today's Sessions</p>
            </CardBody>
          </Card>
        </Col>
        <Col md={3}>
          <Card className="text-center">
            <CardBody>
              <h3 className="text-warning">{dashboardData.upcoming_sessions}</h3>
              <p className="mb-0">Upcoming Sessions</p>
            </CardBody>
          </Card>
        </Col>
        <Col md={3}>
          <Card className="text-center">
            <CardBody>
              <h3 className="text-info">{dashboardData.total_students}</h3>
              <p className="mb-0">Total Students</p>
            </CardBody>
          </Card>
        </Col>
      </Row>

      {/* Active Sessions */}
      <Row>
        <Col md={8}>
          <Card>
            <CardHeader>
              <h5>Active Sessions</h5>
            </CardHeader>
            <CardBody>
              {activeSessions.length > 0 ? (
                activeSessions.map(session => (
                  <div key={session.session_id} className="d-flex justify-content-between align-items-center mb-2 p-2 border rounded">
                    <div>
                      <strong>{session.student_name}</strong> - {session.subject}
                      <br />
                      <small className="text-muted">Started: {new Date(session.start_time).toLocaleTimeString()}</small>
                    </div>
                    <Badge color="success">Active</Badge>
                  </div>
                ))
              ) : (
                <p className="text-muted">No active sessions</p>
              )}
            </CardBody>
          </Card>
        </Col>
        
        <Col md={4}>
          <Card>
            <CardHeader>
              <h5>Quick Actions</h5>
            </CardHeader>
            <CardBody>
              <div className="d-grid gap-2">
                <Button color="primary" href="/private_tutor/sessions">
                  Start New Session
                </Button>
                <Button color="secondary" href="/private_tutor/schedule">
                  View Schedule
                </Button>
                <Button color="info" href="/private_tutor/students">
                  Manage Students
                </Button>
              </div>
            </CardBody>
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default TutorDashboard;
