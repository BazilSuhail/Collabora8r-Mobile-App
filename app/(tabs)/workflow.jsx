import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Alert,
  ScrollView,
  Dimensions,
  Modal,
  FlatList,
} from 'react-native';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { FontAwesome, FontAwesome5 } from '@expo/vector-icons';
import config from '@/config/config';
import decodeJWT from '@/config/decodeJWT';

const STATUS_TYPES = ['Not Started', 'In Progress', 'Completed'];

const TaskCard = ({ task, onPress }) => (
  <TouchableOpacity
    onPress={() => onPress(task)}
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
  </TouchableOpacity>
);

const Workflow = () => {
  const [tasks, setTasks] = useState({
    'Not Started': [],
    'In Progress': [],
    Completed: [],
  });
  const [selectedTask, setSelectedTask] = useState(null);
  const [updatedTasks, setUpdatedTasks] = useState({});
  const [isModalVisible, setModalVisible] = useState(false);

  useEffect(() => {
    const fetchTasks = async () => {
      try {
        const token = await AsyncStorage.getItem('token');
        if (!token) throw new Error('No token found, please sign in again.');

        const userId = decodeJWT(token);

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

  const openStatusModal = (task) => {
    setSelectedTask(task);
    setModalVisible(true);
  };

  const changeTaskStatus = (newStatus) => {
    if (!selectedTask) return;

    setTasks((prev) => {
      const oldStatus = selectedTask.status;
      const updatedTask = { ...selectedTask, status: newStatus };

      return {
        ...prev,
        [oldStatus]: prev[oldStatus].filter((t) => t._id !== selectedTask._id),
        [newStatus]: [...(prev[newStatus] || []), updatedTask],
      };
    });

    setUpdatedTasks((prev) => ({
      ...prev,
      [selectedTask._id]: newStatus,
    }));

    setModalVisible(false);
    setSelectedTask(null);
  };

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
    }
  };

  const renderItem = ({ item }) => (
    <TaskCard task={item} onPress={openStatusModal} />
  );

  return (
    <ScrollView contentContainerStyle={{ paddingBottom: 100, paddingHorizontal: 10 }}>
      <View style={{ marginBottom: 30 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <FontAwesome name="group" size={24} color="#6c757d" />
          <Text style={{ fontSize: 20, fontWeight: 'bold', color: '#6c757d', marginLeft: 10 }}>
            Task Workflow Manager
          </Text>
        </View>
      </View>

      {STATUS_TYPES.map((status) => (
        <View
          key={status}
          style={{
            marginVertical: 10,
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

          <FlatList
            data={tasks[status] || []}
            renderItem={renderItem}
            keyExtractor={(item) => item._id}
            scrollEnabled={false}
          />
        </View>
      ))}

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

      <Modal
        visible={isModalVisible}
        animationType="fade-in"
        transparent={true}
        onRequestClose={() => setModalVisible(false)}
      >
        <View
          style={{
            flex: 1,
            justifyContent: 'flex-end',
            backgroundColor: 'rgba(0, 0, 0, 0.4)',
          }}
        >
          <View
            style={{
              backgroundColor: 'white',
              padding: 20,
              borderTopLeftRadius: 20,
              borderTopRightRadius: 20,
            }}
          >
            <Text style={{ fontSize: 16, fontWeight: '600', marginBottom: 10 }}>
              Change Status
            </Text>
            {STATUS_TYPES.map((statusOption) => (
              <TouchableOpacity
                key={statusOption}
                onPress={() => changeTaskStatus(statusOption)}
                style={{
                  paddingVertical: 12,
                  borderBottomWidth: 1,
                  borderColor: '#eee',
                }}
              >
                <Text style={{ fontSize: 16 }}>{statusOption}</Text>
              </TouchableOpacity>
            ))}
            <TouchableOpacity onPress={() => setModalVisible(false)} style={{ marginTop: 15 }}>
              <Text style={{ textAlign: 'center', color: 'red' }}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
};

export default Workflow;
