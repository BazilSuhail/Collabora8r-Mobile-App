import TaskModal from '@/components/TaskModal';
import config from '@/config/config';
import avatarImages from '@/constants/avatar';
import {
    FontAwesome,
    FontAwesome5,
    Ionicons,
    MaterialIcons,
} from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import { usePathname } from 'expo-router';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
    Image,
    ScrollView,
    Text,
    TouchableOpacity,
    View
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const AssignTasks = () => {
    const insets = useSafeAreaInsets();
    const projectId = usePathname().split("/").pop();
    
    const isMountedRef = useRef(true);
    
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
    const [loading, setLoading] = useState(false);
 
    useEffect(() => {
        return () => {
            isMountedRef.current = false;
        };
    }, []);

    const initialTaskState = useMemo(() => ({
        title: '',
        description: '',
        status: 'Not Started',
        priority: 'Medium',
        dueDate: '',
        assignedTo: ''
    }), []);

    const fetchTasksAndUsers = useCallback(async () => {
        if (loading) return; // Prevent multiple simultaneous fetches

        setLoading(true);
        try {
            const token = await AsyncStorage.getItem('token');

            // Parallel API calls for better performance
            const [tasksResponse, usersResponse] = await Promise.all([
                axios.get(`${config.VITE_REACT_APP_API_BASE_URL}/manageTasks/project/${projectId}`, {
                    headers: { Authorization: `Bearer ${token}` }
                }),
                axios.get(`${config.VITE_REACT_APP_API_BASE_URL}/manageusers/${projectId}/get-all-users`, {
                    headers: { Authorization: `Bearer ${token}` }
                })
            ]);

            // Only update state if component is still mounted
            if (isMountedRef.current) {
                setTasks(tasksResponse.data.validTasks); 
                setProjectName(tasksResponse.data.projectName);
                setProjectTeam(tasksResponse.data.projectTeam);
                setUsers(usersResponse.data);
                setError(''); // Clear any previous errors on successful fetch
            }
        } catch (err) {
            console.error('Fetch error:', err);
            if (isMountedRef.current) {
                setError('Failed to fetch tasks or users.');
            }
        } finally {
            if (isMountedRef.current) {
                setLoading(false);
            }
        }
    }, [projectId]); // Removed 'loading' from dependencies

    // Optimized refresh tasks function
    const refreshTasks = useCallback(async () => {
        try {
            const token = await AsyncStorage.getItem('token');
            const tasksResponse = await axios.get(`${config.VITE_REACT_APP_API_BASE_URL}/manageTasks/project/${projectId}`, {
                headers: { Authorization: `Bearer ${token}` }
            });

            if (isMountedRef.current) {
                setTasks(tasksResponse.data.validTasks);
                setProjectName(tasksResponse.data.projectName);
                setProjectTeam(tasksResponse.data.projectTeam);
            }
        } catch (err) {
            console.error('Refresh tasks error:', err);
            if (isMountedRef.current) {
                setError('Failed to refresh tasks.');
            }
        }
    }, [projectId]);

    // Fixed: Properly memoize handlers first
    const handleChange = useCallback((name, value) => {
        setNewTask(prev => ({ ...prev, [name]: value }));
    }, []);

    const resetTaskForm = useCallback(() => {
        setNewTask(initialTaskState);
        setEditingTaskId(null);
    }, [initialTaskState]);

    const handleCloseModal = useCallback(() => {
        setModalOpen(false);
        resetTaskForm();
        setError(''); // Clear errors when closing modal
    }, [resetTaskForm]);

    const handleCreateTask = useCallback(async () => {
        if (loading) return;

        setLoading(true);
        try {
            const token = await AsyncStorage.getItem('token');
            await axios.post(
                `${config.VITE_REACT_APP_API_BASE_URL}/manageTasks`,
                { ...newTask, projectId },
                { headers: { Authorization: `Bearer ${token}` } }
            );

            if (isMountedRef.current) {
                setSuccess('Task created successfully.');
                resetTaskForm();
                handleCloseModal();
                
                // Clear success message after delay
                setTimeout(() => {
                    if (isMountedRef.current) {
                        setSuccess('');
                    }
                }, 3000);
                
                // Refresh tasks after successful creation
                await refreshTasks();
            }
        } catch (err) {
            console.error('Create task error:', err);
            if (isMountedRef.current) {
                setError('Failed to create task.');
            }
        } finally {
            if (isMountedRef.current) {
                setLoading(false);
            }
        }
    }, [newTask, projectId, resetTaskForm, refreshTasks, handleCloseModal]);

    const handleUpdateTask = useCallback(async () => {
        if (loading || !editingTaskId) return;

        setLoading(true);
        try {
            const token = await AsyncStorage.getItem('token');  
            await axios.patch(
                `${config.VITE_REACT_APP_API_BASE_URL}/manageTasks/${editingTaskId}`,
                newTask,
                { headers: { Authorization: `Bearer ${token}` } }
            );

            if (isMountedRef.current) {
                setSuccess('Task updated successfully.');
                resetTaskForm();
                handleCloseModal();
                
                // Clear success message after delay
                setTimeout(() => {
                    if (isMountedRef.current) {
                        setSuccess('');
                    }
                }, 3000);
                
                // Refresh tasks after successful update
                await refreshTasks();
            }
        } catch (err) {
            //console.error('Update task error:', err);
            if (isMountedRef.current) {
                setError('Failed to update task. Assign/ ReAssign to some-one');
            }
        } finally {
            if (isMountedRef.current) {
                setLoading(false);
            }
        }
    }, [newTask, editingTaskId, resetTaskForm, refreshTasks, handleCloseModal]);

    // Fixed: Now this won't cause circular dependencies
    const modalSubmitHandler = useMemo(
        () => editingTaskId ? handleUpdateTask : handleCreateTask,
        [editingTaskId, handleUpdateTask, handleCreateTask]
    );

    const handleEditTask = useCallback((task) => {
        setModalOpen(true);
        setEditingTaskId(task._id);
        setNewTask({
            title: task.title,
            description: task.description,
            status: task.status,
            priority: task.priority,
            dueDate: task.dueDate ? task.dueDate.split('T')[0] : '',
            assignedTo: task.assignedTo
        });
    }, []);

    const handleDeleteTask = useCallback(async (taskId) => {
        if (loading) return;

        setLoading(true);
        try {
            const token = await AsyncStorage.getItem('token');
            await axios.delete(`${config.VITE_REACT_APP_API_BASE_URL}/manageTasks/${taskId}`, {
                headers: { Authorization: `Bearer ${token}` }
            });

            if (isMountedRef.current) {
                setSuccess('Task deleted successfully.');
                
                // Clear success message after delay
                setTimeout(() => {
                    if (isMountedRef.current) {
                        setSuccess('');
                    }
                }, 3000);
                
                await refreshTasks();
            }
        } catch (err) {
            console.error('Delete task error:', err);
            if (isMountedRef.current) {
                setError('Failed to delete task.');
            }
        } finally {
            if (isMountedRef.current) {
                setLoading(false);
            }
        }
    }, [refreshTasks]);

    const handleOpenModal = useCallback(() => setModalOpen(true), []);

    // Use useEffect to fetch data only once on mount
    useEffect(() => {
        fetchTasksAndUsers();
    }, [projectId]); // Only depend on projectId, not the entire function

    // Memoized utility functions to prevent re-creation on every render
    const getPriorityColor = useCallback((priority) => {
        const colorMap = {
            'High': 'bg-red-100 text-red-800',
            'Medium': 'bg-yellow-100 text-yellow-800',
            'Low': 'bg-green-100 text-green-800'
        };
        return colorMap[priority] || 'bg-gray-100 text-gray-800';
    }, []);

    const getStatusColor = useCallback((status) => {
        const colorMap = {
            'Completed': 'bg-green-100 text-green-800',
            'In Progress': 'bg-blue-100 text-blue-800',
            'Not Started': 'bg-gray-100 text-gray-800'
        };
        return colorMap[status] || 'bg-gray-100 text-gray-800';
    }, []);

    const getPriorityIcon = useCallback((priority) => {
        const iconMap = {
            'High': <MaterialIcons name="priority-high" size={16} color="#DC2626" />,
            'Medium': <MaterialIcons name="horizontal-rule" size={16} color="#D97706" />,
            'Low': <MaterialIcons name="expand-more" size={16} color="#059669" />
        };
        return iconMap[priority] || <MaterialIcons name="horizontal-rule" size={16} color="#6B7280" />;
    }, []);

    const getStatusIcon = useCallback((status) => {
        const iconMap = {
            'Completed': <Ionicons name="checkmark-circle" size={16} color="#059669" />,
            'In Progress': <MaterialIcons name="sync" size={16} color="#2563EB" />,
            'Not Started': <MaterialIcons name="radio-button-unchecked" size={16} color="#6B7280" />
        };
        return iconMap[status] || <MaterialIcons name="radio-button-unchecked" size={16} color="#6B7280" />;
    }, []);

    // Memoized computed values
    const tasksCount = useMemo(() => tasks.length, [tasks.length]);

    return (
        <ScrollView
            className={`flex-1 bg-gray-100`}
            contentContainerStyle={{
                paddingTop: insets.top + 16,
                paddingBottom: insets.bottom + 16,
                paddingHorizontal: 16
            }}
            showsVerticalScrollIndicator={false}
        >
            {/* Project Header */}
            <View className="bg-white rounded-2xl px-4 py-6 mb-5">
                <View className="flex-row justify-between items-start">
                    <View className="flex-row items-center flex-1">
                        <View className="w-16 h-[60px] bg-blue-600 rounded-2xl justify-center items-center mr-4">
                            <FontAwesome5 name="project-diagram" size={22} color="#FFFFFF" />
                        </View>
                        <View className="flex-1">
                            <Text className="text-[17px] font-bold text-gray-900 mb-1">{projectName}</Text>
                        </View>
                    </View>
                </View>
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
            <View className="flex-row bg-white rounded-xl p-4 items-center mb-4">
                <MaterialIcons name="task" size={24} color="#4B5563" />
                <Text className="text-lg font-semibold text-gray-700 ml-2">Tasks Overview</Text>
                <View className="bg-gray-200 px-3 py-1 rounded-full ml-auto">
                    <Text className="text-sm text-gray-600 font-medium">{tasksCount} tasks</Text>
                </View>
            </View>

            {/* Tasks List */}
            {tasks.length > 0 ? (
                tasks.map((item) => (
                    <View key={item._id} className="bg-white rounded-xl p-4 mb-3 shadow-sm border border-gray-100">
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
                                    className="p-2 bg-red-50 rounded-lg ml-2"
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
                ))
            ) : (
                // Empty State
                <View className="bg-white rounded-xl p-8 items-center justify-center">
                    <MaterialIcons name="assignment" size={48} color="#D1D5DB" />
                    <Text className="text-gray-500 text-lg font-medium mt-4">No tasks yet</Text>
                    <Text className="text-gray-400 text-sm mt-2 text-center">
                        Create your first task to get started with project management
                    </Text>
                </View>
            )}

            {/* Task Modal */}
            <TaskModal
                isOpen={isModalOpen}
                onClose={handleCloseModal}
                onSubmit={modalSubmitHandler}
                newTask={newTask}
                users={users}
                handleChange={handleChange}
                editingTaskId={editingTaskId}
                error={error}
                success={success}
            />
        </ScrollView>
    );
};

export default AssignTasks;