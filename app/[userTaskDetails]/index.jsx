import React, { useEffect, useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  FlatList, ScrollView, Modal
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRoute } from '@react-navigation/native';
import config from '@/config/config';
import axios from 'axios';
import { FontAwesome, FontAwesome5 } from '@expo/vector-icons';
import Svg, { Circle } from 'react-native-svg';
import { usePathname } from 'expo-router';
import { useAuthContext } from '../../hooks/AuthProvider';

const JoinedTaskDetailsScreen = () => {
  const pathname = usePathname().split("/").pop();
  const [taskId, creatorId] = pathname.split("-");
  //console.log("task is " + taskId);
  //console.log("task is " + creatorId);
  const { user } = useAuthContext();
  //console.log("task is " + user._id);


  const [task, setTask] = useState(null);
  const [taskProgress, setTaskProgress] = useState(1);
  const [status, setStatus] = useState('Not Started');
  const [comments, setComments] = useState([]);
  const [commentContent, setCommentContent] = useState('');
  const [modalVisible, setModalVisible] = useState(false);
  const [creatorName, setCreatorName] = useState('');
  const [userId, setUserId] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      const token = await AsyncStorage.getItem('token');
      //const user = JSON.parse(await AsyncStorage.getItem('user')); 
      setUserId(user._id);


      const taskRes = await axios.get(`${config.VITE_REACT_APP_API_BASE_URL}/project-tasks/${taskId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      const commentRes = await axios.get(`${config.VITE_REACT_APP_API_BASE_URL}/comments/tasks/${taskId}/comments`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      console.log(commentRes.data)
      // const creatorRes = await axios.get(`${config.VITE_REACT_APP_API_BASE_URL}/users/${user._id}`, {
      //   headers: { Authorization: `Bearer ${token}` },
      // });


      setTask(taskRes.data);
      setTaskProgress(taskRes.data.progress);
      setStatus(taskRes.data.status);
      setComments(commentRes.data.comments);

      console.log("s85d")
      //setCreatorName(creatorRes.data.name);
      setLoading(false);
    };

    fetchData();
  }, []);

  const handleAddComment = async () => {
    if (!commentContent.trim()) return;
    const token = await AsyncStorage.getItem('token');
    const res = await axios.post(
      `${config.VITE_REACT_APP_API_BASE_URL}/comments/tasks/${taskId}/comments`,
      { content: commentContent },
      { headers: { Authorization: `Bearer ${token}` } }
    );
    setComments([...comments, res.data.comment]);
    setCommentContent('');
  };

  const updateStatus = async (newStatus) => {
    const token = await AsyncStorage.getItem('token');
    await axios.put(
      `${config.VITE_REACT_APP_API_BASE_URL}/project-tasks/${taskId}`,
      { status: newStatus },
      { headers: { Authorization: `Bearer ${token}` } }
    );
    setStatus(newStatus);
    setModalVisible(false);
  };

  const renderProgress = () => {
    const radius = 50;
    const strokeWidth = 8;
    const normalizedRadius = radius - strokeWidth / 2;
    const circumference = normalizedRadius * 2 * Math.PI;
    const strokeDashoffset = circumference - (taskProgress / 100) * circumference;

    return (
      <Svg height={radius * 2} width={radius * 2}>
        <Circle
          stroke="#E5E7EB"
          fill="transparent"
          strokeWidth={strokeWidth}
          r={normalizedRadius}
          cx={radius}
          cy={radius}
        />
        <Circle
          stroke="#10B981"
          fill="transparent"
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={`${circumference} ${circumference}`}
          strokeDashoffset={strokeDashoffset}
          r={normalizedRadius}
          cx={radius}
          cy={radius}
        />
      </Svg>
    );
  };

  if (loading) {
    return (
      <View className="flex-1 justify-center items-center">
        <Text className="text-lg text-gray-600">Loading.sdf..</Text>
      </View>
    );
  }

  return (
    <ScrollView className="flex-1 bg-white p-4">
      <Text className="text-2xl font-bold text-gray-800 mb-2">{task.title}</Text>
      <Text className="text-base text-gray-500 mb-4">By {user.name}</Text>

      <View className="items-center mb-6">
        {renderProgress()}
        <Text className="absolute top-[45px] text-lg font-semibold text-green-600">
          {taskProgress}%
        </Text>
      </View>

      <TouchableOpacity
        onPress={() => setModalVisible(true)}
        className="bg-blue-500 rounded-full px-4 py-2 self-center mb-4"
      >
        <Text className="text-white text-sm font-medium">Change Status</Text>
      </TouchableOpacity>

      <Modal
        visible={modalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setModalVisible(false)}
      >
        <View className="flex-1 justify-center items-center bg-black/40">
          <View className="bg-white p-6 rounded-xl w-4/5 space-y-4">
            <Text className="text-lg font-semibold text-gray-700">Set Task Status</Text>
            {['Not Started', 'In Progress', 'Completed'].map((s) => (
              <TouchableOpacity
                key={s}
                onPress={() => updateStatus(s)}
                className="p-3 bg-gray-100 rounded-lg"
              >
                <Text className="text-center text-gray-800">{s}</Text>
              </TouchableOpacity>
            ))}
            <TouchableOpacity onPress={() => setModalVisible(false)}>
              <Text className="text-center text-red-500 mt-2">Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      <Text className="text-lg font-semibold text-gray-800 mt-6 mb-2">Comments</Text>
      <View>
        {comments.map((item) => (
          <View key={item._id} className="bg-gray-100 rounded-md p-3 mb-2">
            <Text className="text-sm font-medium text-gray-700">{item.user.name}</Text>
            <Text className="text-sm font-medium text-gray-700">{item.user.email}</Text>

            <View>

              {item.userId === user._id && (
                <View style={{ flexDirection: 'row', justifyContent: 'flex-end', gap: 6 }}>
                  <TouchableOpacity onPress={() => handleStartEditing(comment)}>
                    <FontAwesome5
                      name="edit"
                      size={17}
                      color="#2563eb" // Tailwind's blue-600
                      style={{ marginTop: -1 }}
                    />
                  </TouchableOpacity>

                  <TouchableOpacity onPress={() => handleDeleteComment(comment._id)}>
                    <FontAwesome
                      name="trash-alt"
                      size={15}
                      color="#ef4444" // Tailwind's red-500
                    />
                  </TouchableOpacity>
                </View>
              )}
            </View>

            <Text className="text-gray-600">{item.content}</Text>
          </View>
        ))}
      </View>


      <View className="flex-row items-center space-x-2 mb-12">
        <TextInput
          className="flex-1 border border-gray-300 rounded-lg px-3 py-2"
          placeholder="Add a comment..."
          value={commentContent}
          onChangeText={setCommentContent}
        />
        <TouchableOpacity
          onPress={handleAddComment}
          className="bg-green-500 p-3 rounded-full"
        >
          <FontAwesome name="send" size={16} color="white" />
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
};

export default JoinedTaskDetailsScreen;
