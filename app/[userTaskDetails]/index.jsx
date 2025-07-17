import config from '@/config/config';
import { FontAwesome, FontAwesome5 } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import { usePathname } from 'expo-router';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Modal,
  ScrollView,
  Text, TextInput, TouchableOpacity,
  View
} from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import { useAuthContext } from '../../hooks/AuthProvider';

const JoinedTaskDetailsScreen = () => {
  const pathname = usePathname().split("/").pop();
  const [taskId] = pathname.split("-");
  const { user } = useAuthContext();

  const [task, setTask] = useState(null);
  const [taskProgress, setTaskProgress] = useState(1);
  const [status, setStatus] = useState('Not Started');
  const [comments, setComments] = useState([]);
  const [commentContent, setCommentContent] = useState('');
  const [modalVisible, setModalVisible] = useState(false);
  const [loading, setLoading] = useState(true);
  const [editCommentId, setEditCommentId] = useState(null);
  const [editCommentContent, setEditCommentContent] = useState('');
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const token = await AsyncStorage.getItem('token');
        const taskRes = await axios.get(
          `${config.VITE_REACT_APP_API_BASE_URL}/project-tasks/${taskId}`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        const commentRes = await axios.get(
          `${config.VITE_REACT_APP_API_BASE_URL}/comments/tasks/${taskId}/comments`,
          { headers: { Authorization: `Bearer ${token}` } }
        );

        setTask(taskRes.data);
        setTaskProgress(taskRes.data.progress);
        setStatus(taskRes.data.status);
        setComments(commentRes.data.comments);
        console.log(commentRes.data.comments)
      } catch (err) {
        console.error(err);
        setError("Failed to load task data.");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const handleAddComment = async () => {
    if (!commentContent.trim()) return;
    try {
      const token = await AsyncStorage.getItem('token')
      const userId = user._id

      const res = await axios.post(
        `${config.VITE_REACT_APP_API_BASE_URL}/comments/tasks/${taskId}/comments`,
        { content: commentContent, userId },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      // setComments((prev) => [...prev, res.data.comment]);
      const newComment = {
      ...res.data.comment,
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        avatar: user.avatar || null, // if you use avatar
      }
    };

    setComments((prev) => [...prev, newComment]);
    setCommentContent(''); 
    console.log("dss")

    } catch (err) {
      console.error(err);
      setError("Failed to add comment.");
    }
  };

  const handleStartEditing = (comment) => {
    setEditCommentId(comment._id);
    setEditCommentContent(comment.content);
  };

  const handleCancelEditing = () => {
    setEditCommentId(null);
    setEditCommentContent('');
  };

  const handleEditComment = async (commentId) => {
    try {
      const token = await AsyncStorage.getItem('token');
      const response = await axios.put(
        `${config.VITE_REACT_APP_API_BASE_URL}/comments/${commentId}`,
        { content: editCommentContent },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setComments((prev) =>
        prev.map((comment) =>
          comment._id === commentId
            ? { ...comment, content: response.data.comment.content }
            : comment
        )
      );
      handleCancelEditing();
    } catch (err) {
      console.error(err);
      setError("Failed to edit comment.");
    }
  };

  const handleDeleteComment = async (commentId) => {
    try {
      const token = await AsyncStorage.getItem('token');
      await axios.delete(`${config.VITE_REACT_APP_API_BASE_URL}/comments/${commentId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      setComments((prev) => prev.filter((comment) => comment._id !== commentId));
    } catch (err) {
      console.error(err);
      setError("Failed to delete comment.");
    }
  };

  const updateStatus = async (newStatus) => {
    try {
      const token = await AsyncStorage.getItem('token');
      await axios.put(
        `${config.VITE_REACT_APP_API_BASE_URL}/project-tasks/${taskId}`,
        { status: newStatus },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setStatus(newStatus);
    } catch (err) {
      console.error(err);
      setError("Failed to update status.");
    } finally {
      setModalVisible(false);
    }
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
        <ActivityIndicator size="large" color="#10B981" />
      </View>
    );
  }

  if (!task) {
    return (
      <View className="flex-1 justify-center items-center">
        <Text className="text-red-500">{error || "Task not found."}</Text>
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

      {/* Status Modal */}
      <Modal visible={modalVisible} transparent animationType="fade">
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

      <Text className="text-lg font-semibold text-gray-800 mt-6 mb-2">Comments</Text>

      {comments.map((item) => (
        <View key={item._id} className="bg-gray-100 rounded-md p-3 mb-2">
          <Text className="text-sm font-medium text-gray-700">{item.user?.name || 'Unknown User'}</Text>
          <Text className="text-xs text-gray-500">{item.user?.email || 'unkown'}</Text>

          {editCommentId === item._id ? (
            <>
              <TextInput
                value={editCommentContent}
                onChangeText={setEditCommentContent}
                className="border border-gray-300 rounded-md px-2 py-1 mt-2 mb-1"
              />
              <View className="flex-row space-x-2">
                <TouchableOpacity onPress={() => handleEditComment(item._id)}>
                  <Text className="text-blue-600">Save</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={handleCancelEditing}>
                  <Text className="text-red-500">Cancel</Text>
                </TouchableOpacity>
              </View>
            </>
          ) : (
            <>
              <Text className="text-gray-700 mt-1">{item.content}</Text>
              {item.user._id === user._id && (
                <View className="flex-row space-x-4 mt-2 justify-end">
                  <TouchableOpacity onPress={() => handleStartEditing(item)}>
                    <FontAwesome5 name="edit" size={17} color="#2563eb" />
                  </TouchableOpacity>
                  <TouchableOpacity onPress={() => handleDeleteComment(item._id)}>
                    <FontAwesome name="trash" size={15} color="#ef4444" />
                  </TouchableOpacity>
                </View>
              )}
            </>
          )}
        </View>
      ))}

     
    </ScrollView>
  );
};

export default JoinedTaskDetailsScreen;
