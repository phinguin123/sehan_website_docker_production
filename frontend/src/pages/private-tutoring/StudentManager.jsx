import React, { useState, useEffect } from 'react';
import {
  Card,
  CardBody,
  CardHeader,
  Button,
  Table,
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
  Badge,
  Alert,
  InputGroup,
  InputGroupText
} from 'reactstrap';
import { Button as UIButton } from "@/components/ui/button";
import { Pencil, Trash2, Plus, FileText, DollarSign, ArrowLeftRight, UserPlus } from "lucide-react";
import privateTutoringAxios from '../../utils/privateTutoringAxios';
import { handleAuthError } from '../../utils/privateTutoringAuth';

// Utility function to validate session amounts (must be multiples of 0.5)
const isValidSessionAmount = (amount) => {
  const num = parseFloat(amount);
  if (isNaN(num) || num <= 0) return false;
  return num % 0.5 === 0;
};

const formatSessionAmount = (amount) => {
  const num = parseFloat(amount);
  if (isNaN(num)) return '';
  return Number(num.toFixed(1));
};

const StudentManager = () => {
  const [students, setStudents] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [grades, setGrades] = useState([]);
  const [applications, setApplications] = useState([]);
  const [subjectsLoading, setSubjectsLoading] = useState(true);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [showSessionModal, setShowSessionModal] = useState(false);
  const [showSessionManageModal, setShowSessionManageModal] = useState(false);
  const [showRecordsModal, setShowRecordsModal] = useState(false);
  const [showLedgerModal, setShowLedgerModal] = useState(false);
  const [editingStudent, setEditingStudent] = useState(null);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [selectedApplication, setSelectedApplication] = useState(null);
  const [ledgerData, setLedgerData] = useState([]);
  const [ledgerLoading, setLedgerLoading] = useState(false);
  const [alert, setAlert] = useState({ type: '', message: '', visible: false });
  const [searchTerm, setSearchTerm] = useState('');
  const [studentSessionData, setStudentSessionData] = useState(null);
  const [studentRecords, setStudentRecords] = useState(null);
  const [recordsLoading, setRecordsLoading] = useState(false);
  const [studentsProgress, setStudentsProgress] = useState([]);

  const [studentForm, setStudentForm] = useState({
    name: '',
    grade_id: '',
    school: '',
    parent_phone: '',
    subjects: []
  });

  const [sessionForm, setSessionForm] = useState({
    subject_name: '',
    total_sessions: '',
    application_type: 'initial',
    notes: ''
  });

  const subjectLevels = ['SL', 'HL'];

  useEffect(() => {
    fetchStudents();
    fetchSubjects();
    fetchGrades();
    fetchApplications();
    fetchStudentsProgress();
  }, []);

  const fetchStudents = async () => {
    try {
      const token = localStorage.getItem('pt_token');
      
      // Debug token
      console.log('Token from localStorage:', token);
      
      if (!token) {
        console.error('No token found in localStorage');
        showAlert('danger', 'Please log in again');
        // Redirect to login if no token
        window.location.href = '/private-tutoring/login';
        return;
      }
      
      const response = await privateTutoringAxios.get('/students');
      setStudents(response.data);

      // Cleanup: delete students with no subjects
      const studentsWithoutSubjects = (response.data || []).filter(s => !s.subjects || s.subjects.length === 0);
      if (studentsWithoutSubjects.length > 0) {
        for (const s of studentsWithoutSubjects) {
          try {
            await privateTutoringAxios.delete(`/students/${s.student_id}`);
          } catch (err) {
            console.error('Failed to delete student without subjects:', s.student_id, err);
          }
        }
        // Refresh list after cleanup
        const refreshed = await privateTutoringAxios.get('/students');
        setStudents(refreshed.data);
      }
      setLoading(false);
    } catch (error) {
      console.error('Error fetching students:', error);
      
      // If it's a token error, redirect to login
      if (error.response?.status === 401 || error.response?.data?.code === 'INVALID_TOKEN') {
        localStorage.removeItem('pt_token');
        localStorage.removeItem('pt_teacher_info');
        localStorage.removeItem('teacherName');
        showAlert('danger', 'Session expired. Please log in again.');
        window.location.href = '/private-tutoring/login';
        return;
      }
      
      showAlert('danger', 'Failed to fetch students');
      setLoading(false);
    }
  };

  const fetchGrades = async () => {
    try {
      const response = await privateTutoringAxios.get('/students/grades');
      setGrades(response.data);
    } catch (error) {
      console.error('Error fetching grades:', error);
      handleAuthError(error);
    }
  };

  const fetchSubjects = async () => {
    setSubjectsLoading(true);
    try {
      const token = localStorage.getItem('pt_token');
      
      if (!token) {
        console.error('No token found for subjects');
        showAlert('danger', 'Please log in again to access subjects');
        setSubjectsLoading(false);
        return;
      }
      
      console.log('Fetching subjects with token:', token.substring(0, 20) + '...');
      
      const response = await privateTutoringAxios.get('/subjects');
      
      console.log('Subjects response:', response.data);
      
      // Check if response.data is array and has the expected format
      if (Array.isArray(response.data)) {
        // Handle different response formats
        const formattedSubjects = response.data.map(subject => {
          // If the response already has value/label format
          if (subject.value && subject.label) {
            return {
              ...subject,
              subject_id: subject.subject_id || subject.id
            };
          }
          // If the response has subject_name format
          else if (subject.subject_name) {
            return {
              value: subject.subject_name,
              label: subject.subject_name,
              subject_id: subject.subject_id || subject.id
            };
          }
          // If the response is just strings
          else if (typeof subject === 'string') {
            return {
              value: subject,
              label: subject,
              subject_id: null // No ID available for string subjects
            };
          }
          // Default fallback
          return {
            value: subject.name || subject,
            label: subject.name || subject,
            subject_id: subject.subject_id || subject.id || null
          };
        });
        
        console.log('Formatted subjects:', formattedSubjects);
        setSubjects(formattedSubjects);
        
        if (formattedSubjects.length === 0) {
          showAlert('warning', 'No subjects available. Please contact administrator.');
        } else {
          console.log(`Successfully loaded ${formattedSubjects.length} subjects`);
        }
      } else {
        console.error('Invalid subjects response format:', response.data);
        showAlert('danger', 'Invalid subjects data received');
      }
    } catch (error) {
      console.error('Error fetching subjects:', error);
      
      // If it's a token error, redirect to login
      if (error.response?.status === 401 || error.response?.data?.code === 'INVALID_TOKEN') {
        localStorage.removeItem('pt_token');
        localStorage.removeItem('pt_teacher_info');
        localStorage.removeItem('teacherName');
        showAlert('danger', 'Session expired. Redirecting to login...');
        setTimeout(() => {
          window.location.href = '/private-tutoring/login';
        }, 1500);
        return;
      }
      
      showAlert('danger', 'Failed to load subjects. Please try refreshing the page.');
    } finally {
      setSubjectsLoading(false);
    }
  };

  const fetchApplications = async () => {
    try {
      const response = await privateTutoringAxios.get('/sessions/applications');
      setApplications(response.data || []);
    } catch (error) {
      console.error('Error fetching applications:', error);
      handleAuthError(error);
      setApplications([]);
    }
  };

  const fetchStudentsProgress = async () => {
    try {
      const response = await privateTutoringAxios.get('/students/progress');
      
      setStudentsProgress(response.data);
      
    } catch (error) {
      console.error('Error fetching students progress:', error);
      
      handleAuthError(error, showAlert);
      
      // Handle other errors if not an auth error
      if (error.response?.status !== 401) {
        const errorMessage = error.response?.data?.error || error.message || 'Failed to fetch session progress';
        console.error('Progress fetch error:', errorMessage);
        showAlert('danger', 'Failed to load session progress: ' + errorMessage);
      }
    }
  };

  const getStudentSessionProgress = (studentId) => {
    return studentsProgress.filter(progress => progress.student_id === studentId);
  };

  const getStudentMatchedSubjects = (studentId) => {
    if (!studentId) return [];
    
    // Get the student's matched subjects from their profile
    const student = students.find(s => s.student_id === parseInt(studentId));
    if (!student || !student.subjects) return [];
    
    // Return the subjects they are matched with, including subject_id lookup
    return student.subjects.map(subject => {
      const subjectName = subject.subject_name || subject.name;
      const subjectLevel = subject.subject_level || subject.level;
      
      // Find the subject_id from the subjects list by matching name
      const subjectFromList = subjects.find(s => s.value === subjectName || s.label === subjectName);
      const subjectId = subjectFromList ? subjectFromList.subject_id : null;
      
      return {
        subject_id: subjectId,
        subject_name: subjectName,
        subject_level: subjectLevel
      };
    });
  };

  const handleDeleteApplication = async (applicationId, subjectName, totalSessions) => {
    const confirmMessage = `Are you sure you want to cancel this session application?\n\n` +
                          `Subject: ${subjectName}\n` +
                          `Sessions: ${totalSessions}\n\n` +
                          `This action cannot be undone.`;
    
    if (window.confirm(confirmMessage)) {
      try {
        const token = localStorage.getItem('pt_token');
        
        if (!token) {
          showAlert('danger', 'Please log in again to delete applications');
          window.location.href = '/private-tutoring/login';
          return;
        }
        
        await privateTutoringAxios.delete(`/sessions/applications/${applicationId}`);
        
        showAlert('success', 'Session application cancelled successfully');
        fetchStudents();
        fetchStudentsProgress();
      } catch (error) {
        console.error('Error deleting session application:', error);
        
        // Handle token errors
        if (error.response?.status === 401 || error.response?.data?.code === 'INVALID_TOKEN') {
          localStorage.removeItem('pt_token');
          localStorage.removeItem('pt_teacher_info');
          localStorage.removeItem('teacherName');
          showAlert('danger', 'Session expired. Please log in again.');
          window.location.href = '/private-tutoring/login';
          return;
        }
        
        const errorMessage = error.response?.data?.error || error.response?.data?.message || 'Failed to delete application';
        showAlert('danger', errorMessage);
      }
    }
  };

  const handleRefundApplication = async (progress) => {
    const { student_id, subject_id, subject_name, remaining_sessions } = progress;
    
    const sessionsToRefund = window.prompt(
      `Partial Refund - ${subject_name}\n\n` +
      `Available balance: ${remaining_sessions} sessions\n\n` +
      `How many sessions to refund? (Must be a multiple of 0.5)`,
      '1.0'
    );
    
    if (!sessionsToRefund || sessionsToRefund === '0') return;
    
    const refundNum = parseFloat(sessionsToRefund);
    if (isNaN(refundNum) || refundNum <= 0 || refundNum > remaining_sessions) {
      showAlert('danger', `Invalid amount. Must be between 0.5 and ${remaining_sessions}`);
      return;
    }
    
    if (!isValidSessionAmount(refundNum)) {
      showAlert('danger', 'Invalid session amount. Must be a multiple of 0.5 (e.g., 1.0, 1.5, 2.0, etc.)');
      return;
    }
    
    const reason = window.prompt('Reason for refund:', 'Student requested partial refund');
    if (!reason) return;
    
    try {
      await privateTutoringAxios.post('/sessions/balances/refund', {
        student_id: student_id,
        subject_id: subject_id,
        sessions_to_refund: refundNum,
        refund_reason: reason
      });
      
      showAlert('success', `Refund processed: ${refundNum} sessions`);
      fetchStudentsProgress();
    } catch (error) {
      console.error('Error processing refund:', error);
      const errorMessage = error.response?.data?.error || 'Failed to process refund';
      showAlert('danger', errorMessage);
    }
  };

  const handleTransferSessions = async (progress) => {
    const { student_id, subject_id, subject_name, remaining_sessions } = progress;
    
    const sessionsToTransfer = window.prompt(
      `Transfer Sessions - ${subject_name}\n\n` +
      `Available balance: ${remaining_sessions} sessions\n\n` +
      `How many sessions would you like to transfer to another subject? (Must be a multiple of 0.5)`,
      '1.0'
    );
    
    if (!sessionsToTransfer) return;
    
    const transferNum = parseFloat(sessionsToTransfer);
    if (isNaN(transferNum) || transferNum <= 0 || transferNum > remaining_sessions) {
      showAlert('danger', `Invalid amount. Must be between 0.5 and ${remaining_sessions}`);
      return;
    }
    
    if (!isValidSessionAmount(transferNum)) {
      showAlert('danger', 'Invalid session amount. Must be a multiple of 0.5 (e.g., 1.0, 1.5, 2.0, etc.)');
      return;
    }

    // Simple subject selection using subjects from state
    if (!subjects || subjects.length === 0) {
      showAlert('danger', 'Subjects not loaded. Please refresh the page.');
      return;
    }
    
    const subjectOptions = subjects.map(subj => subj.label || subj.value).join(', ');
    const targetSubject = window.prompt(
      `Transfer to which subject?\n\n` +
      `Available subjects: ${subjectOptions}\n\n` +
      'Enter subject name exactly:'
    );
    
    if (!targetSubject) return;
    
    // Find subject ID from subjects list
    const targetSubjectData = subjects.find(subj => 
      (subj.label === targetSubject) || (subj.value === targetSubject)
    );
    
    if (!targetSubjectData || !targetSubjectData.subject_id) {
      showAlert('danger', 'Invalid subject name. Please use exact spelling.');
      return;
    }
    
    const reason = window.prompt('Reason for transfer:', `Student prefers ${targetSubject} over ${subject_name}`);
    if (!reason) return;
    
    try {
      await privateTutoringAxios.post('/sessions/balances/transfer-subject', {
        student_id: student_id,
        from_subject_id: subject_id,
        to_subject_id: targetSubjectData.subject_id,
        sessions_to_transfer: transferNum,
        transfer_reason: reason
      });
      
      showAlert('success', `Transfer processed: ${transferNum} sessions`);
      fetchStudentsProgress();
    } catch (error) {
      console.error('Error transferring sessions:', error);
      const errorMessage = error.response?.data?.error || 'Failed to transfer sessions';
      showAlert('danger', errorMessage);
    }
  };


  const handleTransferToSibling = async (progress) => {
    const { student_id, subject_id, subject_name, remaining_sessions } = progress;
    const applicationId = progress.application_id; // Keep for reference if needed
    try {
      // Simple sibling selection by parent_phone match
      // Fetch students list if not already loaded
      const siblings = students
        .filter(s => s.student_id !== student_id && s.parent_phone && students.find(src => src.student_id === student_id && src.parent_phone === s.parent_phone))
        .map(s => ({ id: s.student_id, name: s.name }));

      if (siblings.length === 0) {
        showAlert('warning', 'No siblings detected (same parent phone).');
        return;
      }

      const siblingOptions = siblings.map(s => `${s.id}:${s.name}`).join(', ');
      const siblingInput = window.prompt(`Transfer to which sibling?\nEnter as studentId (options: ${siblingOptions})`);
      if (!siblingInput) return;
      const toStudentId = parseInt(siblingInput.split(':')[0]);
      if (!toStudentId || !siblings.find(s => s.id === toStudentId)) {
        showAlert('danger', 'Invalid sibling selection');
        return;
      }

      const countInput = window.prompt(`How many sessions to transfer? (0.5..${remaining_sessions}, must be multiple of 0.5)`, `${remaining_sessions}`);
      if (!countInput) return;
      const sessionsToTransfer = parseFloat(countInput);
      if (isNaN(sessionsToTransfer) || sessionsToTransfer <= 0 || sessionsToTransfer > remaining_sessions) {
        showAlert('danger', `Invalid amount. Must be between 0.5 and ${remaining_sessions}`);
        return;
      }
      
      if (!isValidSessionAmount(sessionsToTransfer)) {
        showAlert('danger', 'Invalid session amount. Must be a multiple of 0.5 (e.g., 1.0, 1.5, 2.0, etc.)');
        return;
      }

      // Subject selection (default same)
      const subjectMap = subjects.reduce((acc, subj) => { acc[subj.subject_name] = subj.subject_id; return acc; }, {});
      const toSubject = window.prompt(`Transfer subject? Press Enter to keep '${subjectName}'. Or enter another subject name exactly.`);
      const toSubjectId = toSubject && subjectMap[toSubject] ? subjectMap[toSubject] : subjectId;

      const reason = window.prompt('Reason for sibling transfer:', 'Sibling requested to use remaining sessions');
      if (reason === null) return;

      await privateTutoringAxios.post('/sessions/balances/transfer-sibling', {
        from_student_id: student_id,
        to_student_id: toStudentId,
        subject_id: subject_id,
        sessions_to_transfer: sessionsToTransfer,
        transfer_reason: reason || ''
      });

      showAlert('success', 'Transferred remaining sessions to sibling.');
      fetchStudents();
      fetchStudentsProgress();
    } catch (error) {
      console.error('Error transferring to sibling:', error);
      const errorMessage = error.response?.data?.error || 'Failed to transfer to sibling';
      showAlert('danger', errorMessage);
    }
  };

  const handleAddSessions = async (progress) => {
    const { student_id, subject_id, subject_name } = progress;
    
    const sessionsToAdd = window.prompt(
      `Add Sessions - ${subject_name}\n\n` +
      `How many sessions to add? (Must be a multiple of 0.5)`,
      '1.0'
    );
    
    if (!sessionsToAdd || sessionsToAdd === '0') return;
    
    const addNum = parseFloat(sessionsToAdd);
    if (isNaN(addNum) || addNum <= 0) {
      showAlert('danger', 'Invalid amount. Must be positive');
      return;
    }
    
    if (!isValidSessionAmount(addNum)) {
      showAlert('danger', 'Invalid session amount. Must be a multiple of 0.5 (e.g., 1.0, 1.5, 2.0, etc.)');
      return;
    }
    
    const notes = window.prompt('Notes for adding sessions (optional):', 'Purchase additional sessions');
    if (notes === null) return;
    
    try {
      await privateTutoringAxios.post('/sessions/balances/add-sessions', {
        student_id: student_id,
        subject_id: subject_id,
        sessions_to_add: addNum,
        notes: notes || ''
      });
      
      showAlert('success', `Added ${addNum} sessions successfully`);
      fetchStudentsProgress();
    } catch (error) {
      console.error('Error adding sessions:', error);
      const errorMessage = error.response?.data?.error || 'Failed to add sessions';
      showAlert('danger', errorMessage);
    }
  };

  const handleViewLedger = async (progress) => {
    const { application_id, student_name, subject_name } = progress;
    
    try {
      setSelectedApplication(progress);
      setLedgerLoading(true);
      setShowLedgerModal(true);
      
      const response = await privateTutoringAxios.get(`/sessions/applications/${application_id}/ledger`);
      setLedgerData(response.data || []);
    } catch (error) {
      console.error('Error fetching ledger:', error);
      const errorMessage = error.response?.data?.error || 'Failed to fetch transaction ledger';
      showAlert('danger', errorMessage);
      setShowLedgerModal(false);
    } finally {
      setLedgerLoading(false);
    }
  };

  const exportLedgerToCSV = () => {
    if (!ledgerData || ledgerData.length === 0) {
      showAlert('warning', 'No ledger data to export');
      return;
    }

    const headers = ['Date', 'Transaction', 'Sessions Changed', 'Balance', 'Notes'];
    const csvContent = [
      headers.join(','),
      ...ledgerData.map(transaction => {
        const date = new Date(transaction.transaction_date).toLocaleDateString('en-US');
        const transaction_type = transaction.transaction_type.replace('_', ' ').toUpperCase();
        const sessionsChanged = transaction.sessions_changed || 0;
        const balance = transaction.balance_after || 'N/A';
        const notes = (transaction.notes || '').replace(/,/g, ';');
        
        return [date, transaction_type, sessionsChanged, balance, notes].join(',');
      })
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    
    const filename = `ledger_${selectedApplication?.student_name?.replace(/\s+/g, '_')}_${selectedApplication?.subject_name?.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.csv`;
    link.download = filename;
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
    
    showAlert('success', `Ledger exported as ${filename}`);
  };

  const showAlert = (type, message) => {
    setAlert({ type, message, visible: true });
    setTimeout(() => setAlert({ ...alert, visible: false }), 5000);
  };

  const openModal = (student = null) => {
    if (student) {
      setEditingStudent(student.student_id);
      setStudentForm({
        name: student.name,
        grade_id: student.grade_id || '',
        school: student.school || '',
        parent_phone: student.parent_phone || '',
        subjects: student.subjects && student.subjects.length > 0 
          ? student.subjects 
          : [{ subject_name: '', subject_level: '' }] // Ensure at least one subject field
      });
    } else {
      setEditingStudent(null);
      setStudentForm({
        name: '',
        grade_id: '',
        school: '',
        parent_phone: '',
        subjects: [{ subject_name: '', subject_level: '' }] // Start with one empty subject
      });
    }
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingStudent(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validation
    const errors = [];
    
    if (!studentForm.name?.trim()) {
      errors.push('Name is required');
    }
    
    if (!studentForm.grade_id?.trim()) {
      errors.push('Grade is required');
    }
    
    if (!studentForm.school?.trim()) {
      errors.push('School is required');
    }
    
    if (!studentForm.parent_phone?.trim()) {
      errors.push('Parent phone number is required');
    }
    
    if (!studentForm.subjects || studentForm.subjects.length === 0) {
      errors.push('At least one subject must be selected');
    } else {
      // Validate each subject has both name and level
      const incompleteSubjects = studentForm.subjects.some(subject => 
        !subject.subject_name?.trim() || !subject.subject_level?.trim()
      );
      if (incompleteSubjects) {
        errors.push('All subjects must have both name and level selected');
      }
    }
    
    if (errors.length > 0) {
      showAlert('danger', 'Please fix the following errors: ' + errors.join(', '));
      return;
    }
    
    try {
      if (editingStudent) {
        await privateTutoringAxios.put(`/students/${editingStudent}`, studentForm);
        showAlert('success', 'Student updated successfully');
      } else {
        await privateTutoringAxios.post('/students', studentForm);
        showAlert('success', 'Student created successfully');
      }
      fetchStudents();
      fetchStudentsProgress();
      closeModal();
    } catch (error) {
      console.error('Error saving student:', error);
      const errorMessage = error.response?.data?.error || error.response?.data?.message || 'Failed to save student';
      showAlert('danger', errorMessage);
    }
  };

  const handleDelete = async (studentId) => {
    if (window.confirm('Are you sure you want to delete this student? This will also delete all their sessions and schedules.')) {
      try {
        await privateTutoringAxios.delete(`/students/${studentId}`);
        
        showAlert('success', 'Student deleted successfully');
        fetchStudents();
        fetchStudentsProgress();
      } catch (error) {
        console.error('Error deleting student:', error);
        
        // Handle token errors
        if (error.response?.status === 401 || error.response?.data?.code === 'INVALID_TOKEN') {
          localStorage.removeItem('pt_token');
          localStorage.removeItem('pt_teacher_info');
          localStorage.removeItem('teacherName');
          showAlert('danger', 'Session expired. Please log in again.');
          window.location.href = '/private-tutoring/login';
          return;
        }
        
        const errorMessage = error.response?.data?.error || error.response?.data?.message || 'Failed to delete student';
        showAlert('danger', errorMessage);
      }
    }
  };

  const addSubject = () => {
    setStudentForm({
      ...studentForm,
      subjects: [...studentForm.subjects, { subject_name: '', subject_level: '' }]
    });
  };

  const removeSubject = (index) => {
    // Prevent removing the last subject (ensure at least one subject)
    if (studentForm.subjects.length <= 1) {
      showAlert('warning', 'At least one subject is required for each student');
      return;
    }
    const newSubjects = studentForm.subjects.filter((_, i) => i !== index);
    setStudentForm({ ...studentForm, subjects: newSubjects });
  };

  const updateSubject = (index, field, value) => {
    const newSubjects = [...studentForm.subjects];
    newSubjects[index] = { ...newSubjects[index], [field]: value };
    setStudentForm({ ...studentForm, subjects: newSubjects });
  };

  const openSessionModal = (student) => {
    setSelectedStudent(student);
    setSessionForm({
      subject_name: '',
      total_sessions: '',
      application_type: 'initial',
      notes: ''
    });
    setShowSessionModal(true);
  };

  const handleSessionSubmit = async (e) => {
    e.preventDefault();
    try {
      // Find the subject_id from the student's matched subjects
      const matchedSubjects = getStudentMatchedSubjects(selectedStudent.student_id);
      const selectedSubject = matchedSubjects.find(subject => 
        subject.subject_name === sessionForm.subject_name
      );
      
      if (!selectedSubject || !selectedSubject.subject_id) {
        showAlert('danger', 'Please select a valid subject for this student');
        return;
      }
      
      const sessionData = {
        student_id: selectedStudent.student_id,
        subject_id: selectedSubject.subject_id,
        initial_sessions: parseInt(sessionForm.total_sessions),
        application_type: sessionForm.application_type,
        notes: sessionForm.notes
      };
      
      await privateTutoringAxios.post('/sessions/applications', sessionData);
      showAlert('success', 'Session application created successfully');
      setShowSessionModal(false);
      fetchStudents();
      fetchStudentsProgress();
      fetchApplications(); // Refresh applications
    } catch (error) {
      console.error('Error creating session application:', error);
      const errorMessage = error.response?.data?.error || 'Failed to create session application';
      showAlert('danger', errorMessage);
    }
  };

  const openSessionManageModal = async (student) => {
    try {
      setSelectedStudent(student);
      const response = await privateTutoringAxios.get(`/students/${student.student_id}/summary`);
      setStudentSessionData(response.data);
      setShowSessionManageModal(true);
    } catch (error) {
      console.error('Error fetching student session data:', error);
      showAlert('danger', 'Failed to fetch student session data');
    }
  };

  const openStudentRecordsModal = async (student) => {
    try {
      setSelectedStudent(student);
      setRecordsLoading(true);
      setShowRecordsModal(true);
      
      const response = await privateTutoringAxios.get(`/students/${student.student_id}/sessions`);
      const sessions = response.data?.sessions || [];
      
      setStudentRecords({
        student: student,
        sessions: sessions
      });
      setRecordsLoading(false);
    } catch (error) {
      console.error('Error opening student records modal:', error);
      showAlert('danger', 'Error loading student records');
      setRecordsLoading(false);
    }
  };

  const updateSessionApplication = async (applicationId, newTotalSessions) => {
    try {
      await privateTutoringAxios.put(`/sessions/applications/${applicationId}`, {
        total_sessions: newTotalSessions,
        notes: `Updated total sessions to ${newTotalSessions}`
      });
      showAlert('success', 'Session application updated successfully');
      fetchStudentsProgress();
      openSessionManageModal(selectedStudent); // Refresh the modal data
    } catch (error) {
      console.error('Error updating session application:', error);
      showAlert('danger', error.response?.data?.error || 'Failed to update session application');
    }
  };

  const filteredStudents = students.filter(student =>
    student.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    student.grade.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (student.school && student.school.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  // Load data on component mount
  useEffect(() => {
    fetchStudents();
    fetchSubjects();
    fetchStudentsProgress();
  }, []);

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
        <h2>Student Management</h2>
        <div className="d-flex gap-2">
          <UIButton onClick={() => openModal()}>
            <Plus className="h-4 w-4 me-2" />
            Add New Student
          </UIButton>
        </div>
      </div>

      {alert.visible && (
        <Alert color={alert.type} className="mb-4">
          {alert.message}
        </Alert>
      )}

      {/* Debug Info - Remove in production */}
      {process.env.NODE_ENV === 'development' && (
        <Alert color="info" className="mb-4">
          <small>
            Debug: Subjects loaded: {subjects.length} | Loading: {subjectsLoading ? 'Yes' : 'No'} | 
            First subject: {subjects[0]?.label || 'None'}
          </small>
        </Alert>
      )}

      {/* Search */}
      <Card className="mb-4">
        <CardBody>
          <Row>
            <Col md="6">
              <InputGroup>
                <InputGroupText>🔍</InputGroupText>
                <Input
                  type="text"
                  placeholder="Search students by name, grade, or school..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </InputGroup>
            </Col>
          </Row>
        </CardBody>
      </Card>

      {/* Students Table */}
      <Card>
        <CardHeader>
          <h5>Students ({filteredStudents.length})</h5>
        </CardHeader>
        <CardBody>
          <Table responsive>
            <thead>
              <tr>
                <th>Name</th>
                <th>Grade</th>
                <th>School</th>
                <th>Parent Phone</th>
                <th>Subjects</th>
                <th>Hour Progress</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredStudents.map((student) => (
                <tr key={student.student_id}>
                  <td><strong>{student.name}</strong></td>
                  <td>{student.grade}</td>
                  <td>{student.school || 'N/A'}</td>
                  <td>{student.parent_phone || 'N/A'}</td>
                  <td>
                    {student.subjects?.map((subject, index) => (
                      <Badge key={index} color="info" className="me-1 mb-1">
                        {subject.subject_name}
                        {subject.subject_level && ` (${subject.subject_level})`}
                      </Badge>
                    )) || 'No subjects'}
                  </td>
                  <td>
                    {getStudentSessionProgress(student.student_id).map((progress, index) => {
                      const percentage = Math.round((progress.completed_sessions / progress.applied_sessions) * 100);
                      const progressColor = percentage >= 100 ? 'success' : percentage >= 80 ? 'warning' : 'info';
                      
                      return (
                        <div key={progress.application_id} className="mb-2" style={{ minWidth: '250px' }}>
                          <div className="d-flex justify-content-between align-items-center mb-1">
                            <small><strong>{progress.subject_name}</strong></small>
                            <small>{progress.completed_sessions}/{progress.applied_sessions}</small>
                          </div>
                          <div className="d-flex justify-content-between align-items-center mb-1">
                            <Badge 
                              color={progress.application_type === 'initial' ? 'primary' : 'secondary'} 
                              size="sm"
                            >
                              {progress.application_type}
                            </Badge>
                            {progress.notes && (
                              <small className="text-muted" title={progress.notes}>
                                📝
                              </small>
                            )}
                          </div>
                          <div className="progress" style={{ height: '8px' }}>
                            <div 
                              className={`progress-bar bg-${progressColor}`}
                              role="progressbar" 
                              style={{ width: `${percentage}%` }}
                              aria-valuenow={percentage}
                              aria-valuemin="0" 
                              aria-valuemax="100"
                            ></div>
                          </div>
                          <div className="d-flex justify-content-between align-items-center mt-1">
                            <small className="text-muted">{percentage}% complete</small>
                            <div className="d-flex align-items-center gap-1">
                              {percentage >= 100 && (
                                <Badge color="success" size="sm">Complete</Badge>
                              )}
                              {percentage >= 80 && percentage < 100 && (
                                <Badge color="warning" size="sm">Almost Done</Badge>
                              )}
                              {progress.completed_sessions === 0 && (
                                <UIButton
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleDeleteApplication(progress.application_id, progress.subject_name, progress.applied_sessions)}
                                  className="btn-sm p-1"
                                  style={{ fontSize: '10px', lineHeight: '1' }}
                                  title="Cancel this session application"
                                >
                                  ✕
                                </UIButton>
                              )}
                              {progress.completed_sessions > 0 && progress.remaining_sessions > 0 && (
                                <UIButton
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleRefundApplication(progress)}
                                  className="btn-sm p-1"
                                  style={{ fontSize: '10px', lineHeight: '1' }}
                                  title="Request partial refund"
                                >
                                  <DollarSign size={12} />
                                </UIButton>
                              )}
                              {progress.completed_sessions > 0 && progress.remaining_sessions > 0 && (
                                <UIButton
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleTransferSessions(progress)}
                                  className="btn-sm p-1"
                                  style={{ fontSize: '10px', lineHeight: '1' }}
                                  title="Transfer sessions to another subject"
                                >
                                  <ArrowLeftRight size={12} />
                                </UIButton>
                              )}
                              {progress.remaining_sessions > 0 && (
                                <UIButton
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleTransferToSibling(progress)}
                                  className="btn-sm p-1"
                                  style={{ fontSize: '10px', lineHeight: '1' }}
                                  title="Transfer remaining sessions to sibling"
                                >
                                  <UserPlus size={12} />
                                </UIButton>
                              )}
                              {/* Add Sessions Button - always available */}
                              <UIButton
                                variant="outline"
                                size="sm"
                                onClick={() => handleAddSessions(progress)}
                                className="btn-sm p-1"
                                style={{ fontSize: '10px', lineHeight: '1' }}
                                title="Add more sessions"
                              >
                                <Plus size={12} />
                              </UIButton>
                              {/* View Ledger Button - always available */}
                              <UIButton
                                variant="outline"
                                size="sm"
                                onClick={() => handleViewLedger(progress)}
                                className="btn-sm p-1"
                                style={{ fontSize: '10px', lineHeight: '1' }}
                                title="View transaction ledger"
                              >
                                <span style={{ fontSize: '10px' }}>🧾</span>
                              </UIButton>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                    {getStudentSessionProgress(student.student_id).length === 0 && (
                      <small className="text-muted">No hours applied yet</small>
                    )}
                  </td>
                  <td>

                    <UIButton
                      variant="outline"
                      size="icon"
                      onClick={() => openSessionModal(student)}
                      className="me-2"
                      title="Add initial sessions"
                    >
                      <Plus className="h-4 w-4" />
                    </UIButton>
                    <UIButton
                      variant="outline"
                      size="icon"
                      onClick={() => openStudentRecordsModal(student)}
                      className="me-2"
                      title="View student records"
                    >
                      <FileText className="h-4 w-4" />
                    </UIButton>
                    <UIButton
                      variant="outline"
                      size="icon"
                      onClick={() => openModal(student)}
                      className="me-2"
                      title="Edit student"
                    >
                      <Pencil className="h-4 w-4" />
                    </UIButton>
                    <UIButton
                      variant="outline"
                      size="icon"
                      onClick={() => handleDelete(student.student_id)}
                      className="me-2"
                      title="Delete student"
                    >
                      <Trash2 className="h-4 w-4" />
                    </UIButton>
                  </td>
                </tr>
              ))}
            </tbody>
          </Table>
        </CardBody>
      </Card>

      {/* Student Modal */}
      <Modal isOpen={showModal} toggle={closeModal} size="lg">
        <ModalHeader toggle={closeModal}>
          {editingStudent ? 'Edit Student' : 'Add New Student'}
        </ModalHeader>
        <Form onSubmit={handleSubmit}>
          <ModalBody>
            <Row>
              <Col md="6">
                <FormGroup>
                  <Label for="name">Name *</Label>
                  <Input
                    type="text"
                    id="name"
                    value={studentForm.name}
                    onChange={(e) => setStudentForm({ ...studentForm, name: e.target.value })}
                    required
                  />
                </FormGroup>
              </Col>
              <Col md="6">
                <FormGroup>
                  <Label for="grade_id">Grade *</Label>
                  <Input
                    type="select"
                    id="grade_id"
                    value={studentForm.grade_id}
                    onChange={(e) => setStudentForm({ ...studentForm, grade_id: e.target.value })}
                    required
                  >
                    <option value="">Select Grade</option>
                    {grades.map((grade) => (
                      <option key={grade.grade_id} value={grade.grade_id}>
                        {grade.grade}
                      </option>
                    ))}
                  </Input>
                </FormGroup>
              </Col>
            </Row>
            
            <Row>
              <Col md="6">
                <FormGroup>
                  <Label for="school">School *</Label>
                  <Input
                    type="text"
                    id="school"
                    value={studentForm.school}
                    onChange={(e) => setStudentForm({ ...studentForm, school: e.target.value })}
                    required
                  />
                </FormGroup>
              </Col>
              <Col md="6">
                <FormGroup>
                  <Label for="parent_phone">Parent Phone *</Label>
                  <Input
                    type="text"
                    id="parent_phone"
                    value={studentForm.parent_phone}
                    onChange={(e) => setStudentForm({ ...studentForm, parent_phone: e.target.value })}
                    required
                  />
                </FormGroup>
              </Col>
            </Row>

            <FormGroup>
              <div className="d-flex justify-content-between align-items-center mb-2">
                <Label>Subjects *</Label>
                <Button type="button" size="sm" color="success" onClick={addSubject}>
                  Add Subject
                </Button>
              </div>
              {(!studentForm.subjects || studentForm.subjects.length === 0) && (
                <small className="text-muted">Click "Add Subject" to add at least one subject for this student.</small>
              )}
              {studentForm.subjects.map((subject, index) => (
                <Row key={index} className="mb-2">
                  <Col md="6">
                    <Input
                      type="select"
                      value={subject.subject_name}
                      onChange={(e) => updateSubject(index, 'subject_name', e.target.value)}
                      disabled={subjectsLoading}
                      required
                    >
                      <option value="">
                        {subjectsLoading ? 'Loading subjects...' : 'Select Subject'}
                      </option>
                      {!subjectsLoading && subjects.length > 0 && subjects.map((subj, i) => (
                        <option key={i} value={subj.value}>{subj.label}</option>
                      ))}
                      {!subjectsLoading && subjects.length === 0 && (
                        <option value="" disabled>No subjects available</option>
                      )}
                    </Input>
                  </Col>
                  <Col md="4">
                    <Input
                      type="select"
                      value={subject.subject_level}
                      onChange={(e) => updateSubject(index, 'subject_level', e.target.value)}
                      required
                    >
                      <option value="">Select Level</option>
                      {subjectLevels.map((level, i) => (
                        <option key={i} value={level}>{level}</option>
                      ))}
                    </Input>
                  </Col>
                  <Col md="2">
                    <Button
                      type="button"
                      size="sm"
                      color="danger"
                      onClick={() => removeSubject(index)}
                      disabled={studentForm.subjects.length <= 1}
                      title={studentForm.subjects.length <= 1 ? "At least one subject is required" : "Remove subject"}
                    >
                      ×
                    </Button>
                  </Col>
                </Row>
              ))}
            </FormGroup>
          </ModalBody>
          <ModalFooter>
            <Button type="submit" color="primary">
              {editingStudent ? 'Update' : 'Create'} Student
            </Button>
            <Button type="button" color="secondary" onClick={closeModal}>
              Cancel
            </Button>
          </ModalFooter>
        </Form>
      </Modal>

      {/* Session Application Modal */}
      <Modal isOpen={showSessionModal} toggle={() => setShowSessionModal(false)}>
        <ModalHeader toggle={() => setShowSessionModal(false)}>
          Add Hours Application - {selectedStudent?.name}
        </ModalHeader>
        <Form onSubmit={handleSessionSubmit}>
          <ModalBody>
            <FormGroup>
              <Label for="subject_name">Subject *</Label>
              <Input
                type="select"
                id="subject_name"
                value={sessionForm.subject_name}
                onChange={(e) => setSessionForm({ ...sessionForm, subject_name: e.target.value })}
                disabled={!selectedStudent}
                required
              >
                <option value="">
                  {!selectedStudent ? 'Please select a student first' : 'Select Subject'}
                </option>
                {selectedStudent && getStudentMatchedSubjects(selectedStudent.student_id).map((subject) => (
                  <option 
                    key={subject.subject_id} 
                    value={subject.subject_name}
                  >
                    {subject.subject_name} {subject.subject_level && `(${subject.subject_level})`}
                  </option>
                ))}
                {selectedStudent && getStudentMatchedSubjects(selectedStudent.student_id).length === 0 && (
                  <option value="" disabled>No subjects matched for this student</option>
                )}
              </Input>
              {!selectedStudent && (
                <small className="text-muted">Please select a student first</small>
              )}
            </FormGroup>
            
            <FormGroup>
              <Label for="total_sessions">Total Hours * (Multiples of 0.5)</Label>
              <Input
                type="number"
                id="total_sessions"
                min="0.5"
                max="100"
                step="0.5"
                value={sessionForm.total_sessions}
                onChange={(e) => {
                  const value = e.target.value;
                  setSessionForm({ ...sessionForm, total_sessions: value });
                }}
                required
              />
              <small className="text-muted">Enter hours in increments of 0.5 (e.g., 1.0, 1.5, 2.0, etc.)</small>
            </FormGroup>
            
            <FormGroup>
              <Label for="application_type">Application Type</Label>
              <Input
                type="select"
                id="application_type"
                value={sessionForm.application_type}
                onChange={(e) => setSessionForm({ ...sessionForm, application_type: e.target.value })}
              >
                <option value="initial">Initial</option>
                <option value="additional">Additional</option>
                <option value="transfer">Transfer</option>
              </Input>
            </FormGroup>
            
            <FormGroup>
              <Label for="notes">Notes</Label>
              <Input
                type="textarea"
                id="notes"
                rows="3"
                value={sessionForm.notes}
                onChange={(e) => setSessionForm({ ...sessionForm, notes: e.target.value })}
                placeholder="Optional notes about this session application..."
              />
            </FormGroup>
          </ModalBody>
          <ModalFooter>
            <Button type="submit" color="primary">
              Create Session Application
            </Button>
            <Button type="button" color="secondary" onClick={() => setShowSessionModal(false)}>
              Cancel
            </Button>
          </ModalFooter>
        </Form>
      </Modal>

      {/* Session Management Modal */}
      <Modal isOpen={showSessionManageModal} toggle={() => setShowSessionManageModal(false)} size="lg">
        <ModalHeader toggle={() => setShowSessionManageModal(false)}>
          Manage Hours - {selectedStudent?.name}
        </ModalHeader>
        <ModalBody>
          {studentSessionData && (
            <div>
              <h6>Hour Applications</h6>
              <Table responsive className="mb-4">
                <thead>
                  <tr>
                    <th>Subject</th>
                    <th>Total Hours</th>
                    <th>Completed</th>
                    <th>Remaining</th>
                    <th>Type</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {studentSessionData.applications?.map((app, index) => (
                    <tr key={index}>
                      <td>{app.subject_name}</td>
                      <td>{app.total_sessions}</td>
                      <td>{app.completed_sessions || 0}</td>
                      <td>{app.total_sessions - (app.completed_sessions || 0)}</td>
                      <td>
                        <Badge color={app.application_type === 'initial' ? 'primary' : 'secondary'}>
                          {app.application_type}
                        </Badge>
                      </td>
                      <td>
                        <Badge color={
                          app.status === 'completed' ? 'success' : 
                          app.status === 'cancelled' ? 'danger' : 'warning'
                        }>
                          {app.status}
                        </Badge>
                      </td>
                      <td>
                        <div className="d-flex gap-1">
                          <Button
                            size="sm"
                            color="success"
                            onClick={() => {
                              const newTotal = prompt('Enter new total hours:', app.total_sessions);
                              if (newTotal && !isNaN(newTotal) && parseInt(newTotal) >= (app.completed_sessions || 0)) {
                                updateSessionApplication(app.application_id, parseInt(newTotal));
                              } else if (newTotal) {
                                alert('Invalid number or cannot be less than completed sessions');
                              }
                            }}
                          >
                            +
                          </Button>
                          <Button
                            size="sm"
                            color="warning"
                            onClick={() => {
                              const newTotal = prompt('Enter new total hours:', app.total_sessions);
                              if (newTotal && !isNaN(newTotal) && parseInt(newTotal) >= (app.completed_sessions || 0)) {
                                updateSessionApplication(app.application_id, parseInt(newTotal));
                              } else if (newTotal) {
                                alert('Invalid number or cannot be less than completed sessions');
                              }
                            }}
                          >
                            Edit
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </Table>

              {studentSessionData.recentSessions && studentSessionData.recentSessions.length > 0 && (
                <div>
                  <h6>Recent Sessions</h6>
                  <Table responsive>
                    <thead>
                      <tr>
                        <th>Date</th>
                        <th>Subject</th>
                        <th>Duration</th>
                        <th>Status</th>
                        <th>Notes</th>
                      </tr>
                    </thead>
                    <tbody>
                      {studentSessionData.recentSessions.slice(0, 5).map((session, index) => (
                        <tr key={index}>
                          <td>{new Date(session.start_time).toLocaleDateString()}</td>
                          <td>{session.subject_name}</td>
                          <td>{session.duration_hours}h</td>
                          <td>
                            <Badge color={
                              session.status === 'completed' ? 'success' : 
                              session.status === 'in_progress' ? 'warning' : 'info'
                            }>
                              {session.status}
                            </Badge>
                          </td>
                          <td>
                            <small>{session.session_notes || 'No notes'}</small>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </Table>
                </div>
              )}
            </div>
          )}
        </ModalBody>
        <ModalFooter>
          <Button color="secondary" onClick={() => setShowSessionManageModal(false)}>
            Close
          </Button>
        </ModalFooter>
      </Modal>

      {/* Ledger Modal */}
      <Modal isOpen={showLedgerModal} toggle={() => setShowLedgerModal(false)} size="xl">
        <ModalHeader toggle={() => setShowLedgerModal(false)}>
          Transaction Ledger - {selectedApplication?.student_name} - {selectedApplication?.subject_name}
        </ModalHeader>
        <ModalBody>
          {ledgerLoading ? (
            <div className="text-center p-4">
              <div className="spinner-border" role="status">
                <span className="sr-only">Loading ledger...</span>
              </div>
              <p className="mt-2">Loading transaction ledger...</p>
            </div>
          ) : ledgerData && ledgerData.length > 0 ? (
            <div>
              <div className="mb-3">
                <h6>Ledger for: {selectedApplication?.student_name} - {selectedApplication?.subject_name}</h6>
                <small className="text-muted">App #{selectedApplication?.application_id}</small>
              </div>
              
              <Table striped responsive className="mb-0">
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Transaction</th>
                    <th>Sessions Changed</th>
                    <th>Balance</th>
                    <th>Notes</th>
                  </tr>
                </thead>
                <tbody>
                  {ledgerData.map((transaction, index) => {
                    const balanceAfter = transaction.balance_after || 'N/A';
                    const sessionsChanged = parseFloat(transaction.sessions_changed || 0);
                    const isPositive = sessionsChanged > 0;
                    
                    return (
                      <tr key={index}>
                        <td>
                          {new Date(transaction.transaction_date).toLocaleDateString('en-US', {
                            month: 'short',
                            day: 'numeric', 
                            year: 'numeric'
                          })}
                        </td>
                        <td>
                          <Badge color={
                            transaction.transaction_type === 'purchase' ? 'success' :
                            transaction.transaction_type === 'usage' ? 'info' :
                            transaction.transaction_type === 'refund' ? 'warning' :
                            transaction.transaction_type === 'xfer_out' ? 'danger' :
                            transaction.transaction_type === 'xfer_in' ? 'primary' : 'secondary'
                          }>
                            {transaction.transaction_type.replace('_', ' ').toUpperCase()}
                          </Badge>
                        </td>
                        <td>
                          <span className={`fw-bold ${isPositive ? 'text-success' : 'text-danger'}`}>
                            {isPositive ? '+' : ''}{sessionsChanged}
                          </span>
                        </td>
                        <td>
                          <span className="fw-bold">{balanceAfter}</span>
                        </td>
                        <td>
                          <small className="text-muted">
                            {transaction.notes || '-'}
                          </small>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </Table>
              
              {/* Export functionality */}
              <div className="mt-4 d-flex justify-content-between align-items-center">
                <small className="text-muted">
                  {ledgerData.length} transactions recorded
                </small>
                <Button 
                  color="success" 
                  size="sm"
                  onClick={() => exportLedgerToCSV()}
                >
                  📄 Export to CSV
                </Button>
              </div>
            </div>
          ) : (
            <div className="text-center text-muted p-4">
              <p>No transaction history found for this application.</p>
              <small>Transactions will appear here after the first session activity.</small>
            </div>
          )}
        </ModalBody>
        <ModalFooter>
          <Button color="secondary" onClick={() => setShowLedgerModal(false)}>
            Close
          </Button>
        </ModalFooter>
      </Modal>

      {/* Student Records Modal */}
      <Modal isOpen={showRecordsModal} toggle={() => setShowRecordsModal(false)} size="xl">
        <ModalHeader toggle={() => setShowRecordsModal(false)}>
          Student Records - {selectedStudent?.name}
        </ModalHeader>
        <ModalBody>
          {recordsLoading ? (
            <div className="text-center p-4">
              <div className="spinner-border" role="status">
                <span className="sr-only">Loading...</span>
              </div>
              <p className="mt-2">Loading student records...</p>
            </div>
          ) : studentRecords ? (
            <div>
              <div className="mb-4">
                <h6>Student Information</h6>
                <div className="row">
                  <div className="col-md-3">
                    <strong>Name:</strong> {studentRecords.student.name}
                  </div>
                  <div className="col-md-2">
                    <strong>Grade:</strong> {studentRecords.student.grade}
                  </div>
                  <div className="col-md-4">
                    <strong>School:</strong> {studentRecords.student.school}
                  </div>
                  <div className="col-md-3">
                    <strong>Phone:</strong> {studentRecords.student.parent_phone}
                  </div>
                </div>
              </div>

              <h6>Session History ({studentRecords.sessions.length} sessions)</h6>
              <Table striped responsive>
                <thead>
                  <tr>
                    <th>Date & Time</th>
                    <th>Subject</th>
                    <th>Teacher</th>
                    <th>Duration</th>
                    <th>Status</th>
                    <th>Teacher Comments</th>
                  </tr>
                </thead>
                <tbody>
                  {studentRecords.sessions.map((session, index) => (
                    <tr key={index}>
                      <td>
                        <div className="d-flex flex-column">
                          <strong>{new Date(session.start_time).toLocaleDateString()}</strong>
                          <small className="text-muted">
                            {new Date(session.start_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </small>
                        </div>
                      </td>
                      <td>
                        <Badge color="primary">{session.subject_name}</Badge>
                      </td>
                      <td>{session.teacher_name}</td>
                      <td>{`${session.duration_hours} hours`}</td>
                      <td>
                        <Badge color={(session.status || '').toLowerCase() === 'completed' ? 'success' : 'warning'}>
                          {session.status || 'Completed'}
                        </Badge>
                      </td>
                      <td>
                        <div style={{ maxWidth: '300px', fontSize: '0.9em' }}>
                          {session.session_notes || 'No comments'}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </Table>

              {studentRecords.sessions.length === 0 && (
                <div className="text-center text-muted p-4">
                  <p>No session records found for this student.</p>
                </div>
              )}
            </div>
          ) : (
            <div className="text-center text-muted p-4">
              <p>No records available.</p>
            </div>
          )}
        </ModalBody>
        <ModalFooter>
          <Button color="secondary" onClick={() => setShowRecordsModal(false)}>
            Close
          </Button>
        </ModalFooter>
      </Modal>
    </div>
  );
};

export default StudentManager;
