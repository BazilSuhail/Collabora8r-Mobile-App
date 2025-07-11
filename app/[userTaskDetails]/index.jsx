import React, { useCallback, useEffect, useState } from 'react'; 
import { View, Text, TextInput, ScrollView, Image, TouchableOpacity, Modal } from 'react-native';
import { usePathname } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import config from '@/config/config';
import decodeJWT from '@/config/decodeJWT';
import { useAuthContext } from '../../hooks/AuthProvider'; 
import { FontAwesome, FontAwesome5 } from '@expo/vector-icons';
 
const TaskDetails = () => {
  const pathname = usePathname().split("/").pop();
  const [taskId, creatorId] = pathname.split("-");

  console.log("task is isis" + creatorId);
  //console.log("cr is " + creatorId);

  const [task, setTask] = useState(null);
  const [taskProgress, setTaskProgress] = useState(1);
  const [status, setStatus] = useState("Not Started");
  const [comments, setComments] = useState([]);
  const [commentContent, setCommentContent] = useState('');
  const [error, setError] = useState(null);
  const [currentUserId, setCurrentUserId] = useState(null);
  const [editCommentId, setEditCommentId] = useState(null);
  const [editCommentContent, setEditCommentContent] = useState('');
  const [creatorName, setCreatorName] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    const fetchTaskDetails = async () => {
      try {
        const token = await AsyncStorage.getItem('token');
        const userId = decodeJWT(token);
        setCurrentUserId(userId);

        const response = await axios.get(`${config.VITE_REACT_APP_API_BASE_URL}/project-tasks/${taskId}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setTask(response.data);
        setTaskProgress(response.data.progress);
        setStatus(response.data.status)

        const commentsResponse = await axios.get(`${config.VITE_REACT_APP_API_BASE_URL}/comments/tasks/${taskId}/comments`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setComments(commentsResponse.data.comments);
      } catch (err) {
        console.error(err);
        setError('Failed to fetch task details or comments.');
      }
    };

    const fetchCreatorName = async () => {
      try {
        const response = await axios.get(`${config.VITE_REACT_APP_API_BASE_URL}/comments/${creatorId}/name`);
        setCreatorName(response.data.name);
      } catch (err) {
        setError('Failed to fetch creator name');
      }
    };

    fetchCreatorName();
    fetchTaskDetails();
  }, [taskId, creatorId]);

  const toggleModal = () => setIsModalOpen((prev) => !prev);

  const handleSaveChanges = async () => {
    try {
      const token = await AsyncStorage.getItem("token");
      await axios.put(
        `${config.VITE_REACT_APP_API_BASE_URL}/projecttasks/update-task-progress/${taskId}`,
        { progress: taskProgress, status },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      setTask((prev) => ({
        ...prev,
        progress: taskProgress,
        status,
      }));
      toggleModal();
    } catch (err) {
      console.error(err);
      setError("Failed to update task details.");
    }
  };

  const handleAddComment = useCallback(async () => {
    try {
      const token = await AsyncStorage.getItem('token');
      const userId = decodeJWT(token);
      const response = await axios.post(
        `${config.VITE_REACT_APP_API_BASE_URL}/comments/tasks/${taskId}/comments`,
        { content: commentContent, userId },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      const newComment = {
        ...response.data.comment,
        user: {
          _id: currentUserId,
          name: 'Reload Page',
          email: '',
          avatar: '1',
        },
      };

      setComments((prev) => [...prev, newComment]);
      setCommentContent('');
    } catch (err) {
      console.error(err);
      setError('Failed to add comment.');
    }
  }, [commentContent]);

  const handleEditComment = async (commentId) => {
    try {
      const token = await AsyncStorage.getItem('token');
      const response = await axios.put(
        `${config.VITE_REACT_APP_API_BASE_URL}/comments/${commentId}`,
        { content: editCommentContent },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      setComments((prev) =>
        prev.map((comment) =>
          comment._id === commentId
            ? { ...comment, content: response.data.comment.content }
            : comment
        )
      );

      setEditCommentId(null);
    } catch (err) {
      console.error(err);
      setError('Failed to edit comment.');
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
      setError('Failed to delete comment.');
    }
  };


  const clampedProgress = Math.min(Math.max(taskProgress, 0), 100);

  // Calculate the stroke dash offset
  const radius = 50; // Radius of the circle
  const circumference = 2 * Math.PI * radius;
  // const offset = circumference - (clampedProgress / 100) * circumference;

  const handleStartEditing = (comment) => {
    setEditCommentId(comment._id);
    setEditCommentContent(comment.content);
  };

  const handleCancelEditing = () => {
    setEditCommentId(null);
    setEditCommentContent('');
  };

 

  if (error) return <Text className="text-red-500 p-4">{error}</Text>;
  if (!task) return <View className="h-screen w-screen bg-red-100"></View>;

  return (
    <ScrollView className="bg-gray-100 p-4">
      <View className="bg-white p-4 rounded-xl mb-4">
        <View className="flex-row items-center space-x-3 mb-2">
         <FontAwesome5 name="clipboard-list" size={26} color="#2563EB" />
          <Text className="text-lg font-bold">{task.title}</Text>
        </View>
        <Text className="text-sm text-gray-500">{creatorName}</Text>
        <Text className="text-sm text-gray-500">
          Due: {new Date(task.dueDate?.$date || task.dueDate).toLocaleDateString()}
        </Text>
        <Text className="text-sm mt-1 text-gray-600">{task.description}</Text>
      </View>

      {/* Comments Section */}
      <View className="bg-white p-4 rounded-xl mb-4">
        <Text className="text-lg font-semibold mb-2">Comments</Text>
        {comments.map((comment) => (
          <View key={comment._id} className="mb-3 border-b pb-2">
            <View className="flex-row justify-between items-center">
              <Text className="font-semibold text-gray-800">{comment?.user?.name || 'Unknown'}</Text>
              {comment?.userId === currentUserId && (
                <View className="flex-row space-x-3">
                  <TouchableOpacity onPress={() => handleDeleteComment(comment._id)}>
                   <FontAwesome5 name="clipboard-list" size={26} color="#2563EB" />
                  </TouchableOpacity>
                  <TouchableOpacity onPress={() => {
                    setEditCommentId(comment._id);
                    setEditCommentContent(comment.content);
                  }}>
                    <FontAwesome5 name="clipboard-list" size={26} color="#2563EB" />
                  </TouchableOpacity>
                </View>
              )}
            </View>
            {editCommentId === comment._id ? (
              <>
                <TextInput
                  value={editCommentContent}
                  onChangeText={setEditCommentContent}
                  multiline
                  className="border mt-2 rounded p-2 text-sm"
                />
                <View className="flex-row justify-end space-x-2 mt-1">
                  <TouchableOpacity onPress={() => handleEditComment(comment._id)}>
                    <Text className="text-blue-600">Save</Text>
                  </TouchableOpacity>
                  <TouchableOpacity onPress={() => setEditCommentId(null)}>
                    <Text className="text-red-500">Cancel</Text>
                  </TouchableOpacity>
                </View>
              </>
            ) : (
              <Text className="text-sm text-gray-600 mt-1">{comment.content}</Text>
            )}
          </View>
        ))}
        <TextInput
          value={commentContent}
          onChangeText={setCommentContent}
          multiline
          placeholder="Add comment..."
          className="border p-2 rounded mb-2"
        />
        <TouchableOpacity onPress={handleAddComment} className="items-end">
        <FontAwesome5 name="clipboard-list" size={26} color="#2563EB" />
        </TouchableOpacity>
      </View>

      {/* Update Button */}
      {task.assignedTo === creatorId && (
        <TouchableOpacity onPress={() => setIsModalOpen(true)} className="bg-blue-600 p-3 rounded-md">
          <Text className="text-white text-center font-semibold">Update Task</Text>
        </TouchableOpacity>
      )}

      {/* MODAL */}
      <Modal visible={isModalOpen} animationType="slide" transparent>
        <View className="flex-1 justify-center items-center bg-black bg-opacity-40 px-5">
          <View className="bg-white p-4 rounded-lg w-full max-w-md">
            <Text className="text-center text-lg font-bold mb-4">Update Task</Text>
            <Text className="text-sm font-semibold mb-1">Progress: {taskProgress}%</Text>
            <TextInput
              keyboardType="numeric"
              value={String(taskProgress)}
              onChangeText={(v) => setTaskProgress(Number(v))}
              className="border rounded p-2 mb-4"
            />
            <Text className="text-sm font-semibold mb-1">Status</Text>
            <TextInput
              value={status}
              onChangeText={(v) => setStatus(v)}
              className="border rounded p-2 mb-4"
            />
            <View className="flex-row justify-end space-x-3">
              <TouchableOpacity onPress={handleSaveChanges} className="bg-blue-600 px-4 py-2 rounded">
                <Text className="text-white">Save</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => setIsModalOpen(false)} className="bg-gray-300 px-4 py-2 rounded">
                <Text className="text-black">Cancel</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
};

export default TaskDetails;
