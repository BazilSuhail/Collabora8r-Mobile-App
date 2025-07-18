import config from '@/config/config';
import { FontAwesome5, Ionicons, MaterialIcons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import { usePathname } from 'expo-router';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  ScrollView,
  StatusBar,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';
import {
  useSharedValue
} from 'react-native-reanimated';
import Svg, { Circle } from 'react-native-svg';
import ProgressModal from '../../components/ProgressModal';
import { useAuthContext } from '../../hooks/AuthProvider';

const TaskDetails = () => {
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

  // Animated values for slider
  const translateX = useSharedValue(0);
  const sliderWidth = 280;
  const thumbSize = 24;
  const [tempProgress, setTempProgress] = useState(1);
  const [tempStatus, setTempStatus] = useState('Not Started');

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
        setTempProgress(taskRes.data.progress);
        setTempStatus(taskRes.data.status);

        // Initialize slider position based on current progress
        translateX.value = (taskRes.data.progress / 100) * (sliderWidth - thumbSize);

      } catch (err) { 
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

      const newComment = {
        ...res.data.comment,
        user: {
          _id: user._id,
          name: user.name,
          email: user.email,
          avatar: user.avatar || null,
        }
      };

      setComments((prev) => [...prev, newComment]);
      setCommentContent('');

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

  const handleSaveChanges = async () => {
    try {
      const token = await AsyncStorage.getItem('token');
      await axios.put(
        `${config.VITE_REACT_APP_API_BASE_URL}/projecttasks/update-task-progress/${taskId}`,
        { progress: tempProgress, status: tempStatus },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      setTask((prev) => ({
        ...prev,
        progress: tempProgress,
        status: tempStatus,
      }));
      setTaskProgress(tempProgress);
      setStatus(tempStatus);
      setModalVisible(false);
    } catch (err) {
      console.error(err);
      setError("Failed to update task details.");
    }
  };

  const toggleModal = () => {
    if (!modalVisible) {
      // Reset temp values when opening modal
      setTempProgress(taskProgress);
      setTempStatus(status);
      translateX.value = (taskProgress / 100) * (sliderWidth - thumbSize);
    }
    setModalVisible(!modalVisible);
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'Not Started':
        return { bg: 'bg-gray-100', text: 'text-gray-700', icon: 'time-outline' };
      case 'In Progress':
        return { bg: 'bg-blue-100', text: 'text-blue-700', icon: 'play-circle-outline' };
      case 'Completed':
        return { bg: 'bg-green-100', text: 'text-green-700', icon: 'checkmark-circle-outline' };
      default:
        return { bg: 'bg-gray-100', text: 'text-gray-700', icon: 'clock-outline' };
    }
  };

  const renderProgress = () => {
    const radius = 60;
    const strokeWidth = 8;
    const normalizedRadius = radius - strokeWidth / 2;
    const circumference = normalizedRadius * 2 * Math.PI;
    const strokeDashoffset = circumference - (taskProgress / 100) * circumference;

    return (
      <View className="relative">
        <Svg height={radius * 2} width={radius * 2}>
          <Circle
            stroke="#F3F4F6"
            fill="transparent"
            strokeWidth={strokeWidth}
            r={normalizedRadius}
            cx={radius}
            cy={radius}
          />
          <Circle
            stroke="#3B82F6"
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
        <View className="absolute inset-0 justify-center items-center">
          <Text className="text-2xl font-bold text-blue-600">{taskProgress}%</Text>
          <Text className="text-xs text-gray-500 mt-1">Complete</Text>
        </View>
      </View>
    );
  };

  if (loading) {
    return (
      <View className="flex-1 justify-center items-center bg-gray-50">
        <ActivityIndicator size="large" color="#3B82F6" />
        <Text className="text-gray-500 mt-4">Loading task details...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View className="flex-1 justify-center items-center bg-gray-50">
        <MaterialIcons name="error-outline" size={48} color="#EF4444" />
        <Text className="text-red-500 text-lg font-medium mt-4">{error || "Task not found."}</Text>
      </View>
    );
  }

  const statusInfo = getStatusColor(status);

  return (
    <View className="flex-1 bg-gray-50">
      <StatusBar barStyle="dark-content" backgroundColor="#F9FAFB" />

      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        {/* Header Section */}
        <View className="bg-white rounded-b-3xl px-6 pt-6 pb-8 shadow-sm">
          <View className="flex-row items-center justify-between mb-4">
            <View className="flex-1">
              <Text className="text-2xl font-bold text-gray-900 mb-2">{task.title}</Text>
              <View className="flex-row items-center">
                <FontAwesome5 name="user-circle" size={16} color="#6B7280" />
                <Text className="text-sm text-gray-600 ml-2">Created by {user.name}</Text>
              </View>
            </View>
          </View>

          {/* Status Badge */}
          <View className={`${statusInfo.bg} px-4 py-2 rounded-full self-start flex-row items-center mb-6`}>
            <Ionicons name={statusInfo.icon} size={16} color={statusInfo.text.replace('text-', '')} />
            <Text className={`${statusInfo.text} text-sm font-medium ml-2`}>{status}</Text>
          </View>

          {/* Progress Circle */}
          <View className="items-center mb-6">
            {renderProgress()}
          </View>

          {/* Update Progress Button */}
          <TouchableOpacity
            onPress={toggleModal}
            className="bg-blue-500 rounded-2xl px-6 py-4 flex-row items-center justify-center shadow-sm"
          >
            <MaterialIcons name="update" size={20} color="white" />
            <Text className="text-white text-base font-semibold ml-2">Update Progress</Text>
          </TouchableOpacity>
        </View>

        {/* Comments Section */}
        <View className="px-6 py-6">
          {/* Add Comment */}
          <View className="bg-white rounded-2xl p-4 shadow-sm mb-6">
            <View className="flex-row items-center space-x-3">
              <View className="flex-1">
                <TextInput
                  className="bg-gray-50 rounded-xl px-4 py-3 text-base"
                  placeholder="Add a comment..."
                  placeholderTextColor="#9CA3AF"
                  value={commentContent}
                  onChangeText={setCommentContent}
                  multiline
                />
              </View>
              <TouchableOpacity
                onPress={handleAddComment}
                className="bg-blue-500 p-3 rounded-xl shadow-sm"
              >
                <Ionicons name="send" size={18} color="white" />
              </TouchableOpacity>
            </View>
          </View>

          {/* Comments List */}
          <View className="space-y-4">
            <View className="flex-row items-center mb-4">
              <MaterialIcons name="comment" size={20} color="#6B7280" />
              <Text className="text-lg font-semibold text-gray-900 ml-2">
                Comments ({comments.length})
              </Text>
            </View>

            {comments.length === 0 ? (
              <View className="bg-white rounded-2xl p-8 items-center shadow-sm">
                <MaterialIcons name="chat-bubble-outline" size={48} color="#D1D5DB" />
                <Text className="text-gray-500 text-center mt-4">No comments yet</Text>
                <Text className="text-gray-400 text-sm text-center mt-1">Be the first to add a comment!</Text>
              </View>
            ) : (
              comments.map((item) => (
                <View key={item._id} className="bg-white rounded-2xl p-4 shadow-sm">
                  {/* Comment Header */}
                  <View className="flex-row items-center justify-between mb-3">
                    <View className="flex-row items-center flex-1">
                      <View className="bg-blue-100 rounded-full p-2">
                        <FontAwesome5 name="user" size={12} color="#3B82F6" />
                      </View>
                      <View className="ml-3 flex-1">
                        <Text className="text-sm font-semibold text-gray-900">
                          {item.user?.name || 'Unknown User'}
                        </Text>
                        <Text className="text-xs text-gray-500">{item.user?.email || 'unknown'}</Text>
                      </View>
                    </View>

                    {/* Action Buttons */}
                    {item.user._id === user._id && (
                      <View className="flex-row space-x-3">
                        <TouchableOpacity
                          onPress={() => handleStartEditing(item)}
                          className="p-2"
                        >
                          <MaterialIcons name="edit" size={18} color="#3B82F6" />
                        </TouchableOpacity>
                        <TouchableOpacity
                          onPress={() => handleDeleteComment(item._id)}
                          className="p-2"
                        >
                          <MaterialIcons name="delete-outline" size={18} color="#EF4444" />
                        </TouchableOpacity>
                      </View>
                    )}
                  </View>

                  {/* Comment Content */}
                  {editCommentId === item._id ? (
                    <View className="space-y-3">
                      <TextInput
                        value={editCommentContent}
                        onChangeText={setEditCommentContent}
                        className="bg-gray-50 rounded-xl px-4 py-3 text-base"
                        multiline
                      />
                      <View className="flex-row space-x-2">
                        <TouchableOpacity
                          onPress={() => handleEditComment(item._id)}
                          className="bg-blue-500 px-4 py-2 rounded-lg flex-row items-center"
                        >
                          <Ionicons name="checkmark" size={16} color="white" />
                          <Text className="text-white font-medium ml-1">Save</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                          onPress={handleCancelEditing}
                          className="bg-gray-200 px-4 py-2 rounded-lg flex-row items-center"
                        >
                          <Ionicons name="close" size={16} color="#6B7280" />
                          <Text className="text-gray-700 font-medium ml-1">Cancel</Text>
                        </TouchableOpacity>
                      </View>
                    </View>
                  ) : (
                    <Text className="text-gray-700 text-base leading-relaxed">{item.content}</Text>
                  )}
                </View>
              ))
            )}
          </View>
        </View>
      </ScrollView>

      {/* Progress Update Modal */}
      <ProgressModal
        visible={modalVisible}
        tempProgress={tempProgress}
        setTempProgress={setTempProgress}
        tempStatus={tempStatus}
        setTempStatus={setTempStatus}
        onClose={() => setModalVisible(false)}
        onSave={handleSaveChanges}
        getStatusColor={getStatusColor}
      />
    </View>
  );
};

export default TaskDetails;