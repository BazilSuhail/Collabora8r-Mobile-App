import { useState, useEffect } from 'react';
import axios from 'axios';
import {
    View,
    Text,
    TouchableOpacity,
    FlatList,
    Image,
    Modal,
    TextInput,
} from 'react-native';
import {
    FontAwesome5,
    FontAwesome,
    MaterialIcons,
    Ionicons,
} from '@expo/vector-icons';
import { usePathname } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import config from '@/config/config';
import TaskModal from '@/components/TaskModal';
import avatarImages from '@/constants/avatar';

const AssignTasks = () => {
    const projectId = usePathname().split("/").pop();
    const [isModalOpen, setModalOpen] = useState(false);
    const [projectName, setProjectName] = useState('');
    const [projectTeam, setProjectTeam] = useState('');
    const [tasks, setTasks] = useState([]);
    const [users, setUsers] = useState([]);
    const [newTask, setNewTask] = useState({
        title: '',
        description: '',
        status: 'Not Started',
        priority: 'Medium',
        dueDate: '',
        assignedTo: ''
    });
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [editingTaskId, setEditingTaskId] = useState(null);

    useEffect(() => {
        const fetchTasksAndUsers = async () => {
            try {
                const token = await AsyncStorage.getItem('token');
                const tasksResponse = await axios.get(`${config.VITE_REACT_APP_API_BASE_URL}/manageTasks/project/${projectId}`, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                setTasks(tasksResponse.data.validTasks);
                setProjectName(tasksResponse.data.projectName);
                setProjectTeam(tasksResponse.data.projectTeam);

                const usersResponse = await axios.get(`${config.VITE_REACT_APP_API_BASE_URL}/manageusers/${projectId}/get-all-users`, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                setUsers(usersResponse.data);
            } catch (err) {
                console.error(err);
                setError('Failed to fetch tasks or users.');
            }
        };

        fetchTasksAndUsers();
    }, [projectId]);

    const handleChange = (name, value) => {
        setNewTask({ ...newTask, [name]: value });
    };

    const handleCreateTask = async (e) => {
        e.preventDefault();
        try {
            const token = await AsyncStorage.getItem('token');
            await axios.post(
                `${config.VITE_REACT_APP_API_BASE_URL}/manageTasks`,
                { ...newTask, projectId },
                {
                    headers: { Authorization: `Bearer ${token}` }
                }
            );

            setSuccess('Task created successfully.');
            setNewTask({
                title: '',
                description: '',
                status: 'Not Started',
                priority: 'Medium',
                dueDate: '',
                assignedTo: ''
            });

            // Refresh the tasks list
            const tasksResponse = await axios.get(`${config.VITE_REACT_APP_API_BASE_URL}/manageTasks/project/${projectId}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setTasks(tasksResponse.data.validTasks);
            setProjectName(tasksResponse.data.projectName);
            setProjectTeam(tasksResponse.data.projectTeam);

            handleCloseModal();
        } catch (err) {
            console.error(err);
            setError('Failed to create task.');
        }
    };

    const handleEditTask = async (task) => {
        handleOpenModal();
        setEditingTaskId(task._id);
        setNewTask({
            title: task.title,
            description: task.description,
            status: task.status,
            priority: task.priority,
            dueDate: task.dueDate.split('T')[0],
            assignedTo: task.assignedTo ? task.assignedTo._id : ''
        });
    };

    const handleUpdateTask = async (e) => {
        e.preventDefault();
        try {
            const token = await AsyncStorage.getItem('token');
            await axios.patch(
                `${config.VITE_REACT_APP_API_BASE_URL}/manageTasks/${editingTaskId}`,
                newTask,
                {
                    headers: { Authorization: `Bearer ${token}` }
                }
            );

            setSuccess('Task updated successfully.');
            setEditingTaskId(null);
            setNewTask({
                title: '',
                description: '',
                status: 'Not Started',
                priority: 'Medium',
                dueDate: '',
                assignedTo: ''
            });

            const tasksResponse = await axios.get(`${config.VITE_REACT_APP_API_BASE_URL}/manageTasks/project/${projectId}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setTasks(tasksResponse.data.validTasks);

            handleCloseModal();
        } catch (err) {
            console.error(err);
            setError('Failed to update task.');
        }
    };

    const handleDeleteTask = async (taskId) => {
        try {
            const token = await AsyncStorage.getItem('token');
            await axios.delete(`${config.VITE_REACT_APP_API_BASE_URL}/manageTasks/${taskId}`, {
                headers: { Authorization: `Bearer ${token}` }
            });

            setSuccess('Task deleted successfully.');

            const tasksResponse = await axios.get(`${config.VITE_REACT_APP_API_BASE_URL}/manageTasks/project/${projectId}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setTasks(tasksResponse.data.validTasks);

        } catch (err) {
            console.error(err);
            setError('Failed to delete task.');
        }
    };

    const handleOpenModal = () => setModalOpen(true);
    const handleCloseModal = () => setModalOpen(false);

    const getPriorityColor = (priority) => {
        switch (priority) {
            case 'High':
                return 'bg-red-100 text-red-800';
            case 'Medium':
                return 'bg-yellow-100 text-yellow-800';
            case 'Low':
                return 'bg-green-100 text-green-800';
            default:
                return 'bg-gray-100 text-gray-800';
        }
    };

    const getStatusColor = (status) => {
        switch (status) {
            case 'Completed':
                return 'bg-green-100 text-green-800';
            case 'In Progress':
                return 'bg-blue-100 text-blue-800';
            case 'Not Started':
                return 'bg-gray-100 text-gray-800';
            default:
                return 'bg-gray-100 text-gray-800';
        }
    };

    const getPriorityIcon = (priority) => {
        switch (priority) {
            case 'High':
                return <MaterialIcons name="priority-high" size={16} color="#DC2626" />;
            case 'Medium':
                return <MaterialIcons name="horizontal-rule" size={16} color="#D97706" />;
            case 'Low':
                return <MaterialIcons name="expand-more" size={16} color="#059669" />;
            default:
                return <MaterialIcons name="horizontal-rule" size={16} color="#6B7280" />;
        }
    };

    const getStatusIcon = (status) => {
        switch (status) {
            case 'Completed':
                return <Ionicons name="checkmark-circle" size={16} color="#059669" />;
            case 'In Progress':
                return <MaterialIcons name="sync" size={16} color="#2563EB" />;
            case 'Not Started':
                return <MaterialIcons name="radio-button-unchecked" size={16} color="#6B7280" />;
            default:
                return <MaterialIcons name="radio-button-unchecked" size={16} color="#6B7280" />;
        }
    };

    return (
        <View className="flex-1 bg-gray-50 px-4 py-6">
            {/* Header Section */}
            <View className="mb-6">
                <View className="flex-row items-center mb-2">
                    <View className="bg-blue-100 p-2 rounded-full mr-3">
                        <FontAwesome5 name="folder-open" size={20} color="#3B82F6" />
                    </View>
                    <Text className="text-2xl font-bold text-gray-800">{projectName}</Text>
                </View>
                <Text className="text-sm text-gray-500 ml-12">Manage and track all project tasks</Text>
            </View>

            {/* Create Task Button */}
            <TouchableOpacity
                className="bg-blue-600 flex-row items-center justify-center py-3 px-6 rounded-xl mb-6 shadow-sm"
                onPress={handleOpenModal}
            >
                <FontAwesome5 name="plus" size={16} color="#FFFFFF" />
                <Text className="text-white font-semibold ml-2">Create New Task</Text>
            </TouchableOpacity>

            {/* Warning Message */}
            {projectTeam === 0 && (
                <View className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-6">
                    <View className="flex-row items-center">
                        <MaterialIcons name="warning" size={20} color="#F59E0B" />
                        <Text className="text-amber-800 ml-2 font-medium">
                            Add team members to start assigning tasks
                        </Text>
                    </View>
                </View>
            )}

            {/* Tasks Section Header */}
            <View className="flex-row items-center mb-4">
                <MaterialIcons name="task" size={24} color="#4B5563" />
                <Text className="text-lg font-semibold text-gray-700 ml-2">Tasks Overview</Text>
                <View className="bg-gray-200 px-2 py-1 rounded-full ml-auto">
                    <Text className="text-xs text-gray-600 font-medium">{tasks.length} tasks</Text>
                </View>
            </View>

            {/* Tasks List */}
            <FlatList
                data={tasks}
                keyExtractor={(item) => item._id}
                showsVerticalScrollIndicator={false}
                renderItem={({ item }) => (
                    <View className="bg-white rounded-xl p-4 mb-3 shadow-sm border border-gray-100">
                        {/* Task Header */}
                        <View className="flex-row items-start justify-between mb-3">
                            <View className="flex-1">
                                <Text className="text-lg font-semibold text-gray-800 mb-1">
                                    {item.title.length > 25 ? `${item.title.slice(0, 25)}...` : item.title}
                                </Text>
                                <Text className="text-sm text-gray-500 leading-5">
                                    {item.description?.length > 60 ? `${item.description.slice(0, 60)}...` : item.description}
                                </Text>
                            </View>

                            {/* Actions */}
                            <View className="flex-row items-center space-x-3 ml-4">
                                <TouchableOpacity
                                    className="p-2 bg-blue-50 rounded-lg"
                                    onPress={() => handleEditTask(item)}
                                >
                                    <FontAwesome name="edit" size={16} color="#3B82F6" />
                                </TouchableOpacity>
                                <TouchableOpacity
                                    className="p-2 bg-red-50 rounded-lg"
                                    onPress={() => handleDeleteTask(item._id)}
                                >
                                    <MaterialIcons name="delete-outline" size={16} color="#EF4444" />
                                </TouchableOpacity>
                            </View>
                        </View>

                        {/* Task Details */}
                        <View className="flex-row items-center justify-between">
                            {/* Priority */}
                            <View className={`flex-row items-center px-2 py-1 rounded-full ${getPriorityColor(item.priority)}`}>
                                {getPriorityIcon(item.priority)}
                                <Text className="text-xs font-medium ml-1">{item.priority}</Text>
                            </View>

                            {/* Status */}
                            <View className={`flex-row items-center px-2 py-1 rounded-full ${getStatusColor(item.status)}`}>
                                {getStatusIcon(item.status)}
                                <Text className="text-xs font-medium ml-1">{item.status}</Text>
                            </View>
                        </View>

                        {/* Assignee */}
                        <View className="flex-row items-center mt-3 pt-3 border-t border-gray-100">
                            <View className="flex-row items-center flex-1">
                                <Image
                                    source={avatarImages[item.assignedTo?.avatar]}
                                    className="w-8 h-8 rounded-full mr-3" 
                                />
                                <View>
                                    <Text className="text-sm font-medium text-gray-700">
                                        {item.assignedTo?.name || 'Unassigned'}
                                    </Text>
                                    <Text className="text-xs text-gray-500">
                                        {item.assignedTo?.email || 'No assignee'}
                                    </Text>
                                </View>
                            </View>

                            {/* Due Date */}
                            <View className="flex-row items-center">
                                <MaterialIcons name="schedule" size={14} color="#6B7280" />
                                <Text className="text-xs text-gray-500 ml-1">
                                    {item.dueDate ? new Date(item.dueDate).toLocaleDateString() : 'No due date'}
                                </Text>
                            </View>
                        </View>
                    </View>
                )}
                ListEmptyComponent={
                    <View className="bg-white rounded-xl p-8 items-center justify-center">
                        <MaterialIcons name="assignment" size={48} color="#D1D5DB" />
                        <Text className="text-gray-500 text-lg font-medium mt-4">No tasks yet</Text>
                        <Text className="text-gray-400 text-sm mt-2 text-center">
                            Create your first task to get started with project management
                        </Text>
                    </View>
                }
            />

            {/* Task Modal */}
            <TaskModal
                isOpen={isModalOpen}
                onClose={handleCloseModal}
                onSubmit={editingTaskId ? handleUpdateTask : handleCreateTask}
                newTask={newTask}
                users={users}
                handleChange={handleChange}
                editingTaskId={editingTaskId}
            />
        </View>
    );
};

export default AssignTasks;