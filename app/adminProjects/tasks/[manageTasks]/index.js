import { useState, useEffect } from 'react';
import axios from 'axios';
//import TaskModal from './CreateTaskModal';
import {
    View,
    Text,
    TouchableOpacity,
    FlatList,
    Image,
    StyleSheet,
    Modal,
    TextInput,
} from 'react-native';
import {
    FontAwesome5,
    FontAwesome,
} from '@expo/vector-icons';
import { usePathname } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import config from '@/Config/Config';

const AssignTasks = () => {
    //const { projectId } = useParams();
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

    const handleChange = (e) => {
        const { name, value } = e.target;
        setNewTask((prevState) => ({ ...prevState, [name]: value }));
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

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <FontAwesome5 name="folder" size={24} color="#4B5563" />
                <Text style={styles.headerText}>{projectName} Tasks</Text>
            </View>
            <Text style={styles.subText}>List of All projects Administered By you</Text>
            <View style={styles.divider} />

            <TouchableOpacity style={styles.createTaskButton} onPress={handleOpenModal}>
                <FontAwesome5 name="plus-square" size={18} color="#E0F2FE" style={styles.icon} />
                <Text style={styles.buttonText}>Create Task</Text>
            </TouchableOpacity>

            {projectTeam === 0 && (
                <Text style={styles.warningText}>
                    Kindly add a member to start assigning tasks
                </Text>
            )}

            <Text style={styles.sectionHeader}>
                <FontAwesome5 name="door-open" size={24} color="#4B5563" /> Existing Tasks
            </Text>

            <FlatList
                data={tasks}
                keyExtractor={(item) => item._id}
                renderItem={({ item }) => (
                    <View style={styles.taskRow}>
                        <Text style={styles.taskTitle}>{item.title.length > 15 ? `${item.title.slice(0, 15)}..` : item.title}</Text>
                        <Text style={[styles.taskPriority, styles[item.priority]]}>{item.priority}</Text>
                        <View style={styles.assignedTo}>
                            <Image
                                source={{ uri: `/Assets/${item.assignedTo.avatar}.jpg` }}
                                style={styles.avatar}
                            />
                            <Text style={styles.assignedToText}>
                                {item.assignedTo ? item.assignedTo.name : 'Unassigned'}
                            </Text>
                        </View>
                        <Text style={[styles.taskStatus, styles[item.status]]}>{item.status}</Text>
                        <View style={styles.actions}>
                            <TouchableOpacity onPress={() => handleEditTask(item)}>
                                <FontAwesome name="edit" size={24} color="#3B82F6" />
                            </TouchableOpacity>
                            <TouchableOpacity onPress={() => handleDeleteTask(item._id)}>
                                <FontAwesome name="trash" size={24} color="#EF4444" />
                            </TouchableOpacity>
                        </View>
                    </View>
                )}
            />

            {/* Task Modal 
            <Modal
                visible={isModalOpen}
                transparent={true}
                animationType="slide"
                onRequestClose={handleCloseModal}
            > 
            </Modal>*/}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#FFFFFF',
        padding: 16,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 8,
    },
    headerText: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#4B5563',
        marginLeft: 8,
    },
    subText: {
        fontSize: 13,
        color: '#9CA3AF',
        marginBottom: 8,
    },
    divider: {
        height: 2,
        backgroundColor: '#D1D5DB',
        marginBottom: 8,
    }
});

export default AssignTasks;
