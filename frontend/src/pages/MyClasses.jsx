import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getClasses, createClass, updateClass, deleteClass } from '../services/api';

function MyClasses() {
    const [classes, setClasses] = useState([]);
    const [newClassName, setNewClassName] = useState('');
    const [editingClass, setEditingClass] = useState(null);
    const [editingName, setEditingName] = useState('');

    useEffect(() => {
        fetchClasses();
    }, []);

    const fetchClasses = async () => {
        try {
            const response = await getClasses();
            setClasses(response.data);
        } catch (error) {
            console.error('Error fetching classes:', error);
            // Handle error (e.g., show a notification)
        }
    };

    const handleAddClass = async () => {
        if (newClassName.trim() === '') return;
        try {
            await createClass({ name: newClassName });
            setNewClassName('');
            fetchClasses(); // Re-fetch classes to show the new one
        } catch (error) {
            console.error('Error creating class:', error);
            alert(`Error creating class: ${error.response?.data?.detail || error.message}`);
        }
    };

    const handleDeleteClass = async (id) => {
        if (window.confirm('Вы уверены, что хотите удалить этот класс? Это действие необратимо.')) {
            try {
                await deleteClass(id);
                fetchClasses(); // Re-fetch classes
            } catch (error) {
                console.error('Error deleting class:', error);
            }
        }
    };

    const handleStartEditing = (cls) => {
        setEditingClass(cls);
        setEditingName(cls.name);
    };

    const handleCancelEditing = () => {
        setEditingClass(null);
        setEditingName('');
    };

    const handleUpdateClass = async (id) => {
        if (editingName.trim() === '') return;
        try {
            await updateClass(id, { name: editingName });
            setEditingClass(null);
            setEditingName('');
            fetchClasses();
        } catch (error) {
            console.error('Error updating class:', error);
            alert(`Error updating class: ${error.response?.data?.detail || error.message}`);
        }
    };

    return (
        <div className="container mx-auto p-4">
            <h1 className="text-2xl font-bold mb-4">Мои классы</h1>

            <div className="mb-4 flex">
                <input
                    type="text"
                    value={newClassName}
                    onChange={(e) => setNewClassName(e.target.value)}
                    placeholder="Название нового класса"
                    className="border p-2 rounded-l w-full md:w-1/3"
                />
                <button
                    onClick={handleAddClass}
                    className="bg-blue-500 text-white p-2 rounded-r"
                >
                    Создать
                </button>
            </div>

            <div className="bg-white shadow-md rounded-lg">
                <ul className="divide-y divide-gray-200">
                    {classes.map(cls => (
                        <li key={cls.id} className="p-4 flex justify-between items-center hover:bg-gray-50">
                            {editingClass && editingClass.id === cls.id ? (
                                <div className='flex-grow flex items-center'>
                                    <input 
                                        type="text" 
                                        value={editingName}
                                        onChange={(e) => setEditingName(e.target.value)}
                                        className='border p-2 rounded-l flex-grow'
                                    />
                                    <button onClick={() => handleUpdateClass(cls.id)} className='bg-green-500 text-white p-2'>Сохранить</button>
                                    <button onClick={handleCancelEditing} className='bg-gray-500 text-white p-2 rounded-r'>Отмена</button>
                                </div>
                            ) : (
                                <Link to={`/classes/${cls.id}`} className="text-xl text-indigo-600 hover:underline flex-grow">
                                    {cls.name}
                                </Link>
                            )}
                            
                            <div>
                                <button onClick={() => handleStartEditing(cls)} className="text-blue-500 mr-4">Переименовать</button>
                                <button onClick={() => handleDeleteClass(cls.id)} className="text-red-500">Удалить</button>
                            </div>
                        </li>
                    ))}
                </ul>
            </div>
        </div>
    );
}

export default MyClasses;
