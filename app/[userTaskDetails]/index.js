import { useState, useEffect, useCallback } from 'react';
import axios from 'axios';

import { View, Text, TextInput, ScrollView, Image, TouchableOpacity, Modal, StyleSheet, Pressable } from 'react-native';
import { FontAwesome5, Ionicons, Entypo } from '@expo/vector-icons';
//import Loader from '../../Assets/Loader';  

import { Picker } from '@react-native-picker/picker';
import Slider from '@react-native-community/slider';

import AsyncStorage from '@react-native-async-storage/async-storage';
import config from '@/Config/Config';
import decodeJWT from '@/Config/DecodeJWT';
import { usePathname } from 'expo-router';
import avatarImages from '@/constants/avatar';

const TaskDetails = () => {
  const pathname = usePathname().split("/").pop();
  const [taskId, creatorId] = pathname.split("-");

  console.log("task is " + taskId);
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
  const offset = circumference - (clampedProgress / 100) * circumference;

  const handleStartEditing = (comment) => {
    setEditCommentId(comment._id);
    setEditCommentContent(comment.content);
  };

  const handleCancelEditing = () => {
    setEditCommentId(null);
    setEditCommentContent('');
  };


  if (error) {
    return <View>
      <Text>
        {error}
      </Text>
    </View>;
  }

  if (!task) {
    return <View>
      <Text>
        lakdm
      </Text>
    </View>;
  }

  return (
    <ScrollView style={{ backgroundColor: "#f9fafb", flex: 1, padding: 10 }}>
      <View style={styles.section}>

        <View style={styles.card}>
          <View style={styles.taskHeader}>
            <FontAwesome5 name="clipboard-list" size={28} color="#2563eb" style={styles.icon} />
            <Text style={styles.taskTitle}>{task.title}</Text>
          </View>
          <View style={styles.taskInfoRow}>
            <Text style={styles.textGray}>{creatorName}</Text>
            <View style={styles.dot} />
            <Text style={styles.textGray}>{new Date(task.createdAt).toLocaleDateString()}</Text>
          </View>
          <View style={styles.taskMetaRow}>
            <Text
              style={{
                ...styles.priority,
                backgroundColor:
                  task.priority === "High"
                    ? "#fee2e2"
                    : task.priority === "Medium"
                      ? "#fef3c7"
                      : "#dcfce7",
                color:
                  task.priority === "High"
                    ? "#b91c1c"
                    : task.priority === "Medium"
                      ? "#ca8a04"
                      : "#15803d",
              }}
            >
              {task.priority}
            </Text>
            <Text style={styles.dueDate}>Due: {new Date(task.dueDate).toLocaleDateString()}</Text>
          </View>
        </View>

        <View style={styles.card}>
          <View style={styles.taskHeaderSmall}>
            <FontAwesome5 name="file-alt" size={20} color="#2563eb" style={styles.icon} />
            <Text style={styles.textBlue}>Task Guidelines</Text>
          </View>
          <Text style={styles.textGray}>{task.description}</Text>
        </View>

        <View style={styles.card}>
          {comments.length === 0 ? (
            <View style={styles.noCommentsRow}>
              <FontAwesome5 name="snowboarding" size={22} color="#2563eb" />
              <Text style={styles.noCommentsText}>No comments yet.</Text>
            </View>
          ) : (
            <View className='w-full'>
              <View style={styles.commentHeaderRow}>
                <FontAwesome5 name="users" size={18} color="#6b7280" />
                <Text style={styles.textGray}>{comments.length} task comments</Text>
              </View>

              {comments.map((comment) => (
                <View key={comment._id} className='flex-1 bg-red-50 mt-[15px]'>
                  <View className='flex-row items-center justify-between'>
                    <View className='flex-row items-center'>
                      {comment.user && (
                        <Image
                          source={avatarImages[comment.user.avatar]}
                          className='w-[35px] bg-yellow-50 h-[35px] rounded-full'
                        />
                      )}
                      <View>
                        <Text style={styles.commentUserName}>{comment.user?.name || "Unknown User"}</Text>
                        <Text className='text-[11px]'>{comment.user?.email}</Text>
                      </View>
                    </View>

                    {comment.userId === currentUserId && (
                      <View className='flex-row items-center'>
                        <Pressable onPress={() => handleStartEditing(comment)}>
                          <FontAwesome5 name="edit" size={18} color="#2563eb" />
                        </Pressable>
                        <Pressable onPress={() => handleDeleteComment(comment._id)}>
                          <FontAwesome5 name="trash-alt" size={18} color="#b91c1c" />
                        </Pressable>
                      </View>
                    )}
                  </View>

                  {editCommentId === comment._id ? (
                    <View>
                      <TextInput
                        value={editCommentContent}
                        onChangeText={setEditCommentContent}
                        style={styles.editCommentInput}
                      />
                      <View style={styles.commentEditActions}>
                        <Pressable onPress={() => handleEditComment(comment._id)} style={styles.saveButton}>
                          <Text style={styles.buttonText}>Save</Text>
                        </Pressable>
                        <Pressable onPress={handleCancelEditing} style={styles.cancelButton}>
                          <Text style={styles.buttonText}>Cancel</Text>
                        </Pressable>
                      </View>
                    </View>
                  ) : (
                    <Text style={styles.commentContent}>{comment.content}</Text>
                  )}
                </View>
              ))}
            </View>
          )}
        </View>


      </View>



      <View style={{ flex: 1, padding: 20 }}>
        {/* Task Status */}
        <View
          style={{
            marginBottom: 25,
            backgroundColor: 'white',
            padding: 15,
            borderRadius: 10,
            borderWidth: 1,
            borderColor: '#e0e0e0',
          }}
        >
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              borderBottomWidth: 2,
              borderColor: '#e0e0e0',
              paddingBottom: 3,
              marginBottom: 15,
            }}
          >
            <Ionicons name="checkmark-done" size={23} color="#606060" />
            <Text style={{ marginLeft: 8, fontSize: 17, fontWeight: '500', color: '#606060' }}>
              Task Status
            </Text>
          </View>

          <View style={{ alignItems: 'center', justifyContent: 'center' }}>
            <Text style={{ fontSize: 40, color: '#1eb720', fontWeight: 'bold' }}>{taskProgress}%</Text>
          </View>

          <Text
            style={{
              marginTop: 10,
              textAlign: 'center',
              paddingVertical: 4,
              fontWeight: '600',
              backgroundColor: taskProgress === 0 ? '#e0f7ff' : taskProgress === 100 ? '#e0ffe0' : '#fff7e0',
              color: taskProgress === 0 ? '#0073e6' : taskProgress === 100 ? '#1eb720' : '#e6a800',
              borderRadius: 5,
            }}
          >
            {status}
          </Text>

          <TouchableOpacity
            onPress={toggleModal}
            style={{
              marginTop: 15,
              paddingVertical: 8,
              backgroundColor: '#007bff',
              borderRadius: 5,
              alignItems: 'center',
            }}
          >
            <Text style={{ color: '#fff', fontSize: 15, fontWeight: '600' }}>Update Task</Text>
          </TouchableOpacity>
          <Text
            style={{
              marginTop: 10,
              color: '#606060',
              textAlign: 'center',
              fontStyle: 'italic',
              fontSize: 13,
              fontWeight: '600',
            }}
          >
            Task Status Cannot be Updated After the Due Date
          </Text>
        </View>

        {/* Add Comments */}
        <View
          style={{
            backgroundColor: 'white',
            padding: 15,
            borderRadius: 10,
            borderWidth: 1,
            borderColor: '#e0e0e0',
          }}
        >
          <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 20 }}>
            <FontAwesome5 name="user-circle" size={18} color="#606060" />
            <Text style={{ marginLeft: 8, fontSize: 14, fontWeight: '500', color: '#606060' }}>
              Add Comments to{' '}
              <Text style={{ color: '#007bff', textDecorationLine: 'underline', fontWeight: '600' }}>
                {creatorName}
              </Text>
            </Text>
          </View>
          <TextInput
            value={commentContent}
            onChangeText={setCommentContent}
            placeholder="Add a comment..."
            style={{
              borderWidth: 1,
              borderColor: '#e0e0e0',
              borderRadius: 7,
              height: 165,
              paddingHorizontal: 10,
              paddingVertical: 8,
              textAlignVertical: 'top',
            }}
            multiline
          />
          <TouchableOpacity onPress={handleAddComment} style={{ alignSelf: 'flex-end', marginTop: 10 }}>
            <FontAwesome5 name="paper-plane" size={20} color="#007bff" />
          </TouchableOpacity>
        </View>

        {/* Modal */}
        <Modal visible={isModalOpen} transparent animationType="fade">
          <View
            style={{
              flex: 1,
              backgroundColor: 'rgba(0, 0, 0, 0.5)',
              justifyContent: 'center',
              alignItems: 'center',
            }}
          >
            <View
              style={{
                width: 300,
                backgroundColor: 'white',
                padding: 20,
                borderRadius: 10,
              }}
            >
              <TouchableOpacity onPress={toggleModal} style={{ alignSelf: 'flex-end' }}>
                <Entypo name="cross" size={24} color="#606060" />
              </TouchableOpacity>
              <Text style={{ fontSize: 18, fontWeight: '600', textAlign: 'center', marginVertical: 10 }}>
                Edit Task
              </Text>

              <Text style={{ fontSize: 15, fontWeight: '600', marginBottom: 8 }}>Progress</Text>
              <Slider
                minimumValue={0}
                maximumValue={100}
                value={taskProgress}
                onValueChange={setTaskProgress}
                minimumTrackTintColor="#1eb720"
                style={{ marginBottom: 15 }}
              />

              <Text style={{ fontSize: 15, fontWeight: '600', marginBottom: 8 }}>Status</Text>
              <Picker
                selectedValue={status}
                onValueChange={(itemValue) => setStatus(itemValue)}
                style={{
                  borderWidth: 1,
                  borderColor: '#e0e0e0',
                  borderRadius: 5,
                  marginBottom: 20,
                }}
              >
                <Picker.Item label="Not Started" value="Not Started" />
                <Picker.Item label="In Progress" value="In Progress" />
                <Picker.Item label="Paused" value="Paused" />
                <Picker.Item label="Completed" value="Completed" />
              </Picker>

              <TouchableOpacity
                onPress={handleSaveChanges}
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'center',
                  backgroundColor: '#007bff',
                  paddingVertical: 8,
                  borderRadius: 5,
                }}
              >
                <Ionicons name="checkmark-circle-outline" size={18} color="#fff" />
                <Text style={{ color: '#fff', marginLeft: 5, fontSize: 14, fontWeight: '600' }}>Save</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
      </View>
    </ScrollView>
  );
};


