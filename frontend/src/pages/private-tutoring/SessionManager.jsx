import React, { useState, useEffect } from 'react';
import {
  Card,
  CardBody,
  CardHeader,
  Button,
  Modal,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Form,
  FormGroup,
  Label,
  Input,
  Row,
  Col,
  Alert,
  Badge,
  ButtonGroup
} from 'reactstrap';
import privateTutoringAxios from '../../utils/privateTutoringAxios';
import { handleAuthError } from '../../utils/privateTutoringAuth';
import './SessionManager.css';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";

const SessionManager = () => {
  // Calendar state
  const [currentDate, setCurrentDate] = useState(new Date());
  const [view, setView] = useState('month'); // month, week, day
  const [events, setEvents] = useState([]);
  
  // Modal states
  const [showEventModal, setShowEventModal] = useState(false);
  const [showRepeatModal, setShowRepeatModal] = useState(false);
  const [selectedDate, setSelectedDate] = useState(null);
  const [editingEvent, setEditingEvent] = useState(null);
  
  // Form states
  const [eventForm, setEventForm] = useState({
    title: '',
    student_id: '',
    teacher_id: '',
    subject: '',
    date: '',
    startTime: '09:00',
    endTime: '10:00',
    color: '#4285f4',
    notes: '',
    repeat: 'no-repeat', // no-repeat, weekly, custom
    customRepeat: {
      frequency: 'weekly',
      interval: 1,
      endType: 'count', // count, date, never
      count: 12,
      endDate: ''
    }
  });

  // Students, subjects, teachers, and applications for dropdown
  const [students, setStudents] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [activeSubjects, setActiveSubjects] = useState(new Set());
  const [subjectFilterOpen, setSubjectFilterOpen] = useState(false);
  const [teachers, setTeachers] = useState([]);
  const [applications, setApplications] = useState([]);
  const [alert, setAlert] = useState({ type: '', message: '', visible: false });
  const [loading, setLoading] = useState(true);
  
  // Calendar colors
  const eventColors = [
    { color: '#4285f4', label: 'Blue' },
    { color: '#ea4335', label: 'Red' },
    { color: '#34a853', label: 'Green' },
    { color: '#fbbc04', label: 'Yellow' },
    { color: '#9c27b0', label: 'Purple' },
    { color: '#ff9800', label: 'Orange' },
    { color: '#795548', label: 'Brown' },
    { color: '#607d8b', label: 'Grey' }
  ];

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      await Promise.all([
        fetchEvents(),
        fetchStudents(),
        fetchSubjects(),
        fetchTeachers(),
        fetchApplications()
      ]);
    } catch (error) {
      console.error('Error fetching data:', error);
      showAlert('danger', 'Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const fetchEvents = async () => {
    try {
      const response = await privateTutoringAxios.get('/schedules');
      const schedules = response.data || [];
      
      // Transform schedule data to event format
      const transformedEvents = schedules.map(schedule => ({
        id: schedule.schedule_id,
        title: schedule.display_title || `${schedule.subject_name || 'Session'} - ${schedule.student_name || 'Student'}`,
        date: schedule.start_time ? schedule.start_time.split('T')[0] : '',
        startTime: schedule.start_time ? schedule.start_time.split('T')[1]?.substring(0, 5) : '09:00',
        endTime: schedule.end_time ? schedule.end_time.split('T')[1]?.substring(0, 5) : '10:00',
        color: schedule.color || '#4285f4',
        notes: schedule.notes || '',
        studentId: schedule.student_id,
        subject: schedule.subject_name,
        teacherId: schedule.teacher_id,
        teacherName: schedule.teacher_name || '',
        scheduleId: schedule.schedule_id
      }));
      
      setEvents(transformedEvents);
    } catch (error) {
      console.error('Error fetching events:', error);
      handleAuthError(error);
      // Set empty events on error
      setEvents([]);
    }
  };

  const fetchStudents = async () => {
    try {
      const response = await privateTutoringAxios.get('/students');
      const studentsData = response.data || [];
      
      // Transform student data to match expected format
      const transformedStudents = studentsData.map(student => ({
        id: student.student_id,
        name: student.name,
        subjects: student.subjects ? student.subjects.map(sub => sub.subject_name || sub) : []
      }));
      
      setStudents(transformedStudents);
    } catch (error) {
      console.error('Error fetching students:', error);
      handleAuthError(error);
      // Set empty students on error
      setStudents([]);
    }
  };

  const fetchSubjects = async () => {
    try {
      const response = await privateTutoringAxios.get('/subjects');
      const subjectsData = response.data || [];
      
      // Store full subject objects for ID mapping
      setSubjects(subjectsData);
      // Initialize active subjects (all checked by default)
      const initial = new Set(subjectsData.map((s) => s.subject_name));
      setActiveSubjects(initial);
    } catch (error) {
      console.error('Error fetching subjects:', error);
      handleAuthError(error);
      // Set empty subjects on error
      setSubjects([]);
    }
  };

  const fetchTeachers = async () => {
    try {
      const response = await privateTutoringAxios.get('/teachers');
      const teachersData = response.data || [];
      
      // Transform teacher data to match expected format
      const transformedTeachers = teachersData.map(teacher => ({
        id: teacher.teacher_id,
        name: teacher.name,
        subjects: teacher.subjects || []
      }));
      
      setTeachers(transformedTeachers);
    } catch (error) {
      console.error('Error fetching teachers:', error);
      handleAuthError(error);
      // Set empty teachers on error
      setTeachers([]);
    }
  };

  const fetchApplications = async () => {
    try {
      const response = await privateTutoringAxios.get('/sessions/applications');
      setApplications(response.data || []);
    } catch (error) {
      console.error('Error fetching applications:', error);
      handleAuthError(error);
      // Set empty applications on error
      setApplications([]);
    }
  };

  const showAlert = (type, message) => {
    setAlert({ type, message, visible: true });
    setTimeout(() => setAlert({ ...alert, visible: false }), 5000);
  };

  // Helper functions for student applications
  const getSelectedStudent = () => {
    if (!eventForm.student_id) return null;
    return students.find(s => s.id === parseInt(eventForm.student_id));
  };

  const getStudentSubjectsWithSessions = () => {
    const student = getSelectedStudent();
    if (!student) return [];
    
    // Get all applications for this student with remaining sessions
    const studentApps = applications.filter(app => 
      app.student_id === parseInt(eventForm.student_id) && 
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
      app.student_id === parseInt(eventForm.student_id) && 
      app.subject_id === parseInt(subjectId) &&
      app.status === 'active' &&
      (app.remaining_sessions || 0) > 0
    );
    
    // Return the first application with remaining sessions
    return studentApps.length > 0 ? studentApps[0] : null;
  };

  // Calendar utility functions
  const getDaysInMonth = (date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();

    const days = [];
    
    // Add empty cells for days before the first day of the month
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(null);
    }
    
    // Add days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      days.push(new Date(year, month, day));
    }
    
    return days;
  };

  // Helper function to format date in KST (avoiding timezone issues)
  const formatDate = (date) => {
    // Get local date components to avoid timezone conversion issues
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  // Helper function to convert local datetime to MySQL datetime format (KST)
  const toKSTISOString = (dateString, timeString) => {
    const date = new Date(`${dateString}T${timeString}:00`);
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

  const formatTime = (time) => {
    const [hours, minutes] = time.split(':');
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour % 12 || 12;
    return `${displayHour}:${minutes} ${ampm}`;
  };

  const getEventsForDate = (date) => {
    const dateStr = formatDate(date);
    const isFilterActive = activeSubjects && activeSubjects.size > 0;
    return events.filter(event => {
      if (event.date !== dateStr) return false;
      if (!isFilterActive) return true;
      return activeSubjects.has(event.subject);
    });
  };

  // Event handlers
  const handleDateClick = (date) => {
    setSelectedDate(date);
    setEventForm({
      ...eventForm,
      date: formatDate(date),
      title: '',
      student_id: '',
      teacher_id: '',
      subject: '',
      startTime: '09:00',
      endTime: '10:00',
      color: '#4285f4',
      notes: '',
      repeat: 'no-repeat'
    });
    setEditingEvent(null);
    setShowEventModal(true);
  };

  const handleEventClick = (event) => {
    setEditingEvent(event);
    setEventForm({
      title: event.title,
      student_id: event.studentId || '',
      teacher_id: event.teacherId || '',
      subject: event.subject || '',
      date: event.date,
      startTime: event.startTime,
      endTime: event.endTime,
      color: event.color,
      notes: event.notes,
      repeat: 'no-repeat'
    });
    setShowEventModal(true);
  };

  const handleSaveEvent = async () => {
    if (!eventForm.student_id) {
      showAlert('danger', 'Please select a student');
      return;
    }
    if (!eventForm.subject) {
      showAlert('danger', 'Please select a subject');
      return;
    }
    if (!eventForm.teacher_id) {
      showAlert('danger', 'Please select a teacher');
      return;
    }
    if (!eventForm.title.trim()) {
      showAlert('danger', 'Please enter a title');
      return;
    }

    try {
      const selectedTeacher = teachers.find(t => t.id === parseInt(eventForm.teacher_id));
      const selectedStudent = students.find(s => s.id === parseInt(eventForm.student_id));
      const selectedSubject = subjects.find(s => s.subject_name === eventForm.subject);
      
      if (!selectedSubject) {
        showAlert('danger', 'Selected subject not found');
        return;
      }
      
      // Calculate duration from start and end times
      const startTime = new Date(`2000-01-01T${eventForm.startTime}`);
      const endTime = new Date(`2000-01-01T${eventForm.endTime}`);
      const durationHours = (endTime - startTime) / (1000 * 60 * 60);

      // Get the application for the selected subject
      const application = getApplicationForSubject(selectedSubject.subject_id);
      
      const scheduleData = {
        application_id: application ? application.application_id : null,
        student_id: parseInt(eventForm.student_id),
        teacher_id: parseInt(eventForm.teacher_id),
        subject_id: selectedSubject.subject_id,
        start_time: toKSTISOString(eventForm.date, eventForm.startTime),
        end_time: toKSTISOString(eventForm.date, eventForm.endTime),
        scheduled_duration: durationHours,
        status: 'scheduled',
        notes: eventForm.notes || '',
        display_title: eventForm.title || null,
        color: eventForm.color || null
      };

      if (editingEvent) {
        // Update existing schedule
        await privateTutoringAxios.put(`/schedules/${editingEvent.scheduleId}`, scheduleData);
        showAlert('success', 'Session updated successfully');
      } else {
        // Create new schedule
        await privateTutoringAxios.post('/schedules', scheduleData);
        showAlert('success', 'Session created successfully');
      }

      setShowEventModal(false);
      // Refresh events after successful save
      await fetchEvents();
    } catch (error) {
      console.error('Error saving event:', error);
      handleAuthError(error);
      showAlert('danger', 'Failed to save session');
    }
  };

  const generateRepeatedEvents = (baseEvent) => {
    const events = [baseEvent];
    
    if (baseEvent.repeat === 'weekly') {
      // Generate 12 weeks of events
      for (let i = 1; i < 12; i++) {
        const eventDate = new Date(baseEvent.date);
        eventDate.setDate(eventDate.getDate() + (i * 7));
        
        events.push({
          ...baseEvent,
          id: Date.now() + i,
          date: formatDate(eventDate)
        });
      }
    } else if (baseEvent.repeat === 'custom') {
      const { interval = 1, count = 12 } = eventForm.customRepeat || {};
      const daysToAdd = (eventForm.customRepeat?.frequency === 'weekly') ? 7 * interval : interval;
      
      for (let i = 1; i < count; i++) {
        const eventDate = new Date(baseEvent.date);
        eventDate.setDate(eventDate.getDate() + (i * daysToAdd));
        
        events.push({
          ...baseEvent,
          id: Date.now() + i,
          date: formatDate(eventDate)
        });
      }
    }
    
    return events;
  };

  const handleDeleteEvent = async () => {
    if (editingEvent) {
      // Show confirmation dialog
      const confirmMessage = `Are you sure you want to delete this session?\n\n` +
                            `Student: ${editingEvent.title.split(' - ')[1] || 'Unknown'}\n` +
                            `Subject: ${editingEvent.subject || 'Unknown'}\n` +
                            `Date: ${editingEvent.date}\n` +
                            `Time: ${formatTime(editingEvent.startTime)} - ${formatTime(editingEvent.endTime)}\n\n` +
                            `This action cannot be undone.`;
      
      if (window.confirm(confirmMessage)) {
        try {
          if (editingEvent.scheduleId) {
            // Delete from API if it has a schedule ID
            await privateTutoringAxios.delete(`/schedules/${editingEvent.scheduleId}`);
          }
          
          // Refresh events from server instead of just removing from local state
          await fetchEvents();
          showAlert('success', 'Session deleted successfully');
          setShowEventModal(false);
        } catch (error) {
          console.error('Error deleting event:', error);
          handleAuthError(error);
          showAlert('danger', 'Failed to delete session');
        }
      }
    }
  };

  const handleRepeatChange = (repeatType) => {
    setEventForm({ ...eventForm, repeat: repeatType });
    
    if (repeatType === 'custom') {
      setShowRepeatModal(true);
    }
  };

  const navigateMonth = (direction) => {
    const newDate = new Date(currentDate);
    newDate.setMonth(newDate.getMonth() + direction);
    setCurrentDate(newDate);
  };

  const goToToday = () => {
    setCurrentDate(new Date());
  };

  // Render functions
  const renderMonthView = () => {
    const days = getDaysInMonth(currentDate);
    const weekdays = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

    return (
      <div className="calendar-grid">
        <div className="calendar-header">
          {weekdays.map(day => (
            <div key={day} className="calendar-weekday">
              {day}
            </div>
          ))}
        </div>
        <div className="calendar-body">
          {days.map((day, index) => (
            <div
              key={index}
              className={`calendar-day ${day ? 'has-date' : 'empty'} ${
                day && formatDate(day) === formatDate(new Date()) ? 'today' : ''
              }`}
              onClick={() => day && handleDateClick(day)}
            >
              {day && (
                <>
                  <div className="day-number">{day.getDate()}</div>
                  <div className="day-events">
                    {getEventsForDate(day).slice(0, 3).map(event => (
                      <div
                        key={event.id}
                        className="calendar-event"
                        style={{ backgroundColor: event.color }}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleEventClick(event);
                        }}
                        title={`${event.title}\nTeacher: ${event.teacherName || 'TBD'}\nTime: ${formatTime(event.startTime)} - ${formatTime(event.endTime)}`}
                      >
                        <span className="event-time">{formatTime(event.startTime)}</span>
                        <span className="event-title">{event.title}</span>
                        {event.teacherName && (
                          <div className="event-teacher">
                            <small>{event.teacherName}</small>
                          </div>
                        )}
                      </div>
                    ))}
                    {getEventsForDate(day).length > 3 && (
                      <div className="more-events">
                        +{getEventsForDate(day).length - 3} more
                      </div>
                    )}
                  </div>
                </>
              )}
            </div>
          ))}
        </div>
      </div>
    );
  };

  return (
    <div className="session-manager">
      {/* Alert */}
      {alert.visible && (
        <Alert color={alert.type} className="mb-4">
          {alert.message}
        </Alert>
      )}

      {/* Loading State */}
      {loading && (
        <Card className="mb-4">
          <CardBody className="text-center py-4">
            <div className="spinner-border text-primary" role="status">
              <span className="visually-hidden">Loading...</span>
            </div>
            <p className="mt-2 mb-0">Loading session data...</p>
          </CardBody>
        </Card>
      )}

      {/* Quick Actions Bar */
      }
      {!loading && (
        <Card className="mb-3">
        <CardBody className="py-2">
          <Row className="align-items-center">
            <Col>
              <div className="d-flex align-items-center gap-2">
                <Button 
                  color="primary" 
                  size="sm"
                  onClick={() => handleDateClick(new Date())}
                >
                  + Create Session
                </Button>
                <div className="position-relative">
                  <Button 
                    color="light" 
                    size="sm"
                    onClick={() => setSubjectFilterOpen(v => !v)}
                  >
                    Filter
                  </Button>
                  {subjectFilterOpen && (
                    <div className="absolute right-0 mt-2 z-50 min-w-[240px] bg-[#2d2d2d] rounded-lg shadow-lg border border-gray-600 py-2">
                    <div className="px-3 py-1">
                      <h3 className="text-sm font-medium text-gray-300 mb-2">내 캘린더</h3>
                    </div>
            
                    <div className="space-y-1">
                      {subjects.map((subject) => {
                        const isChecked = activeSubjects.has(subject.subject_name)
                        const color = subject.subject_color || "#6b7cff"
            
                        return (
                          <label
                            key={subject.subject_id}
                            className="flex items-center px-3 py-1.5 hover:bg-gray-700 cursor-pointer transition-colors duration-150"
                          >
                            {/* Custom checkbox */}
                            <div className="relative">
                              <input
                                type="checkbox"
                                checked={isChecked}
                                onChange={(e) => {
                                  setActiveSubjects((prev) => {
                                    const next = new Set(prev)
                                    if (e.target.checked) {
                                      next.add(subject.subject_name)
                                    } else {
                                      next.delete(subject.subject_name)
                                    }
                                    return next
                                  })
                                }}
                                className="sr-only"
                              />
                              <div
                                className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-all duration-150`}
                                style={{
                                  backgroundColor: isChecked ? color : "transparent",
                                  borderColor: color,
                                }}
                              >
                                {isChecked && (
                                  <svg className="w-3 h-3 text-[#2D2D2D]" fill="currentColor" viewBox="0 0 20 20">
                                    <path
                                      fillRule="evenodd"
                                      d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                                      clipRule="evenodd"
                                    />
                                  </svg>
                                )}
                              </div>
                            </div>
            
                            {/* Subject name */}
                            <span className="ml-3 text-sm text-gray-200 select-none">{subject.subject_name}</span>
                          </label>
                        )
                      })}
                    </div>
                  </div>
                  )}
                </div>
              </div>
            </Col>
            <Col xs="auto">
              <div className="d-flex align-items-center gap-2">
                <Badge color="info">{events.length} Total Sessions</Badge>
                <Badge color="success">
                  {events.filter(e => new Date(e.date) >= new Date()).length} Upcoming
                </Badge>
              </div>
            </Col>
          </Row>
        </CardBody>
        </Card>
      )}

      {/* Calendar Header */}
      {!loading && (
        <Card className="mb-4">
            <CardHeader>
          <Row className="align-items-center">
            <Col>
              <div className="d-flex align-items-center">
                <Button color="primary" onClick={goToToday} className="me-3">
                  Today
                </Button>
                <Button
                  color="light"
                  onClick={() => navigateMonth(-1)}
                  className="me-2"
                >
                  ‹
                </Button>
                <Button
                  color="light"
                  onClick={() => navigateMonth(1)}
                  className="me-3"
                >
                  ›
                </Button>
                <h4 className="mb-0">
                  {currentDate.toLocaleDateString('en-US', { 
                    month: 'long', 
                    year: 'numeric' 
                  })}
                </h4>
              </div>
            </Col>
            <Col xs="auto">
              <ButtonGroup>
                <Button
                  color={view === 'month' ? 'primary' : 'light'}
                  onClick={() => setView('month')}
                >
                  Month
                </Button>
                <Button
                  color={view === 'week' ? 'primary' : 'light'}
                  onClick={() => setView('week')}
                >
                  Week
                </Button>
                <Button
                  color={view === 'day' ? 'primary' : 'light'}
                  onClick={() => setView('day')}
                >
                  Day
                </Button>
              </ButtonGroup>
            </Col>
          </Row>
            </CardHeader>
        <CardBody className="p-0">
          {view === 'month' && renderMonthView()}
          {view === 'week' && <div className="p-4 text-center text-muted">Week view coming soon...</div>}
          {view === 'day' && <div className="p-4 text-center text-muted">Day view coming soon...</div>}
        </CardBody>
        </Card>
      )}

      {/* Event Modal */}
      {!loading && (
      <Modal isOpen={showEventModal} toggle={() => setShowEventModal(false)} size="lg">
        <ModalHeader toggle={() => setShowEventModal(false)}>
          {editingEvent ? 'Edit Event' : 'Create Event'}
        </ModalHeader>
        <ModalBody>
          <Form>
            <Row>
              <Col md="6">
                <FormGroup>
                  <Label for="student">Student *</Label>
                  <Input
                    type="select"
                    id="student"
                    value={eventForm.student_id}
                    onChange={(e) => {
                      const studentId = e.target.value;
                      const student = students.find(s => s.id === parseInt(studentId));
                      setEventForm({ 
                        ...eventForm, 
                        student_id: studentId,
                        title: student ? `${eventForm.subject || 'Session'} - ${student.name}` : ''
                      });
                    }}
                  >
                    <option value="">Select a student</option>
                    {students.map(student => (
                      <option key={student.id} value={student.id}>
                        {student.name}
                      </option>
                    ))}
                  </Input>
                </FormGroup>
              </Col>
              <Col md="6">
                <FormGroup>
                  <Label for="subject">Subject *</Label>
                  <Input
                    type="select"
                    id="subject"
                    value={eventForm.subject}
                    onChange={(e) => {
                      const subject = e.target.value;
                      const student = students.find(s => s.id === parseInt(eventForm.student_id));
                      setEventForm({ 
                        ...eventForm, 
                        subject: subject,
                        title: student && subject ? `${subject} - ${student.name}` : '',
                        teacher_id: '' // Reset teacher when subject changes
                      });
                    }}
                    disabled={!eventForm.student_id}
                  >
                    <option value="">Select a subject</option>
                    {getStudentSubjectsWithSessions().map((subject) => (
                      <option 
                        key={subject.subject_id} 
                        value={subject.subject_name}
                        style={{ color: subject.remaining_sessions <= 0 ? 'red' : 'inherit' }}
                      >
                        {subject.subject_name} - {subject.remaining_sessions} sessions remaining
                      </option>
                    ))}
                  </Input>
                  {!eventForm.student_id && (
                    <small className="text-muted">Please select a student first</small>
                  )}
                </FormGroup>
              </Col>
            </Row>

            <Row>
              <Col md="6">
                <FormGroup>
                  <Label for="teacher">Teacher *</Label>
                  <Input
                    type="select"
                    id="teacher"
                    value={eventForm.teacher_id}
                    onChange={(e) => {
                      setEventForm({ 
                        ...eventForm, 
                        teacher_id: e.target.value
                      });
                    }}
                    disabled={!eventForm.subject}
                  >
                    <option value="">Select a teacher</option>
                    {teachers
                      .filter(teacher => teacher.subjects.includes(eventForm.subject))
                      .map(teacher => (
                        <option key={teacher.id} value={teacher.id}>
                          {teacher.name}
                        </option>
                      ))}
                  </Input>
                  {!eventForm.subject && (
                    <small className="text-muted">Please select a subject first</small>
                  )}
                </FormGroup>
              </Col>
              <Col md="6">
                {/* Empty column for spacing */}
              </Col>
            </Row>

            <FormGroup>
              <Label for="title">Session Title</Label>
              <Input
                type="text"
                id="title"
                value={eventForm.title}
                onChange={(e) => setEventForm({ ...eventForm, title: e.target.value })}
                placeholder="Auto-generated or enter custom title"
              />
                </FormGroup>

            <Row>
              <Col md="6">
                <FormGroup>
                  <Label for="date">Date</Label>
                  <Input
                    type="date"
                    id="date"
                    value={eventForm.date}
                    onChange={(e) => setEventForm({ ...eventForm, date: e.target.value })}
                  />
                </FormGroup>
              </Col>
              <Col md="3">
                <FormGroup>
                  <Label for="startTime">Start Time</Label>
                  <Input
                    type="time"
                    id="startTime"
                    value={eventForm.startTime}
                    onChange={(e) => setEventForm({ ...eventForm, startTime: e.target.value })}
                  />
                </FormGroup>
        </Col>
              <Col md="3">
                <FormGroup>
                  <Label for="endTime">End Time</Label>
                  <Input
                    type="time"
                    id="endTime"
                    value={eventForm.endTime}
                    onChange={(e) => setEventForm({ ...eventForm, endTime: e.target.value })}
                  />
                </FormGroup>
        </Col>
      </Row>

            <FormGroup>
              <Label>Color</Label>
              <div className="d-flex gap-2 mt-2">
                {eventColors.map(({ color, label }) => (
                  <div
                    key={color}
                    className={`color-option ${eventForm.color === color ? 'selected' : ''}`}
                    style={{ backgroundColor: color }}
                    onClick={() => setEventForm({ ...eventForm, color })}
                    title={label}
                  />
                ))}
              </div>
            </FormGroup>

            <FormGroup>
              <Label for="notes">Notes</Label>
              <Input
                type="textarea"
                id="notes"
                rows="3"
                value={eventForm.notes}
                onChange={(e) => setEventForm({ ...eventForm, notes: e.target.value })}
                placeholder="Add notes or description"
              />
            </FormGroup>

            {!editingEvent && (
              <FormGroup>
                <Label>Repeat</Label>
                <div className="d-flex gap-3 mt-2">
                  <div className="form-check">
                    <Input
                      type="radio"
                      id="no-repeat"
                      name="repeat"
                      checked={eventForm.repeat === 'no-repeat'}
                      onChange={() => handleRepeatChange('no-repeat')}
                    />
                    <Label check for="no-repeat">No repeat</Label>
                  </div>
                  <div className="form-check">
                    <Input
                      type="radio"
                      id="weekly"
                      name="repeat"
                      checked={eventForm.repeat === 'weekly'}
                      onChange={() => handleRepeatChange('weekly')}
                    />
                    <Label check for="weekly">Weekly (12 sessions)</Label>
                  </div>
                  <div className="form-check">
                    <Input
                      type="radio"
                      id="custom"
                      name="repeat"
                      checked={eventForm.repeat === 'custom'}
                      onChange={() => handleRepeatChange('custom')}
                    />
                    <Label check for="custom">Custom</Label>
                  </div>
                </div>
              </FormGroup>
            )}
          </Form>
        </ModalBody>
        <ModalFooter>
          {editingEvent && (
            <Button color="danger" onClick={handleDeleteEvent}>
              Delete
            </Button>
          )}
          <Button color="secondary" onClick={() => setShowEventModal(false)}>
            Cancel
          </Button>
          <Button color="primary" onClick={handleSaveEvent}>
            {editingEvent ? 'Update' : 'Save'}
          </Button>
        </ModalFooter>
      </Modal>
      )}

      {/* Custom Repeat Modal */}
      {!loading && (
      <Modal isOpen={showRepeatModal} toggle={() => setShowRepeatModal(false)}>
        <ModalHeader toggle={() => setShowRepeatModal(false)}>
          Custom Repeat
        </ModalHeader>
        <ModalBody>
              <Form>
            <Row>
              <Col md="6">
                <FormGroup>
                  <Label for="frequency">Frequency</Label>
                  <Input
                    type="select"
                    id="frequency"
                    value={eventForm.customRepeat?.frequency || 'weekly'}
                    onChange={(e) => setEventForm({
                      ...eventForm,
                      customRepeat: { ...(eventForm.customRepeat || {}), frequency: e.target.value }
                    })}
                  >
                    <option value="daily">Daily</option>
                    <option value="weekly">Weekly</option>
                    <option value="monthly">Monthly</option>
                  </Input>
                </FormGroup>
              </Col>
              <Col md="6">
                <FormGroup>
                  <Label for="interval">Every</Label>
                  <Input
                    type="number"
                    id="interval"
                    min="1"
                    max="100"
                    value={eventForm.customRepeat?.interval || 1}
                    onChange={(e) => setEventForm({
                      ...eventForm,
                      customRepeat: { ...(eventForm.customRepeat || {}), interval: parseInt(e.target.value) }
                    })}
                  />
                </FormGroup>
              </Col>
            </Row>

            <FormGroup>
              <Label>End</Label>
              <div className="d-flex gap-3 mt-2">
                <div className="form-check">
                  <Input
                    type="radio"
                    id="end-count"
                    name="endType"
                    checked={eventForm.customRepeat?.endType === 'count'}
                    onChange={() => setEventForm({
                      ...eventForm,
                      customRepeat: { ...(eventForm.customRepeat || {}), endType: 'count' }
                    })}
                  />
                  <Label check for="end-count">After</Label>
                </div>
                <div className="form-check">
                  <Input
                    type="radio"
                    id="end-never"
                    name="endType"
                    checked={eventForm.customRepeat?.endType === 'never'}
                    onChange={() => setEventForm({
                      ...eventForm,
                      customRepeat: { ...(eventForm.customRepeat || {}), endType: 'never' }
                    })}
                  />
                  <Label check for="end-never">Never</Label>
                </div>
              </div>
            </FormGroup>

            {eventForm.customRepeat?.endType === 'count' && (
              <FormGroup>
                <Label for="count">Number of occurrences</Label>
                <Input
                  type="number"
                  id="count"
                  min="1"
                  max="365"
                  value={eventForm.customRepeat?.count || 12}
                  onChange={(e) => setEventForm({
                    ...eventForm,
                    customRepeat: { ...(eventForm.customRepeat || {}), count: parseInt(e.target.value) }
                  })}
                />
                </FormGroup>
            )}
              </Form>
        </ModalBody>
        <ModalFooter>
          <Button color="secondary" onClick={() => setShowRepeatModal(false)}>
            Cancel
          </Button>
          <Button 
            color="primary" 
            onClick={() => {
              setShowRepeatModal(false);
              setEventForm({ ...eventForm, repeat: 'custom' });
            }}
          >
            Done
          </Button>
        </ModalFooter>
      </Modal>
      )}
    </div>
  );
};

export default SessionManager;