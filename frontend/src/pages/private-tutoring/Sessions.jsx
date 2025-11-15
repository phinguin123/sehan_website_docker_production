import React, { useState, useEffect } from 'react';
import {
  Container,
  Row,
  Col,
  CardBody,
  Input,
  Alert,
  Spinner,
  Modal,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Form,
  FormGroup,
  Label,
} from 'reactstrap';
import { 
  Calendar, 
  Search,  
  BookOpen, 
  Edit, 
  History,
  RefreshCw
} from 'lucide-react';
import privateTutoringAxios from '../../utils/privateTutoringAxios';
import { Card, CardHeader  } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { SessionCard } from "@/components/private-tutoring/SessionCard"

const Sessions = () => {
  const [sessions, setSessions] = useState([]);
  const [filteredSessions, setFilteredSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterDate, setFilterDate] = useState('');
  const [filterStudent, setFilterStudent] = useState('');
  const [filterMonth, setFilterMonth] = useState('');
  const [filterTeacher, setFilterTeacher] = useState('');
  const [alert, setAlert] = useState({ type: '', message: '', visible: false });
  const [teachers, setTeachers] = useState([]);
  const [totalHours, setTotalHours] = useState(0);
  const [expandedSessions, setExpandedSessions] = useState(new Set());
  const [sessionHistory, setSessionHistory] = useState({});
  
  // Modal state for session details
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedSession, setSelectedSession] = useState(null);
  
  // Modal state for editing sessions
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingSession, setEditingSession] = useState(null);
  const [editForm, setEditForm] = useState({
    session_date: '',
    session_time: '',
    duration_hours: 1.0,
    session_notes: '',
    student_name: '',
    teacher_name: '',
    subject_name: ''
  });
  const [editData, setEditData] = useState({
    students: [],
    subjects: [],
    teachers: []
  });

  // Modal state for audit history
  const [showAuditModal, setShowAuditModal] = useState(false);
  const [auditHistory, setAuditHistory] = useState([]);
  const [currentSessionForAudit, setCurrentSessionForAudit] = useState(null);
  
  // Session balance state
  const [sessionBalances, setSessionBalances] = useState([]);
  const [balanceSummary, setBalanceSummary] = useState({
    total_active_sessions: 0,
    total_applied_sessions: 0,
    total_completed_sessions: 0
  });
  const [loadingBalances, setLoadingBalances] = useState(false);

  useEffect(() => {
    fetchSessions();
    fetchTeachers();
    fetchEditData();
    fetchSessionBalances();
  }, []);

  const fetchSessionBalances = async () => {
    try {
      setLoadingBalances(true);
      const token = localStorage.getItem('pt_token');
      
      if (!token) {
        return;
      }

      const response = await privateTutoringAxios.get('/sessions/session-balances');
      setSessionBalances(response.data.balances || []);
      setBalanceSummary(response.data.summary || {
        total_active_sessions: 0,
        total_applied_sessions: 0,
        total_completed_sessions: 0
      });
    } catch (error) {
      console.error('Error fetching session balances:', error);
      if (error.response?.status !== 401) {
        showAlert('danger', 'Failed to fetch session balances');
      }
    } finally {
      setLoadingBalances(false);
    }
  };

  useEffect(() => {
    // Filter sessions based on search criteria
    let filtered = sessions;

    if (searchTerm) {
      filtered = filtered.filter(session =>
        session.student_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        session.teacher_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        session.subject_name.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (filterDate) {
      filtered = filtered.filter(session =>
        session.start_time.split('T')[0] === filterDate
      );
    }

    if (filterStudent) {
      filtered = filtered.filter(session =>
        session.student_name.toLowerCase().includes(filterStudent.toLowerCase())
      );
    }

    if (filterMonth) {
      filtered = filtered.filter(session => {
        const sessionDate = new Date(session.start_time);
        const filterDate = new Date(filterMonth + '-01');
        return sessionDate.getFullYear() === filterDate.getFullYear() &&
               sessionDate.getMonth() === filterDate.getMonth();
      });
    }

    if (filterTeacher) {
      filtered = filtered.filter(session =>
        session.teacher_name.toLowerCase().includes(filterTeacher.toLowerCase())
      );
    }

    // Sort sessions by date (newest first) - using start_time field
    filtered.sort((a, b) => new Date(b.start_time) - new Date(a.start_time));

    setFilteredSessions(filtered);
    
    // Calculate total hours for filtered sessions
    const hours = filtered.reduce((total, session) => total + session.duration_hours, 0);
    setTotalHours(hours);
  }, [sessions, searchTerm, filterDate, filterStudent, filterMonth, filterTeacher]);

  const fetchSessions = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('pt_token');
      
      if (!token) {
        showAlert('danger', 'Please log in again');
        window.location.href = '/private-tutoring/login';
        return;
      }

      // Updated to the new, RESTful endpoint with a query parameter
      const response = await privateTutoringAxios.get('/sessions?status=completed');
      
      const sessionsData = response.data.sessions || [];
      setSessions(sessionsData);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching session history:', error);
      
      if (error.response?.status === 401) {
        localStorage.removeItem('pt_token');
        window.location.href = '/private-tutoring/login';
        return;
      }
      
      showAlert('danger', 'Failed to fetch session history');
      setLoading(false);
    }
  };

  const fetchTeachers = async () => {
    try {
      const token = localStorage.getItem('pt_token');
      
      if (!token) {
        return;
      }

      const response = await privateTutoringAxios.get('/teachers');
      setTeachers(response.data);
    } catch (error) {
      console.error('Error fetching teachers:', error);
    }
  };

  const fetchEditData = async () => {
    try {
      const token = localStorage.getItem('pt_token');
      
      if (!token) {
        return;
      }

      const response = await privateTutoringAxios.get('/sessions/edit-data');
      setEditData(response.data);
    } catch (error) {
      console.error('Error fetching edit data:', error);
    }
  };

  const showAlert = (type, message) => {
    setAlert({ type, message, visible: true });
    setTimeout(() => {
      setAlert({ type, message: '', visible: false });
    }, 5000);
  };

  const toggleSessionExpansion = (sessionId) => {
    const newExpanded = new Set(expandedSessions);
    if (newExpanded.has(sessionId)) {
      newExpanded.delete(sessionId);
    } else {
      newExpanded.add(sessionId);
      // Fetch session history if not already loaded
      if (!sessionHistory[sessionId]) {
        fetchSessionHistory(sessionId);
      }
    }
    setExpandedSessions(newExpanded);
  };

  const fetchSessionHistory = async (sessionId) => {
    try {
      const response = await privateTutoringAxios.get(`/sessions/${sessionId}/audit`);
      const historyData = response.data;
      
      setSessionHistory(prev => ({
        ...prev,
        [sessionId]: historyData.audit_trail || []
      }));
    } catch (error) {
      console.error('Error fetching session history:', error);
      showAlert('danger', 'Failed to fetch session history');
    }
  };

  const openDetailModal = (session) => {
    setSelectedSession(session);
    setShowDetailModal(true);
  };

  const openEditModal = (session) => {
    setEditingSession(session);
    const sessionDate = new Date(session.start_time);
    setEditForm({
      session_date: sessionDate.toISOString().split('T')[0],
      session_time: sessionDate.toTimeString().split(' ')[0].substring(0, 5),
      duration_hours: session.duration_hours,
      session_notes: session.session_notes || '', // Get existing notes if available
      student_name: session.student_name,
      teacher_name: session.teacher_name,
      subject_name: session.subject_name
    });
    setShowEditModal(true);
  };

  const openAuditModal = async (session) => {
    try {
      const response = await privateTutoringAxios.get(`/sessions/${session.session_id}/audit`);
      setAuditHistory(response.data.audit_trail || []);
      setCurrentSessionForAudit(session); // Use the session object directly since audit_trail doesn't include current_session
      setShowAuditModal(true);
    } catch (error) {
      console.error('Error fetching audit history:', error);
      showAlert('danger', 'Failed to fetch audit history');
    }
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    
    try {
      const response = await privateTutoringAxios.put(`/sessions/${editingSession.session_id}`, editForm);
      
      if (response.data.status === 'success') {
        showAlert('success', 'Session updated successfully');
        setShowEditModal(false);
        // Fetch fresh data to reflect the updates
        await fetchSessions();
        // Close any open detail modal so it refreshes with new data when reopened
        setShowDetailModal(false);
        setSelectedSession(null);
      } else {
        showAlert('danger', response.data.message || 'Failed to update session');
      }
    } catch (error) {
      console.error('Error updating session:', error);
      showAlert('danger', 'Failed to update session: ' + (error.response?.data?.error || error.message));
    }
  };

  const handleEditFormChange = (field, value) => {
    setEditForm(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const formatTime = (dateTimeString) => {
    return new Date(dateTimeString).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
  };

  const getDurationLabel = (hours) => {
    if (hours === 0.5) return '0.5hr';
    if (hours === 1) return '1hr';
    if (hours === 1.5) return '1.5hr';
    if (hours === 2) return '2hr';
    return `${hours}hr`;
  };

  const clearFilters = () => {
    setSearchTerm('');
    setFilterDate('');
    setFilterStudent('');
    setFilterMonth('');
    setFilterTeacher('');
  };

  const getCurrentMonth = () => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  };

  const setCurrentMonth = () => {
    setFilterMonth(getCurrentMonth());
  };

  const getStudentInitials = (name) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase();
  };

  const getStudentSubjectBalance = (studentId, subjectId) => {
    const balance = sessionBalances.find(b => 
      b.student_id === studentId && b.subject_id === subjectId
    );
    return balance ? balance.remaining_sessions : 0;
  };


  return (
    <Container fluid className="p-4">
      {/* Header Section */}
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div className="d-flex align-items-center">
          <div className="bg-primary rounded-circle p-2 me-3">
            <Calendar className="text-white" size={20} />
          </div>
          <div>
            <h3 className="mb-0 fw-bold">Sessions</h3>
            <p className="text-muted mb-0 small">Manage and track all tutoring sessions</p>
          </div>
        </div>
        <div className="d-flex gap-4 align-items-center">
          <div className="text-end" style={{minWidth: '80px'}}>
            <div className="fw-bold fs-4 text-primary">{totalHours}h</div>
            <small className="text-muted">Total Hours</small>
          </div>
          <div className="text-end" style={{minWidth: '80px'}}>
            <div className="fw-bold fs-4 text-secondary">{filteredSessions.length}</div>
            <small className="text-muted">Sessions</small>
          </div>
          <div className="text-end" style={{minWidth: '80px'}}>
            <div className="fw-bold fs-4 text-success">
              {loadingBalances ? <Spinner size="sm" /> : balanceSummary.total_active_sessions}
            </div>
            <small className="text-muted">Active Sessions</small>
          </div>
          <Button
            color="primary"
            onClick={() => {
              fetchSessions();
              fetchSessionBalances();
            }}
            className="d-flex align-items-center gap-2"
          >
            <RefreshCw size={16} />
            Refresh
          </Button>
        </div>
      </div>

      <Row>
        <Col>
          <Card className="border-0 shadow-sm">
            <CardHeader className="bg-white border-bottom">
              {/* Compact Filter Controls */}
              <Row className="g-3">
                {/* Primary Search */}
                <Col lg={4}>
                  <div className="position-relative">
                    <Search className="position-absolute top-50 start-0 translate-middle-y ms-3 text-muted" size={16} />
                    <Input
                      type="text"
                      placeholder="Search sessions..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="ps-5 border-0 bg-light"
                    />
                  </div>
                </Col>
                
                {/* Month Filter */}
                <Col lg={3}>
                  <div className="d-flex">
                    <Input
                      type="month"
                      value={filterMonth}
                      onChange={(e) => setFilterMonth(e.target.value)}
                      className="border-0 bg-light"
                    />
                    <Button
                      color="link"
                      size="sm"
                      onClick={setCurrentMonth}
                      className="text-primary p-1 ms-1"
                      title="Current month"
                    >
                      <Calendar size={16} />
                    </Button>
                  </div>
                </Col>

                {/* Teacher Filter */}
                <Col lg={3}>
                  <Input
                    type="select"
                    value={filterTeacher}
                    onChange={(e) => setFilterTeacher(e.target.value)}
                    className="border-0 bg-light"
                  >
                    <option value="">All teachers</option>
                    {teachers.map(teacher => (
                      <option key={teacher.teacher_id} value={teacher.name}>
                        {teacher.name}
                      </option>
                    ))}
                  </Input>
                </Col>

                {/* Reset Filters */}
                <Col lg={2}>
                  <Button
                    color="danger"
                    onClick={clearFilters}
                    className="w-100"
                    size="sm"
                  >
                    Reset
                  </Button>
                </Col>
              </Row>

              {/* Monthly Report Summary */}
              {(filterMonth || filterTeacher) && (
                <Row className="mt-3">
                  <Col>
                    <div className="bg-success bg-opacity-10 border border-success border-opacity-25 rounded p-3">
                      <div className="d-flex justify-content-between align-items-center">
                        <div className="d-flex align-items-center">
                          <div className="bg-success rounded-circle p-2 me-3">
                            <BookOpen className="text-white" size={16} />
                          </div>
                          <div>
                            <h6 className="mb-1 fw-bold text-success">Report Summary</h6>
                            <div className="d-flex gap-3">
                              {filterMonth && (
                                <span className="badge bg-success bg-opacity-25 text-success">
                                  📅 {new Date(filterMonth + '-01').toLocaleDateString('en-US', { 
                                    year: 'numeric', 
                                    month: 'long' 
                                  })}
                                </span>
                              )}
                              {filterTeacher && (
                                <span className="badge bg-primary bg-opacity-25 text-primary">
                                  👨‍🏫 {filterTeacher}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                        <div className="text-end">
                          <div className="fs-3 fw-bold text-success">{totalHours}h</div>
                          <small className="text-muted">{filteredSessions.length} sessions</small>
                        </div>
                      </div>
                    </div>
                  </Col>
                </Row>
              )}
            </CardHeader>
            <CardBody className="p-0">
              {alert.visible && (
                <Alert color={alert.type} className="mx-4 mt-4 mb-0">
                  {alert.message}
                </Alert>
              )}

              {loading ? (
                <div className="text-center py-5">
                  <Spinner color="primary" />
                  <p className="mt-3 text-muted">Loading sessions...</p>
                </div>
              ) : filteredSessions.length === 0 ? (
                <div className="text-center py-5">
                  <div className="bg-light rounded-circle p-4 d-inline-flex mb-3">
                    <BookOpen size={32} className="text-muted" />
                  </div>
                  <h5 className="text-muted fw-normal">No sessions found</h5>
                  <p className="text-muted mb-0">
                    {sessions.length === 0 
                      ? "Complete your first session to see it here!"
                      : "Try adjusting your filters to find sessions."
                    }
                  </p>
                </div>
              ) : (
                <div className="p-4">
                  {filteredSessions.map(
                    (session) => (
                      <SessionCard
                        key={session.session_id}
                        session={session}
                        sessionHistory={sessionHistory}
                        expandedSessions={expandedSessions}
                        toggleSessionExpansion={toggleSessionExpansion}
                        openDetailModal={openDetailModal}
                        openEditModal={openEditModal}
                        formatDate={formatDate}
                        formatTime={formatTime}
                        getDurationLabel={getDurationLabel}
                        getStudentSubjectBalance={getStudentSubjectBalance}
                      />
                  ))}
                </div>
              )}
            </CardBody>
          </Card>
        </Col>
      </Row>

      {/* Session Detail Modal */}
      <Modal isOpen={showDetailModal} size="lg" centered>
        <ModalHeader className="border-0 pb-0">
          <div className="d-flex align-items-center">
            <div className="bg-primary rounded-circle p-2 me-2">
              <BookOpen className="text-white" size={16} />
            </div>
            <span className="fw-bold">Session Details</span>
          </div>
        </ModalHeader>
        <ModalBody className="px-4">
          {selectedSession && (
            <div>
              <Row className="g-4 mb-4">
                <Col md={6}>
                  <div className="bg-light rounded p-3 h-100">
                    <h6 className="text-primary fw-semibold mb-3">📅 Session Info</h6>
                    <div className="d-flex justify-content-between align-items-center mb-2">
                      <span className="text-muted">Date:</span>
                      <span className="fw-semibold">{formatDate(selectedSession.start_time)}</span>
                    </div>
                    <div className="d-flex justify-content-between align-items-center mb-2">
                      <span className="text-muted">Time:</span>
                      <span className="badge bg-primary">{formatTime(selectedSession.start_time)}</span>
                    </div>
                    <div className="d-flex justify-content-between align-items-center mb-2">
                      <span className="text-muted">Duration:</span>
                      <span className="badge bg-light text-dark">{getDurationLabel(selectedSession.duration_hours)}</span>
                    </div>
                    <div className="d-flex justify-content-between align-items-center">
                      <span className="text-muted">Subject:</span>
                      <span className="badge bg-info">{selectedSession.subject_name}</span>
                    </div>
                  </div>
                </Col>
                <Col md={6}>
                  <div className="bg-light rounded p-3 h-100">
                    <h6 className="text-primary fw-semibold mb-3">👥 Participants</h6>
                    <div className="d-flex justify-content-between align-items-center mb-2">
                      <span className="text-muted">Student:</span>
                      <span className="fw-semibold">{selectedSession.student_name}</span>
                    </div>
                    <div className="d-flex justify-content-between align-items-center mb-2">
                      <span className="text-muted">Teacher:</span>
                      <span className="fw-semibold">{selectedSession.teacher_name}</span>
                    </div>
                    <div className="d-flex justify-content-between align-items-center">
                      <span className="text-muted">Status:</span>
                      <span className="badge bg-success">✓ Completed</span>
                    </div>
                  </div>
                </Col>
              </Row>
              
              <div className="bg-white border rounded p-4">
                <h6 className="text-primary fw-semibold mb-3">💬 Session Comments</h6>
                <div 
                  className="text-dark"
                  style={{ 
                    whiteSpace: 'pre-wrap',
                    lineHeight: '1.6',
                    fontSize: '0.95em'
                  }}
                >
                  {selectedSession.session_notes || 'No session notes available'}
                </div>
              </div>
            </div>
          )}
        </ModalBody>
        <ModalFooter className="border-0 pt-0">
          <Button 
            color="secondary" 
            onClick={() => setShowDetailModal(false)}
            className="px-4"
          >
            Close
          </Button>
        </ModalFooter>
      </Modal>

      {/* Edit Session Modal */}
      <Modal isOpen={showEditModal} size="lg" centered>
        <ModalHeader className="border-0 pb-0">
          <div className="d-flex align-items-center">
            <div className="bg-warning rounded-circle p-2 me-2">
              <Edit className="text-white" size={16} />
            </div>
            <span className="fw-bold">Edit Session</span>
          </div>
        </ModalHeader>
        <Form onSubmit={handleEditSubmit}>
          <ModalBody className="px-4">
            <Row className="g-3">
              <Col md={6}>
                <FormGroup>
                  <Label for="edit_session_date">Date *</Label>
                  <Input
                    type="date"
                    id="edit_session_date"
                    value={editForm.session_date}
                    onChange={(e) => handleEditFormChange('session_date', e.target.value)}
                    required
                  />
                </FormGroup>
              </Col>
              <Col md={6}>
                <FormGroup>
                  <Label for="edit_session_time">Time *</Label>
                  <Input
                    type="time"
                    id="edit_session_time"
                    value={editForm.session_time}
                    onChange={(e) => handleEditFormChange('session_time', e.target.value)}
                    required
                  />
                </FormGroup>
              </Col>
              <Col md={6}>
                <FormGroup>
                  <Label for="edit_duration">Duration *</Label>
                  <Input
                    type="select"
                    id="edit_duration"
                    value={editForm.duration_hours}
                    onChange={(e) => handleEditFormChange('duration_hours', parseFloat(e.target.value))}
                    required
                  >
                    <option value={0.5}>0.5 hours</option>
                    <option value={1.0}>1.0 hours</option>
                    <option value={1.5}>1.5 hours</option>
                    <option value={2.0}>2.0 hours</option>
                  </Input>
                </FormGroup>
              </Col>
              <Col md={6}>
                <FormGroup>
                  <Label for="edit_subject">Subject *</Label>
                  <Input
                    type="select"
                    id="edit_subject"
                    value={editForm.subject_name}
                    onChange={(e) => handleEditFormChange('subject_name', e.target.value)}
                    required
                  >
                    <option value="">Select Subject</option>
                    {editData.subjects.map(subject => (
                      <option key={subject.subject_id} value={subject.subject_name}>
                        {subject.subject_name}
                      </option>
                    ))}
                  </Input>
                </FormGroup>
              </Col>
              <Col md={6}>
                <FormGroup>
                  <Label for="edit_student">Student *</Label>
                  <Input
                    type="select"
                    id="edit_student"
                    value={editForm.student_name}
                    onChange={(e) => handleEditFormChange('student_name', e.target.value)}
                    required
                  >
                    <option value="">Select Student</option>
                    {editData.students.map(student => (
                      <option key={student.student_id} value={student.name}>
                        {student.name}
                      </option>
                    ))}
                  </Input>
                </FormGroup>
              </Col>
              <Col md={6}>
                <FormGroup>
                  <Label for="edit_teacher">Teacher *</Label>
                  <Input
                    type="select"
                    id="edit_teacher"
                    value={editForm.teacher_name}
                    onChange={(e) => handleEditFormChange('teacher_name', e.target.value)}
                    required
                  >
                    <option value="">Select Teacher</option>
                    {editData.teachers.map(teacher => (
                      <option key={teacher.teacher_id} value={teacher.name}>
                        {teacher.name}
                      </option>
                    ))}
                  </Input>
                </FormGroup>
              </Col>
              <Col md={12}>
                <FormGroup>
                  <Label for="edit_session_notes">Session Notes *</Label>
                  <Input
                    type="textarea"
                    id="edit_session_notes"
                    rows="4"
                    value={editForm.session_notes}
                    onChange={(e) => handleEditFormChange('session_notes', e.target.value)}
                    placeholder="Enter session comments and feedback..."
                    required
                  />
                </FormGroup>
              </Col>
            </Row>
          </ModalBody>
          <ModalFooter className="border-0 pt-0">
            <Button 
              color="secondary" 
              onClick={() => setShowEditModal(false)}
              className="px-4"
            >
              Cancel
            </Button>
            <Button 
              color="warning" 
              type="submit"
              className="px-4"
            >
              Update Session
            </Button>
          </ModalFooter>
        </Form>
      </Modal>

      {/* Audit History Modal */}
      <Modal isOpen={showAuditModal} size="xl" centered>
        <ModalHeader className="border-0 pb-0">
          <div className="d-flex align-items-center">
            <div className="bg-info rounded-circle p-2 me-2">
              <History className="text-white" size={16} />
            </div>
            <span className="fw-bold">Session History</span>
          </div>
        </ModalHeader>
        <ModalBody className="px-4">
          {currentSessionForAudit && (
            <div>
              <div className="bg-light rounded p-3 mb-4">
                <h6 className="text-primary fw-semibold mb-3">📋 Current Session</h6>
                <Row>
                  <Col md={6}>
                    <div className="d-flex justify-content-between align-items-center mb-2">
                      <span className="text-muted">Student:</span>
                      <span className="fw-semibold">{currentSessionForAudit.student_name}</span>
                    </div>
                    <div className="d-flex justify-content-between align-items-center mb-2">
                      <span className="text-muted">Subject:</span>
                      <span className="badge bg-primary">{currentSessionForAudit.subject_name}</span>
                    </div>
                  </Col>
                  <Col md={6}>
                    <div className="d-flex justify-content-between align-items-center mb-2">
                      <span className="text-muted">Date:</span>
                      <span className="fw-semibold">{formatDate(currentSessionForAudit.session_date)}</span>
                    </div>
                    <div className="d-flex justify-content-between align-items-center mb-2">
                      <span className="text-muted">Duration:</span>
                      <span className="badge bg-light text-dark">{getDurationLabel(currentSessionForAudit.duration_hours)}</span>
                    </div>
                  </Col>
                </Row>
              </div>

              <h6 className="text-primary fw-semibold mb-3">📚 Session History for {currentSessionForAudit.student_name} - {currentSessionForAudit.subject_name}</h6>
              
              {auditHistory.length === 0 ? (
                <div className="text-center py-4">
                  <div className="bg-light rounded-circle p-3 d-inline-flex mb-3">
                    <History size={24} className="text-muted" />
                  </div>
                  <p className="text-muted mb-0">No session history found</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {auditHistory
                    .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
                    .map((record, index) => (
                    <div 
                      key={record.audit_id || index}
                      className="rounded-lg border p-4 bg-gray-50 border-gray-200"
                    >
                      <div className="d-flex justify-content-between align-items-start mb-3">
                        <div className="flex-1">
                          <div className="fw-semibold text-dark mb-1">
                            {record.created_at ? new Date(record.created_at).toLocaleDateString('en-US', {
                              year: 'numeric',
                              month: 'short',
                              day: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit'
                            }) : 'Unknown time'}
                          </div>
                          <div className="text-muted small mb-2">
                            <span className="fw-medium">{record.action || 'Action'}</span>
                          </div>
                        </div>
                        <div className="d-flex flex-column gap-1">
                          <span className="badge bg-primary">Session {record.session_id}</span>
                        </div>
                      </div>

                      <div className="text-muted small mb-2">
                        <strong>Teacher:</strong> {record.teacher_name || 'Unknown'}
                      </div>

                      {record.session_notes && (
                        <div className="small mb-2 p-3 rounded border text-dark bg-white border-light">
                          <strong>Session Notes:</strong>
                          <div className="mt-1" style={{ whiteSpace: 'pre-wrap', lineHeight: '1.4' }}>
                            {record.session_notes}
                          </div>
                        </div>
                      )}

                      <div className="text-muted small">
                        <strong>Created:</strong> {record.created_at ? new Date(record.created_at).toLocaleString() : 'Unknown'}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </ModalBody>
        <ModalFooter className="border-0 pt-0">
          <Button 
            color="secondary" 
            onClick={() => setShowAuditModal(false)}
            className="px-4"
          >
            Close
          </Button>
        </ModalFooter>
      </Modal>
    </Container>
  );
};

export default Sessions;