export default TaskDetails;
const styles = StyleSheet.create({
  section: { marginBottom: 20 },
  card: { padding: 12, backgroundColor: "#fff", borderRadius: 18, marginBottom: 15, borderWidth: 1, borderColor: "#e5e7eb" },
  taskHeader: { flexDirection: "row", alignItems: "center", marginBottom: 10 },
  taskHeaderSmall: { flexDirection: "row", alignItems: "center", marginBottom: 10 },
  taskTitle: { fontSize: 18, fontWeight: "600" },
  textGray: { color: "#6b7280", fontSize: 15 },
  textBlue: { color: "#2563eb", fontWeight: "600" },
  priority: { paddingHorizontal: 12, paddingVertical: 4, borderRadius: 25, fontWeight: "600" },
  dot: { width: 7, height: 7, borderRadius: 3.5, backgroundColor: "#6b7280", marginHorizontal: 8 },
  taskInfoRow: { flexDirection: "row", alignItems: "center", marginBottom: 10 },
  taskMetaRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  dueDate: { fontWeight: "600", color: "#4b5563" },
  noCommentsRow: { flexDirection: "row", alignItems: "center", backgroundColor: "#e0f2fe", padding: 10, borderRadius: 5 },
  noCommentsText: { color: "#2563eb", marginLeft: 10 },
});
