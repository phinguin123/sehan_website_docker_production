import React, { useState, useEffect } from 'react';
import {
  Container,
  Row,
  Col,
  Card,
  CardBody,
  CardHeader,
  Form,
  FormGroup,
  Label,
  Input,
  Button,
  Alert,
  Spinner
} from 'reactstrap';
import { Calendar, Clock, User, BookOpen, MessageSquare, CheckCircle } from 'lucide-react';
import axios from 'axios';
import privateTutoringAxios from '../../utils/privateTutoringAxios';

const CompleteSession = () => {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [alert, setAlert] = useState({ type: '', message: '', visible: false });

  const [sessionForm, setSessionForm] = useState({
    student_id: '',
    student_name: '', // For display
    subject_id: '', // Add subject selection
    subject_name: '', // For display
    duration: '',
    session_notes: '',
    session_date: new Date().toISOString().split('T')[0], // Today's date
    session_time: new Date().toTimeString().slice(0, 5) // Current time
  });

  const durationOptions = [
    { value: '0.5', label: '0.5hr' },
    { value: '1', label: '1hr' },
    { value: '1.5', label: '1.5hr' },
    { value: '2', label: '2hr' }
  ];

  useEffect(() => {
    fetchStudents();
  }, []);

  const fetchStudents = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('pt_token');
      
      if (!token) {
        showAlert('danger', 'Please log in again');
        window.location.href = '/private-tutoring/login';
        return;
      }

      const response = await privateTutoringAxios.get('/students');
      
      setStudents(response.data);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching students:', error);
      
      if (error.response?.status === 401) {
        localStorage.removeItem('pt_token');
        window.location.href = '/private-tutoring/login';
        return;
      }
      
      showAlert('danger', 'Failed to fetch students');
      setLoading(false);
    }
  };

  const showAlert = (type, message) => {
    setAlert({ type, message, visible: true });
    setTimeout(() => {
      setAlert({ type: '', message: '', visible: false });
    }, 5000);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    
    if (name === 'student_id') {
      const selectedStudent = students.find(s => s.student_id.toString() === value);
      setSessionForm(prev => ({
        ...prev,
        [name]: value,
        student_name: selectedStudent ? selectedStudent.name : '',
        subject_id: '', // Reset subject when student changes
        subject_name: ''
      }));
    } else if (name === 'subject_id') {
      const selectedStudent = students.find(s => s.student_id.toString() === sessionForm.student_id);
      const selectedSubject = selectedStudent?.subjects?.find(subject => 
        subject.subject_name === value
      );
      setSessionForm(prev => ({
        ...prev,
        subject_id: selectedSubject ? selectedSubject.subject_id : '', // Use actual subject_id
        subject_name: selectedSubject ? selectedSubject.subject_name : ''
      }));
    } else {
      setSessionForm(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validation
    if (!sessionForm.student_id) {
      showAlert('warning', 'Please select a student');
      return;
    }
    
    if (!sessionForm.duration) {
      showAlert('warning', 'Please select session duration');
      return;
    }
    
    if (!sessionForm.session_notes.trim()) {
      showAlert('warning', 'Please add session comments');
      return;
    }

    try {
      setSubmitting(true);
      const token = localStorage.getItem('pt_token');
      const teacherInfo = JSON.parse(localStorage.getItem('pt_teacher_info'));
      
      const sessionData = {
        student_id: parseInt(sessionForm.student_id),
        teacher_id: teacherInfo.teacher_id,
        student_name: sessionForm.student_name,
        teacher_name: teacherInfo.name,
        subject_id: sessionForm.subject_id,
        subject_name: sessionForm.subject_name,
        duration_hours: parseFloat(sessionForm.duration),
        session_date: sessionForm.session_date,
        session_time: sessionForm.session_time,
        session_notes: sessionForm.session_notes.trim(),
        status: 'completed'
      };

      console.log('Submitting session data:', sessionData);

      const response = await privateTutoringAxios.post('/sessions/complete', sessionData);

      console.log('Session completed:', response.data);
      
      showAlert('success', `Session completed successfully for ${sessionForm.student_name}!`);
      
      // Reset form
      setSessionForm({
        student_id: '',
        student_name: '',
        subject_id: '',
        subject_name: '',
        duration: '',
        session_notes: '',
        session_date: new Date().toISOString().split('T')[0],
        session_time: new Date().toTimeString().slice(0, 5)
      });
      
      setSubmitting(false);
    } catch (error) {
      console.error('Error completing session:', error);
      showAlert('danger', 'Failed to complete session. Please try again.');
      setSubmitting(false);
    }
  };

  const resetForm = () => {
    setSessionForm({
      student_id: '',
      student_name: '',
      subject_id: '',
      subject_name: '',
      duration: '',
      session_notes: '',
      session_date: new Date().toISOString().split('T')[0],
      session_time: new Date().toTimeString().slice(0, 5)
    });
  };

  return (
    <Container fluid className="p-4">
      {/* Header Section */}
      <div className="d-flex align-items-center mb-4">
        <div className="bg-success rounded-circle p-2 me-3">
          <CheckCircle className="text-white" size={20} />
        </div>
        <div>
          <h3 className="mb-0 fw-bold">Complete Session</h3>
          <p className="text-muted mb-0 small">Record a completed tutoring session</p>
        </div>
      </div>

      <Row>
        <Col lg={8} className="mx-auto">
          <Card className="border-0 shadow-sm">
            <CardBody className="p-4">
              {alert.visible && (
                <Alert color={alert.type} className="mb-4">
                  {alert.message}
                </Alert>
              )}

              {loading ? (
                <div className="text-center p-4">
                  <Spinner color="primary" />
                  <p className="mt-2">Loading students...</p>
                </div>
              ) : (
                <Form onSubmit={handleSubmit}>
                  <Row>
                    <Col md={6}>
                      <FormGroup>
                        <Label for="student_id" className="fw-bold">
                          <User className="me-1" size={16} />
                          Student *
                        </Label>
                        <Input
                          type="select"
                          name="student_id"
                          id="student_id"
                          value={sessionForm.student_id}
                          onChange={handleInputChange}
                          required
                        >
                          <option value="">Select a student...</option>
                          {students.map(student => (
                            <option key={student.student_id} value={student.student_id}>
                              {student.name} - Grade {student.grade} ({student.school})
                            </option>
                          ))}
                        </Input>
                      </FormGroup>
                    </Col>
                    
                    <Col md={6}>
                      <FormGroup>
                        <Label for="subject_id" className="fw-bold">
                          <BookOpen className="me-1" size={16} />
                          Subject *
                        </Label>
                        <Input
                          type="select"
                          name="subject_id"
                          id="subject_id"
                          value={sessionForm.subject_name}
                          onChange={handleInputChange}
                          required
                          disabled={!sessionForm.student_id}
                        >
                          <option value="">Select a subject...</option>
                          {sessionForm.student_id && students.find(s => s.student_id.toString() === sessionForm.student_id)?.subjects?.map(subject => (
                            <option key={`${subject.subject_name}:${subject.subject_level}`} value={subject.subject_name}>
                              {subject.subject_name} ({subject.subject_level})
                            </option>
                          ))}
                        </Input>
                      </FormGroup>
                    </Col>
                  </Row>

                  <Row>
                    <Col md={6}>
                      <FormGroup>
                        <Label for="duration" className="fw-bold">
                          <Clock className="me-1" size={16} />
                          Session Duration *
                        </Label>
                        <Input
                          type="select"
                          name="duration"
                          id="duration"
                          value={sessionForm.duration}
                          onChange={handleInputChange}
                          required
                        >
                          <option value="">Select duration...</option>
                          {durationOptions.map(option => (
                            <option key={option.value} value={option.value}>
                              {option.label}
                            </option>
                          ))}
                        </Input>
                      </FormGroup>
                    </Col>
                    
                    <Col md={6}>
                      {/* Empty column for layout balance */}
                    </Col>
                  </Row>

                  <Row>
                    <Col md={6}>
                      <FormGroup>
                        <Label for="session_date" className="fw-bold">
                          <Calendar className="me-1" size={16} />
                          Session Date *
                        </Label>
                        <Input
                          type="date"
                          name="session_date"
                          id="session_date"
                          value={sessionForm.session_date}
                          onChange={handleInputChange}
                          required
                        />
                      </FormGroup>
                    </Col>
                    
                    <Col md={6}>
                      <FormGroup>
                        <Label for="session_time" className="fw-bold">
                          <Clock className="me-1" size={16} />
                          Session Time *
                        </Label>
                        <Input
                          type="time"
                          name="session_time"
                          id="session_time"
                          value={sessionForm.session_time}
                          onChange={handleInputChange}
                          required
                        />
                      </FormGroup>
                    </Col>
                  </Row>

                  <FormGroup>
                    <Label for="session_notes" className="fw-bold">
                      <MessageSquare className="me-1" size={16} />
                      Session Comments *
                    </Label>
                    <Input
                      type="textarea"
                      name="session_notes"
                      id="session_notes"
                      rows="5"
                      value={sessionForm.session_notes}
                      onChange={handleInputChange}
                      placeholder="Enter detailed comments about the session, topics covered, student progress, homework assigned, etc..."
                      required
                    />
                    <small className="text-muted">
                      Provide comprehensive feedback about the session, student performance, and any homework assigned.
                    </small>
                  </FormGroup>

                  <hr className="my-4" />

                  <div className="d-flex justify-content-between">
                    <Button
                      type="button"
                      color="secondary"
                      onClick={resetForm}
                      disabled={submitting}
                    >
                      Reset Form
                    </Button>
                    
                    <Button
                      type="submit"
                      color="success"
                      size="lg"
                      disabled={submitting}
                      className="px-4"
                    >
                      {submitting ? (
                        <>
                          <Spinner size="sm" className="me-2" />
                          Completing Session...
                        </>
                      ) : (
                        <>
                          <CheckCircle className="me-2" size={18} />
                          Complete Session
                        </>
                      )}
                    </Button>
                  </div>
                </Form>
              )}
            </CardBody>
          </Card>

          {/* Info Card */}
          <Card className="mt-4 border-info">
            <CardBody className="text-center">
              <BookOpen className="text-info mb-2" size={32} />
              <h6 className="text-info">Session Recording Guidelines</h6>
              <small className="text-muted">
                Record sessions immediately after completion for accurate tracking. 
                Include detailed comments about topics covered, student progress, and any homework assigned.
              </small>
            </CardBody>
          </Card>
        </Col>
      </Row>
    </Container>
  );
};

export default CompleteSession;
