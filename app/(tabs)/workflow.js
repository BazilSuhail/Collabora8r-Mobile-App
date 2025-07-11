import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    TouchableOpacity,
    Alert,
    ScrollView,
    Dimensions,
} from 'react-native';
import DraggableFlatList from 'react-native-draggable-flatlist';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { FontAwesome, FontAwesome5 } from '@expo/vector-icons';
import config from '@/config/config';
import decodeJWT from '@/config/decodeJWT';

const { width } = Dimensions.get('window');

const STATUS_TYPES = ['Not Started', 'In Progress', 'Completed'];

const TaskCard = ({ task }) => (
    <View
        style={{
            padding: 10,
            backgroundColor: '#f9f9f9',
            borderWidth: 1,
            borderColor: '#ddd',
            borderRadius: 10,
            marginBottom: 10,
        }}
    >
        <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 5 }}>
            <FontAwesome5 name="tasks" size={18} color="#4a4a4a" />
            <Text style={{ marginLeft: 8, fontSize: 16, fontWeight: '600' }}>
                {task.title.slice(0, 17) || 'Untitled Task'}
                {task.title.length > 15 && '...'}
            </Text>
        </View>
        <Text style={{ fontSize: 14, color: '#d9534f', marginBottom: 5 }}>
            <Text style={{ fontWeight: '600' }}>Due: </Text>
            {task.dueDate ? new Date(task.dueDate.$date || task.dueDate).toLocaleDateString() : 'N/A'}
        </Text>
        <Text
            style={{
                fontSize: 12,
                color: '#ffffff',
                backgroundColor: '#007bff',
                alignSelf: 'flex-start',
                paddingVertical: 2,
                paddingHorizontal: 10,
                borderRadius: 15,
            }}
        >
            {task.projectName}
        </Text>
    </View>
);

