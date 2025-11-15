import React, { useState, useEffect } from 'react';
import {
  Card,
  CardBody,
  CardHeader,
  Button,
  Form,
  FormGroup,
  Label,
  Input,
  Row,
  Col,
  Alert,
  Modal,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Table,
  Badge,
  Nav,
  NavItem,
  NavLink,
  TabContent,
  TabPane
} from 'reactstrap';
import axios from 'axios';
import privateTutoringAxios from '../../utils/privateTutoringAxios';

const ScheduleManager = () => {
  const [students, setStudents] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [applications, setApplications] = useState([]);
  const [schedules, setSchedules] = useState([]);
  const [todaysSchedules, setTodaysSchedules] = useState([]);
  const [loading, setLoading] = useState(true);
  const [alert, setAlert] = useState({ type: '', message: '', visible: false });
  const [activeTab, setActiveTab] = useState('today');
  
  // Schedule form state
  const [showModal, setShowModal] = useState(false);
  const [editingSchedule, setEditingSchedule] = useState(null);
  const [scheduleForm, setScheduleForm] = useState({
    application_id: '',
    student_id: '',
    teacher_id: '',
    subject_id: '',
    scheduled_time: '',
    scheduled_duration: 1.0,
    status: 'scheduled',
    notes: ''
  });

  // Date filter state
  const [dateFilter, setDateFilter] = useState({
    start_date: new Date().toISOString().split('T')[0],
    end_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
  });

  const durationOptions = [
    { value: 0.5, label: '30 minutes' },
    { value: 1.0, label: '1 hour' },
    { value: 1.5, label: '1 hour 30 minutes' },
    { value: 2.0, label: '2 hours' }
  ];

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    if (activeTab === 'upcoming') {
      fetchSchedules();
    }
  }, [dateFilter, activeTab]);

  const fetchData = async () => {
    try {
      await Promise.all([
        fetchStudents(),
        fetchSubjects(),
        fetchTeachers(),
        fetchApplications(),
        fetchTodaysSchedules()
      ]);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching data:', error);
      setLoading(false);
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

  const fetchSubjects = async () => {
    try {
      const response = await privateTutoringAxios.get('/subjects');
      setSubjects(response.data);
    } catch (error) {
      console.error('Error fetching subjects:', error);
    }
  };

  const fetchTeachers = async () => {
    try {
      const response = await privateTutoringAxios.get('/teachers');
      setTeachers(response.data);
    } catch (error) {
      console.error('Error fetching teachers:', error);
    }
  };

  const fetchApplications = async () => {
    try {
      const response = await privateTutoringAxios.get('/sessions/applications');
      setApplications(response.data);
    } catch (error) {
      console.error('Error fetching applications:', error);
    }
  };

  const fetchTodaysSchedules = async () => {
    try {
      const response = await privateTutoringAxios.get('/schedules/today');
      setTodaysSchedules(response.data);
    } catch (error) {
      console.error('Error fetching today\'s schedules:', error);
    }
  };

  const fetchSchedules = async () => {
    try {
      const params = new URLSearchParams({
        start_date: dateFilter.start_date,
        end_date: dateFilter.end_date
      });
      const response = await privateTutoringAxios.get(`/schedules?${params}`);
      setSchedules(response.data);
    } catch (error) {
      console.error('Error fetching schedules:', error);
    }
  };

  const showAlert = (type, message) => {
    setAlert({ type, message, visible: true });
    setTimeout(() => setAlert({ ...alert, visible: false }), 5000);
  };

  const openModal = (schedule = null) => {
    if (schedule) {
      setEditingSchedule(schedule.schedule_id);
      const scheduledDate = new Date(schedule.scheduled_time);
      setScheduleForm({
        application_id: schedule.application_id,
        student_id: schedule.student_id,
        teacher_id: schedule.teacher_id,
        subject_id: schedule.subject_id,
        scheduled_time: scheduledDate.toISOString().slice(0, 16),
        scheduled_duration: schedule.scheduled_duration,
        status: schedule.status,
        notes: schedule.notes || ''
      });
    } else {
      setEditingSchedule(null);
      const now = new Date();
      const defaultTime = new Date(now.getTime() + 60 * 60 * 1000); // +1 hour from now
      setScheduleForm({
        application_id: '',
        student_id: '',
        teacher_id: '',
        subject_id: '',
        scheduled_time: defaultTime.toISOString().slice(0, 16),
        scheduled_duration: 1.0,
        status: 'scheduled',
        notes: ''
      });
    }
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingSchedule(null);
  };

  // Helper function to convert local time to MySQL datetime format (KST)
  const toKSTISOString = (dateTimeString) => {
    const date = new Date(dateTimeString);
    // Convert to KST (UTC+9)
    const kstOffset = 9 * 60; // 9 hours in minutes
    const utc = date.getTime() + (date.getTimezoneOffset() * 60000);
    const kst = new Date(utc + (kstOffset * 60000));
    
    // Format as MySQL datetime (YYYY-MM-DD HH:MM:SS)
    const year = kst.getFullYear();
    const month = String(kst.getMonth() + 1).padStart(2, '0');
    const day = String(kst.getDate()).padStart(2, '0');
    const hours = String(kst.getHours()).padStart(2, '0');
    const minutes = String(kst.getMinutes()).padStart(2, '0');
    const seconds = String(kst.getSeconds()).padStart(2, '0');
    
    return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const scheduleData = {
        ...scheduleForm,
        application_id: parseInt(scheduleForm.application_id),
        student_id: parseInt(scheduleForm.student_id),
        teacher_id: parseInt(scheduleForm.teacher_id),
        subject_id: parseInt(scheduleForm.subject_id),
        scheduled_duration: parseFloat(scheduleForm.scheduled_duration),
        scheduled_time: toKSTISOString(scheduleForm.scheduled_time)
      };

      if (editingSchedule) {
        await privateTutoringAxios.put(`/schedules/${editingSchedule}`, scheduleData);
        showAlert('success', 'Schedule updated successfully');
      } else {
        await privateTutoringAxios.post('/schedules', scheduleData);
        showAlert('success', 'Schedule created successfully');
      }

      closeModal();
      
      // Refresh data based on active tab
      if (activeTab === 'today') {
        fetchTodaysSchedules();
      } else {
        fetchSchedules();
      }
    } catch (error) {
      console.error('Error saving schedule:', error);
      showAlert('danger', error.response?.data?.error || 'Failed to save schedule');
    }
  };

  const handleDelete = async (scheduleId) => {
    if (window.confirm('Are you sure you want to delete this schedule?')) {
      try {
        await privateTutoringAxios.delete(`/schedules/${scheduleId}`);
        showAlert('success', 'Schedule deleted successfully');
        
        // Refresh data
        if (activeTab === 'today') {
          fetchTodaysSchedules();
        } else {
          fetchSchedules();
        }
      } catch (error) {
        console.error('Error deleting schedule:', error);
        showAlert('danger', 'Failed to delete schedule');
      }
    }
  };

  const startSessionFromSchedule = async (schedule) => {
    try {
      const sessionData = {
        application_id: schedule.application_id,
        schedule_id: schedule.schedule_id,
        student_id: schedule.student_id,
        teacher_id: schedule.teacher_id,
        subject_id: schedule.subject_id,
        session_datetime: schedule.scheduled_time,
        duration_hours: schedule.scheduled_duration,
        notes: `Started from scheduled session: ${schedule.notes || ''}`
      };

      await privateTutoringAxios.post('/sessions', sessionData);
      
      // Mark schedule as completed
      await privateTutoringAxios.put(`/schedules/${schedule.schedule_id}`, {
        ...schedule,
        status: 'completed'
      });

      showAlert('success', 'Session started from schedule!');
      
      // Refresh data
      if (activeTab === 'today') {
        fetchTodaysSchedules();
      } else {
        fetchSchedules();
      }
    } catch (error) {
      console.error('Error starting session from schedule:', error);
      showAlert('danger', 'Failed to start session');
    }
  };

  const getSelectedStudent = () => {
    if (!scheduleForm.student_id) return null;
    return students.find(s => s.student_id === parseInt(scheduleForm.student_id));
  };

  const getStudentApplications = () => {
    const student = getSelectedStudent();
    if (!student) return [];
    return applications.filter(app => app.student_id === parseInt(scheduleForm.student_id) && app.status === 'active');
  };

  const getSelectedApplication = () => {
    if (!scheduleForm.application_id) return null;
    return applications.find(app => app.application_id === parseInt(scheduleForm.application_id));
  };

  const getApplicationSubjects = () => {
    const application = getSelectedApplication();
    if (!application) return [];
    return subjects.filter(subject => subject.subject_id === application.subject_id);
  };

  const getStudentSubjectsWithSessions = () => {
    const student = getSelectedStudent();
    if (!student) return [];
    
    // Get all applications for this student with remaining sessions
    const studentApps = applications.filter(app => 
      app.student_id === parseInt(scheduleForm.student_id) && 
      app.status === 'active'
    );
    
    // Group by subject and calculate remaining sessions
    const subjectMap = {};
    studentApps.forEach(app => {
      const subjectId = app.subject_id;
      const subjectName = app.subject_name;
      const remainingSessions = app.remaining_sessions || 0;
      
      if (!subjectMap[subjectId]) {
        subjectMap[subjectId] = {
          subject_id: subjectId,
          subject_name: subjectName,
          remaining_sessions: 0,
          applications: []
        };
      }
      
      subjectMap[subjectId].remaining_sessions += remainingSessions;
      subjectMap[subjectId].applications.push(app);
    });
    
    return Object.values(subjectMap).sort((a, b) => a.subject_name.localeCompare(b.subject_name));
  };

  const getApplicationForSubject = (subjectId) => {
    const studentApps = applications.filter(app => 
      app.student_id === parseInt(scheduleForm.student_id) && 
      app.subject_id === parseInt(subjectId) &&
      app.status === 'active' &&
      (app.remaining_sessions || 0) > 0
    );
    
    // Return the first application with remaining sessions
    return studentApps.length > 0 ? studentApps[0] : null;
  };

  const getStatusBadgeColor = (status) => {
    switch (status) {
      case 'scheduled':
        return 'primary';
      case 'completed':
        return 'success';
      case 'cancelled':
        return 'danger';
      default:
        return 'secondary';
    }
  };

  const isScheduleOverdue = (scheduledTime) => {
    return new Date(scheduledTime) < new Date();
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
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2>Schedule Management</h2>
        <Button color="primary" onClick={() => openModal()}>
          Create New Schedule
        </Button>
      </div>

      {alert.visible && (
        <Alert color={alert.type} className="mb-4">
          {alert.message}
        </Alert>
      )}

      {/* Navigation Tabs */}
      <Nav tabs className="mb-4">
        <NavItem>
          <NavLink
            className={activeTab === 'today' ? 'active' : ''}
            onClick={() => setActiveTab('today')}
            style={{ cursor: 'pointer' }}
          >
            Today's Schedule ({todaysSchedules.length})
          </NavLink>
        </NavItem>
        <NavItem>
          <NavLink
            className={activeTab === 'upcoming' ? 'active' : ''}
            onClick={() => setActiveTab('upcoming')}
            style={{ cursor: 'pointer' }}
          >
            Upcoming Schedule
          </NavLink>
        </NavItem>
      </Nav>

      <TabContent activeTab={activeTab}>
        {/* Today's Schedule Tab */}
        <TabPane tabId="today">
          <Card>
            <CardHeader>
              <h5>Today's Schedule - {new Date().toLocaleDateString()}</h5>
            </CardHeader>
            <CardBody>
              {todaysSchedules.length === 0 ? (
                <Alert color="info">No schedules for today</Alert>
              ) : (
                <Table responsive>
                  <thead>
                    <tr>
                      <th>Time</th>
                      <th>Student</th>
                      <th>Teacher</th>
                      <th>Subject</th>
                      <th>Duration</th>
                      <th>Status</th>
                      <th>Notes</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {todaysSchedules.map((schedule) => (
                      <tr 
                        key={schedule.schedule_id}
                        className={isScheduleOverdue(schedule.scheduled_time) && schedule.status === 'scheduled' ? 'table-warning' : ''}
                      >
                        <td>
                          <strong>{new Date(schedule.scheduled_time).toLocaleTimeString()}</strong>
                          {isScheduleOverdue(schedule.scheduled_time) && schedule.status === 'scheduled' && (
                            <Badge color="warning" className="ms-1">Overdue</Badge>
                          )}
                        </td>
                        <td>
                          <strong>{schedule.student_name}</strong>
                          <br />
                          <small className="text-muted">{schedule.grade}</small>
                        </td>
                        <td>
                          <strong>{schedule.teacher_name}</strong>
                        </td>
                        <td>{schedule.subject_name}</td>
                        <td>{schedule.scheduled_duration} hours</td>
                        <td>
                          <Badge color={getStatusBadgeColor(schedule.status)}>
                            {schedule.status}
                          </Badge>
                        </td>
                        <td>{schedule.notes || 'No notes'}</td>
                        <td>
                          {schedule.status === 'scheduled' && (
                            <>
                              <Button
                                size="sm"
                                color="success"
                                className="me-1 mb-1"
                                onClick={() => startSessionFromSchedule(schedule)}
                              >
                                Start Session
                              </Button>
                              <Button
                                size="sm"
                                color="primary"
                                className="me-1 mb-1"
                                onClick={() => openModal(schedule)}
                              >
                                Edit
                              </Button>
                            </>
                          )}
                          <Button
                            size="sm"
                            color="danger"
                            className="mb-1"
                            onClick={() => handleDelete(schedule.schedule_id)}
                          >
                            Delete
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </Table>
              )}
            </CardBody>
          </Card>
        </TabPane>

        {/* Upcoming Schedule Tab */}
        <TabPane tabId="upcoming">
          <Card className="mb-4">
            <CardBody>
              <Row>
                <Col md="4">
                  <FormGroup>
                    <Label for="start_date">Start Date</Label>
                    <Input
                      type="date"
                      id="start_date"
                      value={dateFilter.start_date}
                      onChange={(e) => setDateFilter({ ...dateFilter, start_date: e.target.value })}
                    />
                  </FormGroup>
                </Col>
                <Col md="4">
                  <FormGroup>
                    <Label for="end_date">End Date</Label>
                    <Input
                      type="date"
                      id="end_date"
                      value={dateFilter.end_date}
                      onChange={(e) => setDateFilter({ ...dateFilter, end_date: e.target.value })}
                    />
                  </FormGroup>
                </Col>
                <Col md="4">
                  <FormGroup>
                    <Label>&nbsp;</Label>
                    <div>
                      <Button color="primary" onClick={fetchSchedules}>
                        Apply Filter
                      </Button>
                    </div>
                  </FormGroup>
                </Col>
              </Row>
            </CardBody>
          </Card>

          <Card>
            <CardHeader>
              <h5>Upcoming Schedules ({schedules.length})</h5>
            </CardHeader>
            <CardBody>
              {schedules.length === 0 ? (
                <Alert color="info">No upcoming schedules found</Alert>
              ) : (
                <Table responsive>
                  <thead>
                    <tr>
                      <th>Date & Time</th>
                      <th>Student</th>
                      <th>Teacher</th>
                      <th>Subject</th>
                      <th>Duration</th>
                      <th>Status</th>
                      <th>Notes</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {schedules.map((schedule) => (
                      <tr key={schedule.schedule_id}>
                        <td>
                          <strong>{new Date(schedule.scheduled_time).toLocaleDateString()}</strong>
                          <br />
                          {new Date(schedule.scheduled_time).toLocaleTimeString()}
                        </td>
                        <td>
                          <strong>{schedule.student_name}</strong>
                          <br />
                          <small className="text-muted">{schedule.grade}</small>
                        </td>
                        <td>
                          <strong>{schedule.teacher_name}</strong>
                        </td>
                        <td>{schedule.subject_name}</td>
                        <td>{schedule.scheduled_duration} hours</td>
                        <td>
                          <Badge color={getStatusBadgeColor(schedule.status)}>
                            {schedule.status}
                          </Badge>
                        </td>
                        <td>{schedule.notes || 'No notes'}</td>
                        <td>
                          {schedule.status === 'scheduled' && (
                            <Button
                              size="sm"
                              color="primary"
                              className="me-1 mb-1"
                              onClick={() => openModal(schedule)}
                            >
                              Edit
                            </Button>
                          )}
                          <Button
                            size="sm"
                            color="danger"
                            className="mb-1"
                            onClick={() => handleDelete(schedule.schedule_id)}
                          >
                            Delete
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </Table>
              )}
            </CardBody>
          </Card>
        </TabPane>
      </TabContent>

      {/* Schedule Modal */}
      <Modal isOpen={showModal} toggle={closeModal} size="lg">
        <ModalHeader toggle={closeModal}>
          {editingSchedule ? 'Edit Schedule' : 'Create New Schedule'}
        </ModalHeader>
        <Form onSubmit={handleSubmit}>
          <ModalBody>
            <Row>
              <Col md="6">
                <FormGroup>
                  <Label for="student_id">Student *</Label>
                  <Input
                    type="select"
                    id="student_id"
                    value={scheduleForm.student_id}
                    onChange={(e) => setScheduleForm({ ...scheduleForm, student_id: e.target.value, application_id: '', subject_id: '' })}
                    required
                  >
                    <option value="">Select Student</option>
                    {students.map((student) => (
                      <option key={student.student_id} value={student.student_id}>
                        {student.name} - {student.grade}
                      </option>
                    ))}
                  </Input>
                </FormGroup>
              </Col>
              <Col md="6">
                <FormGroup>
                  <Label for="subject_id">Subject *</Label>
                  <Input
                    type="select"
                    id="subject_id"
                    value={scheduleForm.subject_id}
                    onChange={(e) => {
                      const subjectId = e.target.value;
                      const application = getApplicationForSubject(subjectId);
                      setScheduleForm({ 
                        ...scheduleForm, 
                        subject_id: subjectId,
                        application_id: application ? application.application_id : ''
                      });
                    }}
                    required
                    disabled={!scheduleForm.student_id}
                  >
                    <option value="">Select Subject</option>
                    {getStudentSubjectsWithSessions().map((subject) => (
                      <option 
                        key={subject.subject_id} 
                        value={subject.subject_id}
                        style={{ color: subject.remaining_sessions <= 0 ? 'red' : 'inherit' }}
                      >
                        {subject.subject_name} - {subject.remaining_sessions} sessions remaining
                      </option>
                    ))}
                  </Input>
                </FormGroup>
              </Col>
            </Row>

            <Row>
              <Col md="6">
                <FormGroup>
                  <Label for="teacher_id">Teacher *</Label>
                  <Input
                    type="select"
                    id="teacher_id"
                    value={scheduleForm.teacher_id}
                    onChange={(e) => setScheduleForm({ ...scheduleForm, teacher_id: e.target.value })}
                    required
                  >
                    <option value="">Select Teacher</option>
                    {teachers.map((teacher) => (
                      <option key={teacher.teacher_id} value={teacher.teacher_id}>
                        {teacher.name}
                      </option>
                    ))}
                  </Input>
                </FormGroup>
              </Col>
            </Row>

            <Row>
              <Col md="6">
                <FormGroup>
                  <Label for="scheduled_time">Scheduled Time *</Label>
                  <Input
                    type="datetime-local"
                    id="scheduled_time"
                    value={scheduleForm.scheduled_time}
                    onChange={(e) => setScheduleForm({ ...scheduleForm, scheduled_time: e.target.value })}
                    required
                  />
                </FormGroup>
              </Col>
              <Col md="6">
                <FormGroup>
                  <Label for="scheduled_duration">Duration *</Label>
                  <Input
                    type="select"
                    id="scheduled_duration"
                    value={scheduleForm.scheduled_duration}
                    onChange={(e) => setScheduleForm({ ...scheduleForm, scheduled_duration: parseFloat(e.target.value) })}
                    required
                  >
                    {durationOptions.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </Input>
                </FormGroup>
              </Col>
            </Row>

            <Row>
              <Col md="6">
                <FormGroup>
                  <Label for="status">Status *</Label>
                  <Input
                    type="select"
                    id="status"
                    value={scheduleForm.status}
                    onChange={(e) => setScheduleForm({ ...scheduleForm, status: e.target.value })}
                    required
                  >
                    <option value="scheduled">Scheduled</option>
                    <option value="cancelled">Cancelled</option>
                    <option value="completed">Completed</option>
                  </Input>
                </FormGroup>
              </Col>
              <Col md="6">
                <FormGroup>
                  <Label for="notes">Notes</Label>
                  <Input
                    type="textarea"
                    id="notes"
                    value={scheduleForm.notes}
                    onChange={(e) => setScheduleForm({ ...scheduleForm, notes: e.target.value })}
                    rows="3"
                  />
                </FormGroup>
              </Col>
            </Row>

          </ModalBody>
          <ModalFooter>
            <Button type="submit" color="primary">
              {editingSchedule ? 'Update' : 'Create'} Schedule
            </Button>
            <Button type="button" color="secondary" onClick={closeModal}>
              Cancel
            </Button>
          </ModalFooter>
        </Form>
      </Modal>
    </div>
  );
};

export default ScheduleManager;