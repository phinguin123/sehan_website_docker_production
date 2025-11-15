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
import { Pencil, Trash2 } from "lucide-react";
import privateTutoringAxios from '../../utils/privateTutoringAxios';
import { handleAuthError } from '../../utils/privateTutoringAuth';

const TeacherManager = () => {
  const [teachers, setTeachers] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingTeacher, setEditingTeacher] = useState(null);
  const [alert, setAlert] = useState({ type: '', message: '', visible: false });
  const [searchTerm, setSearchTerm] = useState('');

  const [teacherForm, setTeacherForm] = useState({
    name: '',
    username: '',
    password: '',
    subjects: [] // Array of subject names
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      await Promise.all([
        fetchTeachers(),
        fetchSubjects()
      ]);
    } catch (error) {
      console.error('Error fetching data:', error);
      showAlert('danger', 'Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const fetchTeachers = async () => {
    try {
      const response = await privateTutoringAxios.get('/teachers');
      const teachersData = response.data || [];
      
      // Transform teacher data to include additional fields for display
      const transformedTeachers = teachersData.map(teacher => ({
        ...teacher,
        active_students: teacher.active_students || 0, // Default to 0 if not provided
        created_at: teacher.created_at || new Date().toISOString().split('T')[0]
      }));
      
      setTeachers(transformedTeachers);
    } catch (error) {
      console.error('Error fetching teachers:', error);
      handleAuthError(error);
      showAlert('danger', 'Failed to fetch teachers');
      setTeachers([]);
    }
  };

  const fetchSubjects = async () => {
    try {
      const response = await privateTutoringAxios.get('/subjects');
      const subjectsData = response.data || [];
      
      // Transform subject data to dropdown format
      const transformedSubjects = subjectsData.map(subject => ({
        value: subject.subject_name,
        label: subject.subject_name
      }));
      
      setSubjects(transformedSubjects);
    } catch (error) {
      console.error('Error fetching subjects:', error);
      handleAuthError(error);
      showAlert('danger', 'Failed to fetch subjects');
      setSubjects([]);
    }
  };

  const showAlert = (type, message) => {
    setAlert({ type, message, visible: true });
    setTimeout(() => setAlert({ ...alert, visible: false }), 5000);
  };

  const openModal = (teacher = null) => {
    if (teacher) {
      setEditingTeacher(teacher.teacher_id);
      setTeacherForm({
        name: teacher.name,
        username: teacher.username,
        password: '', // Don't populate password for security
        subjects: teacher.subjects || []
      });
    } else {
      setEditingTeacher(null);
      setTeacherForm({
        name: '',
        username: '',
        password: '',
        subjects: []
      });
    }
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingTeacher(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const teacherData = {
        name: teacherForm.name,
        username: teacherForm.username,
        subjects: teacherForm.subjects.filter(subject => subject !== '') // Remove empty subjects
      };

      // Only include password if it's provided (for updates) or if it's a new teacher
      if (teacherForm.password) {
        teacherData.password = teacherForm.password;
      }

      if (editingTeacher) {
        // Update teacher
        await privateTutoringAxios.put(`/teachers/${editingTeacher}`, teacherData);
        showAlert('success', 'Teacher updated successfully');
      } else {
        // Create new teacher
        await privateTutoringAxios.post('/teachers', teacherData);
        showAlert('success', 'Teacher created successfully');
      }
      
      await fetchTeachers(); // Refresh the teachers list
      closeModal();
    } catch (error) {
      console.error('Error saving teacher:', error);
      handleAuthError(error);
      showAlert('danger', 'Failed to save teacher');
    }
  };

  const handleDelete = async (teacherId) => {
    if (window.confirm('Are you sure you want to delete this teacher? This will also remove their assignments.')) {
      try {
        const response = await privateTutoringAxios.delete(`/teachers/${teacherId}`);
        showAlert('success', response.data.message || 'Teacher deleted successfully');
        await fetchTeachers(); // Refresh the teachers list
      } catch (error) {
        console.error('Error deleting teacher:', error);
        handleAuthError(error);
        
        // Show detailed error message from the backend
        const errorMessage = error.response?.data?.error || error.response?.data?.message || 'Failed to delete teacher';
        showAlert('danger', errorMessage);
      }
    }
  };

  const addSubject = () => {
    setTeacherForm({
      ...teacherForm,
      subjects: [...teacherForm.subjects, '']
    });
  };

  const removeSubject = (index) => {
    const newSubjects = teacherForm.subjects.filter((_, i) => i !== index);
    setTeacherForm({ ...teacherForm, subjects: newSubjects });
  };

  const updateSubject = (index, value) => {
    const newSubjects = [...teacherForm.subjects];
    newSubjects[index] = value;
    setTeacherForm({ ...teacherForm, subjects: newSubjects });
  };

  const filteredTeachers = teachers.filter(teacher =>
    teacher.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    teacher.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
    teacher.subjects.some(subject => subject.toLowerCase().includes(searchTerm.toLowerCase()))
  );

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
        <h2>Teacher Management</h2>
        <Button color="primary" onClick={() => openModal()}>
          Add New Teacher
        </Button>
      </div>

      {alert.visible && (
        <Alert color={alert.type} className="mb-4">
          {alert.message}
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
                  placeholder="Search teachers by name, username, or subject..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </InputGroup>
            </Col>
          </Row>
        </CardBody>
      </Card>

      {/* Teachers Table */}
      <Card>
        <CardHeader>
          <h5>Teachers ({filteredTeachers.length})</h5>
        </CardHeader>
        <CardBody>
          <Table responsive>
            <thead>
              <tr>
                <th>Name</th>
                <th>Username</th>
                <th>Subjects</th>
                <th>Active Students</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredTeachers.map((teacher) => (
                <tr key={teacher.teacher_id}>
                  <td><strong>{teacher.name}</strong></td>
                  <td><code>{teacher.username}</code></td>
                  <td>
                    {teacher.subjects?.map((subject, index) => (
                      <Badge key={index} color="info" className="me-1 mb-1">
                        {subject}
                      </Badge>
                    )) || 'No subjects'}
                  </td>
                  <td>
                    <Badge color="success">{teacher.active_students} students</Badge>
                  </td>
                  <td>
                    <div className="d-flex gap-2">
                      <UIButton
                        variant="outline"
                        size="icon"
                        onClick={() => openModal(teacher)}
                      >
                        <Pencil className="h-4 w-4" />
                      </UIButton>
                      <UIButton
                        variant="outline"
                        size="icon"
                        onClick={() => handleDelete(teacher.teacher_id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </UIButton>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </Table>
        </CardBody>
      </Card>

      {/* Teacher Modal */}
      <Modal isOpen={showModal} toggle={closeModal} size="lg">
        <ModalHeader toggle={closeModal}>
          {editingTeacher ? 'Edit Teacher' : 'Add New Teacher'}
        </ModalHeader>
        <Form onSubmit={handleSubmit}>
          <ModalBody>
            <Row>
              <Col md="6">
                <FormGroup>
                  <Label for="name">Teacher Name *</Label>
                  <Input
                    type="text"
                    id="name"
                    value={teacherForm.name}
                    onChange={(e) => setTeacherForm({ ...teacherForm, name: e.target.value })}
                    required
                  />
                </FormGroup>
              </Col>
              <Col md="6">
                <FormGroup>
                  <Label for="username">Username *</Label>
                  <Input
                    type="text"
                    id="username"
                    value={teacherForm.username}
                    onChange={(e) => setTeacherForm({ ...teacherForm, username: e.target.value })}
                    required
                  />
                </FormGroup>
              </Col>
            </Row>

            <FormGroup>
              <Label for="password">Password {editingTeacher ? '(leave blank to keep current)' : '*'}</Label>
              <Input
                type="password"
                id="password"
                value={teacherForm.password}
                onChange={(e) => setTeacherForm({ ...teacherForm, password: e.target.value })}
                required={!editingTeacher}
              />
            </FormGroup>

            <FormGroup>
              <div className="d-flex justify-content-between align-items-center mb-2">
                <Label>Subjects</Label>
                <Button type="button" size="sm" color="success" onClick={addSubject}>
                  Add Subject
                </Button>
              </div>
              {teacherForm.subjects.map((subject, index) => (
                <Row key={index} className="mb-2">
                  <Col md="10">
                    <Input
                      type="select"
                      value={subject}
                      onChange={(e) => updateSubject(index, e.target.value)}
                    >
                      <option value="">Select Subject</option>
                      {subjects.map((subj, i) => (
                        <option key={i} value={subj.value}>{subj.label}</option>
                      ))}
                    </Input>
                  </Col>
                  <Col md="2">
                    <Button
                      type="button"
                      size="sm"
                      color="danger"
                      onClick={() => removeSubject(index)}
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
              {editingTeacher ? 'Update' : 'Create'} Teacher
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

export default TeacherManager;