const Workflow = () => {
    const [tasks, setTasks] = useState({
        NotStarted: [],
        InProgress: [],
        Completed: [],
    });
    const [updatedTasks, setUpdatedTasks] = useState({});
    const [usersId, setUsersId] = useState('');
    const [isModalVisible, setModalVisible] = useState(false);

    useEffect(() => {
        const fetchTasks = async () => {
            try {
                const token = await AsyncStorage.getItem('token');
                if (!token) throw new Error('No token found, please sign in again.');

                const userId = decodeJWT(token);
                setUsersId(userId);

                const response = await axios.get(
                    `${config.VITE_REACT_APP_API_BASE_URL}/overview/assigned-tasks`,
                    { headers: { Authorization: `Bearer ${token}` } }
                );

                const initialTasks = STATUS_TYPES.reduce((acc, status) => {
                    acc[status] = response.data.tasks.filter((task) => task.status === status);
                    return acc;
                }, {});

                setTasks(initialTasks);
            } catch (err) {
                Alert.alert('Error', err.message || 'Error fetching tasks');
            }
        };

        fetchTasks();
    }, []);

    const moveTask = (taskId, newStatus) => {
        setTasks((prevTasks) => {
            const task = Object.values(prevTasks).flat().find((t) => t._id === taskId);
            const updatedTask = { ...task, status: newStatus };

            setUpdatedTasks((prev) => ({ ...prev, [taskId]: newStatus }));

            const updatedTasks = { ...prevTasks };
            updatedTasks[task.status] = updatedTasks[task.status].filter((t) => t._id !== taskId);
            updatedTasks[newStatus] = [...(updatedTasks[newStatus] || []), updatedTask];

            return updatedTasks;
        });
    };

    const handleUpdate = () => setModalVisible(true);

    const confirmUpdate = async () => {
        const updates = Object.entries(updatedTasks).map(([taskId, newStatus]) => ({
            id: taskId,
            status: newStatus,
        }));

        try {
            await axios.patch(
                `${config.VITE_REACT_APP_API_BASE_URL}/projecttasks/tasks/update`,
                { updates }
            );
            Alert.alert('Success', 'Tasks updated successfully.');
        } catch (error) {
            Alert.alert('Error', 'Error updating tasks');
        } finally {
            setUpdatedTasks({});
            setModalVisible(false);
        }
    };

    const renderItem = ({ item, index, drag, isActive }) => (
        <TouchableOpacity
            style={{
                padding: 10,
                backgroundColor: isActive ? '#d1e7fd' : '#f9f9f9',
                borderWidth: 1,
                borderColor: '#ddd',
                borderRadius: 10,
                marginBottom: 10,
            }}
            onLongPress={drag}
        >
            <TaskCard task={item} />
        </TouchableOpacity>
    );

    // Handle the drop event (when a task is dropped into another column)
    const onDragEnd = ({ data, from, to }) => {
        const task = data[from];
        const newStatus = STATUS_TYPES[to];
    
        // If the task's status hasn't changed, no need to do anything
        if (task.status === newStatus) return;
    
        // Make a deep copy of the task to avoid any mutation of objects passed to worklets
        const updatedTask = { ...task, status: newStatus };
    
        // Remove the task from the previous status column
        const updatedTasks = { ...tasks };
        updatedTasks[task.status] = updatedTasks[task.status].filter(t => t._id !== task._id);
    
        // Add the updated task to the new status column
        updatedTasks[newStatus] = [...(updatedTasks[newStatus] || []), updatedTask];
    
        // Update the state to reflect the changes
        setTasks(updatedTasks);
        setUpdatedTasks((prev) => ({ ...prev, [task._id]: newStatus }));
    };
    
    

    return (
        <ScrollView>
            <View style={{ marginBottom: 30, flex: 1 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                    <FontAwesome name="group" size={24} color="#6c757d" />
                    <Text style={{ fontSize: 20, fontWeight: 'bold', color: '#6c757d', marginLeft: 10 }}>
                        Task Workflow Manager
                    </Text>
                </View>
            </View>
            <View style={{ flex: 1 }}>
                {STATUS_TYPES.map((status, index) => (
                    <View
                        key={status}
                        style={{
                            flex: 1,
                            minHeight: 240,
                            marginHorizontal: 5,
                            padding: 10,
                            backgroundColor: '#f8f8f8',
                            borderWidth: 1,
                            borderColor: '#ccc',
                            borderRadius: 10,
                        }}
                    >
                        <Text
                            style={{
                                fontSize: 16,
                                fontWeight: '600',
                                marginBottom: 10,
                                textAlign: 'center',
                                color:
                                    status === 'Not Started'
                                        ? '#007bff'
                                        : status === 'Completed'
                                        ? '#28a745'
                                        : '#ffc107',
                            }}
                        >
                            {status}
                        </Text>
                        <DraggableFlatList
                            data={tasks[status] || []}
                            renderItem={renderItem}
                            keyExtractor={(item) => item._id}
                            onDragEnd={({ data, from, to }) => {
                                onDragEnd({ data, from, to });
                                setTasks((prevTasks) => ({
                                    ...prevTasks,
                                    [status]: data,
                                }));
                            }}
                            onDragDrop={({ item, index, target }) => {
                                const targetStatus = STATUS_TYPES[target];

                                // Move task to the new status when dropped
                                moveTask(item._id, targetStatus);
                                onDragEnd({ item, index, target });
                            }}
                            animationDuration={200}  // Smooth animation for the task drag
                            lockScrollWhileDragging={true} // Prevent scrolling while dragging
                        />
                    </View>
                ))}
            </View>
            <TouchableOpacity
                onPress={confirmUpdate}
                style={{
                    marginTop: 20,
                    backgroundColor: '#007bff',
                    paddingVertical: 10,
                    borderRadius: 10,
                    alignItems: 'center',
                }}
            >
                <Text style={{ color: '#ffffff', fontSize: 16, fontWeight: '600' }}>Update Tasks</Text>
            </TouchableOpacity>
        </ScrollView>
    );
};

export default Workflow;
