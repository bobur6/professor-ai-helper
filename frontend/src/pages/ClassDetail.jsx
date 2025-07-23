import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { toast } from 'react-toastify';
import * as api from '../services/api';


function ClassDetail() {
    const { classId } = useParams();
    const [classDetails, setClassDetails] = useState(null);
    const [sortConfig, setSortConfig] = useState({ key: 'full_name', direction: 'ascending' });
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    
    const [newStudentName, setNewStudentName] = useState('');
    const [newAssignmentTitle, setNewAssignmentTitle] = useState('');
    const [editingCell, setEditingCell] = useState(null); // { studentId, assignmentId }
    const [editingGrade, setEditingGrade] = useState('');

    // AI Chat state
    const [aiQuery, setAiQuery] = useState('');
    const [chatHistory, setChatHistory] = useState([]);
    const [isAiLoading, setIsAiLoading] = useState(false);

    // Edit states
    const [editingStudent, setEditingStudent] = useState(null);
    const [editingStudentName, setEditingStudentName] = useState('');
    const [editingAssignment, setEditingAssignment] = useState(null);
    const [editingAssignmentTitle, setEditingAssignmentTitle] = useState('');
    
    // Refs for input focus management
    const studentNameRef = useRef(null);
    const assignmentTitleRef = useRef(null);
    
    // Focus input when editing starts
    useEffect(() => {
        if (editingStudent !== null && studentNameRef.current) {
            studentNameRef.current.focus();
            studentNameRef.current.select();
        }
    }, [editingStudent]);

    useEffect(() => {
        if (editingAssignment !== null && assignmentTitleRef.current) {
            assignmentTitleRef.current.focus();
            assignmentTitleRef.current.select();
        }
    }, [editingAssignment]);


    // Report and import states
    const [isGeneratingReport, setIsGeneratingReport] = useState(false);
    const [reportData, setReportData] = useState(null);
    const [showReportModal, setShowReportModal] = useState(false);
    const [showUploadReportModal, setShowUploadReportModal] = useState(false);
    const [showImportModal, setShowImportModal] = useState(false);
    const [uploadedReportFile, setUploadedReportFile] = useState(null);
    const [isGeneratingFileReport, setIsGeneratingFileReport] = useState(false);
    const [isImporting, setIsImporting] = useState(false);

        const sortedStudents = useMemo(() => {
        if (!classDetails?.students) return [];
        let sortableItems = [...classDetails.students];
        if (sortConfig.key) {
            sortableItems.sort((a, b) => {
                if (a[sortConfig.key] < b[sortConfig.key]) {
                    return sortConfig.direction === 'ascending' ? -1 : 1;
                }
                if (a[sortConfig.key] > b[sortConfig.key]) {
                    return sortConfig.direction === 'ascending' ? 1 : -1;
                }
                return 0;
            });
        }
        return sortableItems;
    }, [classDetails, sortConfig]);

    const requestSort = (key) => {
        let direction = 'ascending';
        if (sortConfig.key === key && sortConfig.direction === 'ascending') {
            direction = 'descending';
        }
        setSortConfig({ key, direction });
    };

    const fetchDetails = useCallback(async () => {
        try {
            setLoading(true);
            const response = await api.getClassDetails(classId);
            // Ensure every student has a grades array
            const data = {
                ...response.data,
                students: response.data.students.map(student => ({
                    ...student,
                    grades: student.grades || []
                }))
            };
            setClassDetails(data);
            setError(null);
        } catch (err) {
            setError('Не удалось загрузить данные класса.');
            console.error('Error fetching class details:', err);
            if (err.response && err.response.status === 403) {
                // User does not have permission
            } else {
                // Failed to load class data
            }
        } finally {
            setLoading(false);
        }
    }, [classId]);

    useEffect(() => {
        fetchDetails();
    }, [fetchDetails]);

    const handleAddStudent = async () => {
        if (!newStudentName.trim()) return;
        try {
            const response = await api.addStudent(classId, { full_name: newStudentName.trim() });
            const newStudent = response.data;
            setClassDetails(prevDetails => ({
                ...prevDetails,
                students: [...(prevDetails.students || []), newStudent].sort((a, b) => a.full_name.localeCompare(b.full_name))
            }));
            setNewStudentName('');
            toast.success('Студент успешно добавлен');
        } catch (error) {
            console.error('Error adding student:', error);
            toast.error(`Ошибка при добавлении студента: ${error.response?.data?.detail || error.message}`);
        }
    };

    const handleAddAssignment = async () => {
        if (!newAssignmentTitle.trim()) return;
        try {
            const response = await api.addAssignment(classId, { title: newAssignmentTitle.trim() });
            const newAssignment = response.data;
            setClassDetails(prevDetails => ({
                ...prevDetails,
                assignments: [...(prevDetails.assignments || []), newAssignment]
            }));
            setNewAssignmentTitle('');
            toast.success('Задание успешно добавлено');
        } catch (error) {
            console.error('Failed to add assignment:', error);
            toast.error(`Ошибка при добавлении задания: ${error.response?.data?.detail || error.message}`);
        }
    };



    const handleRemoveStudent = async (studentId) => {
        if (window.confirm('Вы уверены, что хотите удалить этого студента? Все его оценки будут удалены.')) {
            try {
                await api.removeStudent(classId, studentId);
                setClassDetails(prevDetails => ({
                    ...prevDetails,
                    students: (prevDetails.students || []).filter(s => s.id !== studentId)
                }));
                toast.success('Студент успешно удалён');
            } catch (error) {
                console.error('Error removing student:', error);
                toast.error(`Ошибка при удалении студента: ${error.response?.data?.detail || error.message}`);
            }
        }
    };

    const handleEditStudent = (student) => {
        setEditingStudent(student.id);
        setEditingStudentName(student.full_name);
    };

    const handleSaveStudent = async (studentId) => {
        if (!editingStudentName.trim()) {
            setEditingStudent(null);
            return;
        }
        try {
            await api.updateStudent(classId, studentId, { full_name: editingStudentName.trim() });
            setClassDetails(prevDetails => ({
                ...prevDetails,
                students: (prevDetails.students || []).map(s => 
                    s.id === studentId ? { ...s, full_name: editingStudentName.trim() } : s
                ).sort((a, b) => a.full_name.localeCompare(b.full_name))
            }));
            setEditingStudent(null);
            setEditingStudentName('');
            toast.success('Данные студента обновлены');
        } catch (error) {
            console.error('Error updating student:', error);
            toast.error(`Ошибка при обновлении данных студента: ${error.response?.data?.detail || error.message}`);
        }
    };

    const handleCancelEditStudent = () => {
        setEditingStudent(null);
        setEditingStudentName('');
    };

    const handleRemoveAssignment = async (assignmentId) => {
        if (window.confirm('Вы уверены, что хотите удалить это задание? Все оценки по нему будут удалены.')) {
            try {
                await api.removeAssignment(classId, assignmentId);
                setClassDetails(prevDetails => ({
                    ...prevDetails,
                    assignments: (prevDetails.assignments || []).filter(a => a.id !== assignmentId)
                }));
                toast.success('Задание успешно удалено');
            } catch (error) {
                console.error('Error removing assignment:', error);
                toast.error(`Ошибка при удалении задания: ${error.response?.data?.detail || error.message}`);
            }
        }
    };

    const handleEditAssignment = (assignment) => {
        setEditingAssignment(assignment.id);
        setEditingAssignmentTitle(assignment.title);
    };

    const handleSaveAssignment = async (assignmentId) => {
        if (!editingAssignmentTitle.trim()) {
            setEditingAssignment(null);
            return;
        }
        try {
            await api.updateAssignment(classId, assignmentId, { title: editingAssignmentTitle.trim() });
            setClassDetails(prevDetails => ({
                ...prevDetails,
                assignments: (prevDetails.assignments || []).map(a => 
                    a.id === assignmentId ? { ...a, title: editingAssignmentTitle.trim() } : a
                )
            }));
            setEditingAssignment(null);
            setEditingAssignmentTitle('');
            toast.success('Задание успешно обновлено');
        } catch (error) {
            console.error('Error updating assignment:', error);
            toast.error(`Ошибка при обновлении задания: ${error.response?.data?.detail || error.message}`);
        }
    };

    const handleCancelEditAssignment = () => {
        setEditingAssignment(null);
        setEditingAssignmentTitle('');
    };

    const handleStartEditing = (studentId, assignmentId, currentGrade) => {
        setEditingCell({ studentId, assignmentId });
        setEditingGrade(currentGrade || '');
    };

    const handleGradeChange = (e) => {
        setEditingGrade(e.target.value);
    };

    const handleSaveGrade = async (studentId, assignmentId) => {
        try {
            const response = await api.updateGrade(classId, studentId, assignmentId, { 
                grade: editingGrade.trim() 
            });
            
            setClassDetails(prevDetails => {
                const updatedStudents = (prevDetails.students || []).map(student => {
                    if (student.id === studentId) {
                        const existingGradeIndex = (student.grades || []).findIndex(g => g.assignment_id === assignmentId);
                        let newGrades = [...(student.grades || [])];
                        
                        const updatedGrade = {
                            grade: response.data.grade,
                            assignment_id: assignmentId,
                            student_id: studentId,
                            id: existingGradeIndex >= 0 ? newGrades[existingGradeIndex].id : undefined
                        };
                        
                        if (existingGradeIndex >= 0) {
                            newGrades[existingGradeIndex] = updatedGrade;
                        } else {
                            newGrades.push(updatedGrade);
                        }
                        
                        return { ...student, grades: newGrades };
                    }
                    return student;
                });
                
                return { ...prevDetails, students: updatedStudents };
            });
            
            setEditingCell(null);
            setEditingGrade('');
            toast.success('Оценка успешно обновлена');
        } catch (error) {
            console.error('Error updating grade:', error);
            toast.error(`Ошибка при обновлении оценки: ${error.response?.data?.detail || error.message}`);
        }
    };



    // Report generation
    const handleGenerateReport = async () => {
        setIsGeneratingReport(true);
        try {
            // Собираем полные данные по классу для отчёта
            const classData = {
                name: classDetails?.name,
                students: classDetails?.students?.map(s => ({
                    id: s.id,
                    full_name: s.full_name,
                    grades: s.grades || []
                })),
                assignments: classDetails?.assignments?.map(a => ({
                    id: a.id,
                    title: a.title
                }))
            };
            // Формируем строку для отправки (можно JSON, можно табличку)
            const text = JSON.stringify(classData, null, 2);
            const response = await api.generateClassReport(text);
            setReportData(response.data?.report || 'Отчёт успешно сгенерирован.');
            setShowReportModal(true);
        } catch (error) {
            console.error("Error generating report:", error);
            setReportData('Не удалось сгенерировать отчёт. Пожалуйста, попробуйте снова.');
            setShowReportModal(true);
            toast.error(`Не удалось сгенерировать отчёт: ${error.response?.data?.detail || error.message}`);
        } finally {
            setIsGeneratingReport(false);
        }
    };
    
    // Generate report from uploaded file
    const handleFileReportUpload = (e) => {
        const file = e.target.files[0];
        if (file) {
            setUploadedReportFile(file);
        }
    };
    
    const handleGenerateFileReport = async () => {
        if (!uploadedReportFile) {
            alert('Пожалуйста, выберите файл для генерации отчёта.');
            return;
        }
        
        setIsGeneratingFileReport(true);
        try {
            const response = await api.generateFileReport(classId, uploadedReportFile);
            const report = response?.report || response?.data?.report || response?.data || 'Не удалось сгенерировать отчёт.';
            setReportData(typeof report === 'string' ? report : JSON.stringify(report));
            setShowReportModal(true);
            setShowUploadReportModal(false);
            setUploadedReportFile(null);
        } catch (error) {
            console.error("Error generating report from file:", error);
            setReportData('Не удалось сгенерировать отчёт из файла. Пожалуйста, проверьте формат файла и попробуйте снова.');
            setShowReportModal(true);
        } finally {
            setIsGeneratingFileReport(false);
        }
    };

    const handleImportData = async () => {
        if (!uploadedReportFile) {
            alert('Пожалуйста, выберите файл для импорта.');
            return;
        }

        setIsImporting(true);
        try {
            await api.importClassData(classId, uploadedReportFile);
            setShowImportModal(false);
            setUploadedReportFile(null);
            fetchDetails(); // Refresh data after import
            alert('Данные успешно импортированы!');
        } catch (error) {
            console.error('Error importing data:', error);
            alert('Не удалось импортировать данные.');
        } finally {
            setIsImporting(false);
        }
    };

    const handleAiQuery = async (e) => {
        e.preventDefault();
        if (!aiQuery.trim() || isAiLoading) return;

        const userMessage = { sender: 'user', text: aiQuery };
        setChatHistory(prev => [...prev, userMessage]);
        const currentQuery = aiQuery;
        setAiQuery('');
        setIsAiLoading(true);

        try {
            // Format class data for AI assistant
            const classContext = {
                name: classDetails?.name,
                students: classDetails?.students?.map(s => ({
                    id: s.id,
                    full_name: s.full_name,
                    grades: s.grades || []
                })),
                assignments: classDetails?.assignments?.map(a => ({
                    id: a.id,
                    title: a.title
                }))
            };
            
            // Convert class data to JSON string to send as document_text
            const documentText = JSON.stringify(classContext, null, 2);
            
            // Format chat history for AI
            const formattedHistory = chatHistory.map(msg => ({
                role: msg.sender === 'user' ? 'user' : 'assistant',
                content: msg.text
            }));
            
            // Call the AI service with class data as context
            const response = await api.queryClassAI(documentText, currentQuery, formattedHistory);
            
            if (!response.data || !response.data.message) {
                throw new Error('Invalid response from AI service');
            }
            
            const aiMessage = { 
                sender: 'ai', 
                text: response.data.message
            };
            
            setChatHistory(prev => [...prev, aiMessage]);
        } catch (error) {
            console.error('Error querying AI:', error);
            const errorMessage = { 
                sender: 'ai', 
                text: 'Произошла ошибка при обращении к ассистенту. Пожалуйста, попробуйте снова.' 
            };
            setChatHistory(prev => [...prev, errorMessage]);
        } finally {
            setIsAiLoading(false);
        }
    };

    const getGradeForStudent = (student, assignmentId) => {
        if (!student || !student.grades) return '';
        const grade = student.grades.find(g => g.assignment_id === assignmentId);
        return grade ? grade.grade : '';
    };

    if (loading) return <div className="container mx-auto p-4">Загрузка...</div>;
    if (error) return <div className="container mx-auto p-4 text-red-500">{error}</div>;
    if (!classDetails) return <div className="container mx-auto p-4">Класс не найден.</div>;

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Header */}
            <div className="bg-white shadow-sm border-b">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between items-center py-6">
                        <div>
                            <h1 className="text-3xl font-bold text-gray-900">{classDetails?.name}</h1>
                            <p className="mt-1 text-sm text-gray-500">
                                {classDetails?.students?.length || 0} студентов • {classDetails?.assignments?.length || 0} заданий
                            </p>
                        </div>
                        <div className="flex space-x-3">
                            <button 
                                onClick={() => setShowUploadReportModal(true)}
                                className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
                            >
                                📄 Отчет из документа
                            </button>
                            <button 
                                onClick={handleGenerateReport}
                                disabled={isGeneratingReport}
                                className="bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white px-4 py-2 rounded-lg font-medium transition-colors"
                            >
                                {isGeneratingReport ? '⏳ Генерация...' : '📊 Получить отчет'}
                            </button>
                            <button 
                                onClick={() => setShowImportModal(true)}
                                className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
                            >
                                📁 Импорт данных
                            </button>

                            {showImportModal && (
                                <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
                                    <div className="bg-white p-6 rounded-lg shadow-xl w-full max-w-md">
                                        <h3 className="text-lg font-bold mb-4">Импорт данных из файла</h3>
                                        <input 
                                            type="file" 
                                            onChange={(e) => setUploadedReportFile(e.target.files[0])} 
                                            className="w-full p-2 border rounded mb-4"
                                            accept=".csv,.xlsx"
                                        />
                                        <div className="flex justify-end gap-4">
                                            <button onClick={() => setShowImportModal(false)} className="px-4 py-2 rounded bg-gray-200 hover:bg-gray-300">Отмена</button>
                                            <button 
                                                onClick={handleImportData} 
                                                className="px-4 py-2 rounded bg-blue-500 text-white hover:bg-blue-600 disabled:bg-blue-300"
                                                disabled={!uploadedReportFile || isImporting}
                                            >
                                                {isImporting ? 'Импорт...' : 'Отправить'}
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            )}
                            {showUploadReportModal && (
                                <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
                                    <div className="bg-white p-6 rounded-lg shadow-xl w-full max-w-md">
                                        <h3 className="text-lg font-bold mb-4">Загрузка файла для отчета</h3>
                                        <input 
                                            type="file" 
                                            onChange={(e) => setUploadedReportFile(e.target.files[0])} 
                                            className="w-full p-2 border rounded mb-4"
                                            accept=".xlsx,.xls"
                                        />
                                        <div className="flex justify-end gap-4">
                                            <button onClick={() => setShowUploadReportModal(false)} className="px-4 py-2 rounded bg-gray-200 hover:bg-gray-300">Отмена</button>
                                            <button 
                                                onClick={handleGenerateFileReport} 
                                                className="px-4 py-2 rounded bg-blue-500 text-white hover:bg-blue-600 disabled:bg-blue-300"
                                                disabled={isGeneratingFileReport || !uploadedReportFile}
                                            >
                                                {isGeneratingFileReport ? 'Генерация...' : 'Сгенерировать отчет'}
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
                    {/* Main Table - 75% width */}
                    <div className="lg:col-span-3">
                        <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
                            <div className="overflow-x-auto">
                                <table className="min-w-full table-fixed">
                                    <thead className="bg-gray-50">
                                        <tr>
                                            <th className="w-64 px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider border-r cursor-pointer" onClick={() => requestSort('full_name')}>
                                                <div className="flex items-center justify-between">
                                                    <span>Студенты</span>
                                                    {sortConfig.key === 'full_name' && (
                                                        <span className="ml-2">{sortConfig.direction === 'ascending' ? '🔼' : '🔽'}</span>
                                                    )}
                                                </div>
                                            </th>
                                            {classDetails?.assignments?.map(assignment => (
                                                <th key={assignment.id} className="w-32 px-4 py-4 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider border-r">
                                                    <div className="flex items-center justify-center space-x-2">
                                                        {editingAssignment === assignment.id ? (
                                                            <div className="w-full">
                                                                <input 
                                                                    ref={assignmentTitleRef}
                                                                    type="text"
                                                                    value={editingAssignmentTitle}
                                                                    onChange={(e) => setEditingAssignmentTitle(e.target.value)}
                                                                    onBlur={() => handleSaveAssignment(assignment.id)}
                                                                    onKeyDown={e => {
                                                                        if (e.key === 'Enter') handleSaveAssignment(assignment.id);
                                                                        if (e.key === 'Escape') handleCancelEditAssignment();
                                                                    }}
                                                                    className="w-full px-2 py-1 text-center bg-white border border-blue-400 rounded focus:outline-none focus:ring-2 focus:ring-blue-300 focus:border-blue-400"
                                                                    style={{ minWidth: '120px' }}
                                                                />
                                                            </div>
                                                        ) : (
                                                            <span 
                                                                className="block w-full truncate cursor-pointer hover:text-blue-600 px-2 py-1"
                                                                onDoubleClick={() => handleEditAssignment(assignment)}
                                                                title={assignment.title}
                                                                style={{ maxWidth: '100%' }}
                                                            >
                                                                {assignment.title}
                                                            </span>
                                                        )}
                                                        <button 
                                                            onClick={() => handleRemoveAssignment(assignment.id)}
                                                            className="text-red-500 hover:text-red-600 transition-colors text-xl font-bold"
                                                            title="Удалить задание"
                                                        >
                                                            ×
                                                        </button>
                                                    </div>
                                                </th>
                                            ))}
                                            <th className="px-4 py-4 w-32">
                                                <input 
                                                    type="text" 
                                                    placeholder="+ Задание" 
                                                    value={newAssignmentTitle}
                                                    onChange={e => setNewAssignmentTitle(e.target.value)}
                                                    onBlur={handleAddAssignment}
                                                    onKeyPress={e => e.key === 'Enter' && handleAddAssignment()}
                                                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                                />
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody className="bg-white divide-y divide-gray-200">
                                        {sortedStudents.map((student, index) => (
                                            <tr key={student.id} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                                                <td className="w-64 px-6 py-4 border-r">
                                                    <div className="flex items-center justify-between w-full">
                                                        <div className="flex items-center min-w-0">
                                                            <div className="flex-shrink-0 w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center mr-3">
                                                                <span className="text-sm font-medium text-blue-600">
                                                                    {student.full_name.split(' ').map(n => n[0]).join('').toUpperCase()}
                                                                </span>
                                                            </div>
                                                            {editingStudent === student.id ? (
                                                                <div className="w-full">
                                                                <input 
                                                                    ref={studentNameRef}
                                                                    type="text"
                                                                    value={editingStudentName}
                                                                    onChange={(e) => setEditingStudentName(e.target.value)}
                                                                    onBlur={() => handleSaveStudent(student.id)}
                                                                    onKeyDown={e => {
                                                                        if (e.key === 'Enter') handleSaveStudent(student.id);
                                                                        if (e.key === 'Escape') handleCancelEditStudent();
                                                                    }}
                                                                    className="w-full px-2 py-1 text-left bg-white border border-blue-400 rounded focus:outline-none focus:ring-2 focus:ring-blue-300 focus:border-blue-400"
                                                                    style={{ minWidth: '150px' }}
                                                                />
                                                            </div>
                                                            ) : (
                                                                <span 
                                                                    className="block w-full truncate cursor-pointer hover:text-blue-600 px-2 py-1"
                                                                    onDoubleClick={() => handleEditStudent(student)}
                                                                    title={student.full_name}
                                                                >
                                                                    {student.full_name}
                                                                </span>
                                                            )}
                                                        </div>
                                                        <button 
                                                            onClick={() => handleRemoveStudent(student.id)}
                                                            className="text-red-500 hover:text-red-600 transition-colors text-xl font-bold"
                                                            title="Удалить студента"
                                                        >
                                                            ×
                                                        </button>
                                                    </div>
                                                </td>
                                                {classDetails.assignments.map(assignment => {
                                                    const grade = getGradeForStudent(student, assignment.id);
                                                    const isEditing = editingCell?.studentId === student.id && editingCell?.assignmentId === assignment.id;
                                                    
                                                    return (
                                                        <td 
                                                            key={assignment.id} 
                                                            className="px-4 py-4 text-center border-r cursor-pointer hover:bg-blue-50 transition-colors"
                                                            onDoubleClick={() => handleStartEditing(student.id, assignment.id, grade)}
                                                        >
                                                            {isEditing ? (
                                                                <input 
                                                                    type="text"
                                                                    value={editingGrade}
                                                                    onChange={handleGradeChange}
                                                                    onBlur={() => handleSaveGrade(student.id, assignment.id)}
                                                                    onKeyDown={e => {
                                                                        if (e.key === 'Enter') handleSaveGrade(student.id, assignment.id);
                                                                        if (e.key === 'Escape') {
                                                                            setEditingCell(null);
                                                                            setEditingGrade('');
                                                                        }
                                                                    }}
                                                                    autoFocus
                                                                    className="w-16 h-8 p-0 m-0 text-center bg-white border border-blue-400 rounded focus:outline-none focus:ring-2 focus:ring-blue-300 focus:border-blue-400"
                                                                    style={{ minWidth: '40px' }}
                                                                />
                                                            ) : (
                                                                <div className={`inline-flex items-center justify-center w-12 h-8 rounded-lg text-sm font-medium ${
                                                                    grade ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-400'
                                                                }`}>
                                                                    <span className="truncate px-1">{grade || '—'}</span>
                                                                </div>
                                                            )}
                                                        </td>
                                                    );
                                                })}
                                                <td></td>
                                            </tr>
                                        ))}
                                        {/* Add Student Row */}
                                        <tr className="bg-blue-50">
                                            <td className="px-6 py-4 border-r">
                                                <input 
                                                    type="text" 
                                                    placeholder="+ Добавить студента" 
                                                    value={newStudentName}
                                                    onChange={e => setNewStudentName(e.target.value)}
                                                    onBlur={handleAddStudent}
                                                    onKeyPress={e => e.key === 'Enter' && handleAddStudent()}
                                                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                                />
                                            </td>
                                            {classDetails?.assignments?.map(assignment => (
                                                <td key={assignment.id} className="px-4 py-4 border-r"></td>
                                            ))}
                                            <td></td>
                                        </tr>
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>

                    {/* AI Chat - 25% width */}
                    <div className="lg:col-span-1">
                        <div className="bg-white rounded-xl shadow-sm border h-[600px] flex flex-col">
                            <div className="px-6 py-4 border-b">
                                <h2 className="text-lg font-semibold text-gray-900 flex items-center">
                                    🤖 AI Ассистент
                                </h2>
                                <p className="text-sm text-gray-500 mt-1">Задавайте вопросы о классе</p>
                            </div>
                            
                            <div className="flex-1 overflow-y-auto p-4 space-y-4">
                                {chatHistory.length === 0 && (
                                    <div className="text-center text-gray-500 text-sm mt-8">
                                        <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                            💬
                                        </div>
                                        <p>Начните диалог с AI ассистентом</p>
                                        <p className="mt-2 text-xs">Примеры:</p>
                                        <div className="mt-2 space-y-1 text-xs">
                                            <p>"Добавь студента Иванов Иван"</p>
                                            <p>"Сгенерируй отчет"</p>
                                            <p>"Средний балл класса"</p>
                                        </div>
                                    </div>
                                )}
                                
                                {chatHistory.map((msg, index) => (
                                    <div key={index} className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                                        <div className={`max-w-xs px-4 py-2 rounded-lg text-sm ${
                                            msg.sender === 'user' 
                                                ? 'bg-blue-600 text-white' 
                                                : 'bg-gray-100 text-gray-800'
                                        }`}>
                                            <p className="whitespace-pre-wrap">{msg.text}</p>
                                        </div>
                                    </div>
                                ))}
                                
                                {isAiLoading && (
                                    <div className="flex justify-start">
                                        <div className="bg-gray-100 px-4 py-2 rounded-lg text-sm text-gray-600">
                                            <div className="flex items-center space-x-2">
                                                <div className="animate-spin w-4 h-4 border-2 border-gray-400 border-t-transparent rounded-full"></div>
                                                <span>Ассистент думает...</span>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                            
                            <div className="p-4 border-t">
                                <form onSubmit={handleAiQuery} className="flex space-x-2">
                                    <input
                                        type="text"
                                        value={aiQuery}
                                        onChange={(e) => setAiQuery(e.target.value)}
                                        placeholder="Напишите команду..."
                                        className="flex-1 px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                        disabled={isAiLoading}
                                    />
                                    <button
                                        type="submit"
                                        disabled={isAiLoading || !aiQuery.trim()}
                                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                    >
                                        ➤
                                    </button>
                                </form>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Report Modal */}
            {showReportModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-lg p-6 max-w-4xl w-full max-h-[90vh] overflow-y-auto">
                        <div className="flex justify-between items-center mb-4">
                            <h2 className="text-xl font-bold">Отчет по классу</h2>
                            <button 
                                onClick={() => setShowReportModal(false)}
                                className="text-gray-500 hover:text-gray-700"
                            >
                                ✕
                            </button>
                        </div>
                        <div className="whitespace-pre-wrap bg-gray-100 p-4 rounded markdown-content">
                            {reportData && reportData.split('\n').map((line, index) => {
                                // Обработка заголовков
                                if (line.startsWith('## ')) {
                                    return <h2 key={index} className="text-xl font-bold mt-4 mb-2">{line.replace('## ', '')}</h2>;
                                } else if (line.startsWith('### ')) {
                                    return <h3 key={index} className="text-lg font-bold mt-3 mb-1">{line.replace('### ', '')}</h3>;
                                } else if (line.startsWith('#### ')) {
                                    return <h4 key={index} className="text-md font-bold mt-2 mb-1">{line.replace('#### ', '')}</h4>;
                                }
                                // Обработка жирного текста
                                else if (line.includes('**')) {
                                    const parts = line.split('**');
                                    return (
                                        <p key={index} className="mb-2">
                                            {parts.map((part, i) => (
                                                i % 2 === 0 ? part : <strong key={i}>{part}</strong>
                                            ))}
                                        </p>
                                    );
                                } else if (line.trim() === '') {
                                    return <br key={index} />;
                                } else {
                                    return <p key={index} className="mb-2">{line}</p>;
                                }
                            })}
                        </div>
                    </div>
                </div>
            )}
            
            {/* Upload Report File Modal */}
            {showUploadReportModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-lg p-6 max-w-lg w-full">
                        <div className="flex justify-between items-center mb-4">
                            <h2 className="text-xl font-bold">Загрузить файл для отчета</h2>
                            <button 
                                onClick={() => {
                                    setShowUploadReportModal(false);
                                    setUploadedReportFile(null);
                                }}
                                className="text-gray-500 hover:text-gray-700"
                            >
                                ✕
                            </button>
                        </div>
                        <div className="mb-4">
                            <p className="text-gray-600 mb-2">Загрузите Excel файл с данными о студентах, заданиях и оценках для генерации отчета.</p>
                            <input 
                                type="file" 
                                accept=".xlsx,.xls" 
                                onChange={handleFileReportUpload}
                                className="w-full border border-gray-300 rounded p-2"
                            />
                            {uploadedReportFile && (
                                <p className="text-sm text-green-600 mt-1">Выбран файл: {uploadedReportFile.name}</p>
                            )}
                        </div>
                        <div className="flex justify-end">
                            <button
                                onClick={() => {
                                    setShowUploadReportModal(false);
                                    setUploadedReportFile(null);
                                }}
                                className="bg-gray-300 hover:bg-gray-400 text-gray-800 px-4 py-2 rounded-lg font-medium transition-colors mr-2"
                            >
                                Отмена
                            </button>
                            <button 
                                onClick={handleGenerateFileReport}
                                disabled={!uploadedReportFile || isGeneratingFileReport}
                                className="bg-purple-600 hover:bg-purple-700 disabled:bg-purple-400 text-white px-4 py-2 rounded-lg font-medium transition-colors"
                            >
                                {isGeneratingFileReport ? '⏳ Генерация...' : '📊 Сгенерировать отчет'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

export default ClassDetail;
