import { useState, useEffect } from 'react';
import axios from 'axios';
import {
  View,
  Text,
  TextInput,
  Button,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Image,
  Modal,
} from 'react-native';
import { FontAwesome, FontAwesome5 } from '@expo/vector-icons';


//import Loader from '../../Assets/Loader';  

import AsyncStorage from '@react-native-async-storage/async-storage';
import config from '@/Config/Config';
import decodeJWT from '@/Config/DecodeJWT';
import { usePathname } from 'expo-router';

const TaskDetails = () => {
  //const { taskId, creatorId } = usePathname();
  console.log(usePathname()); // Output: 677fd7575173d553baf7f08e


  const path = usePathname();
  const pathname = usePathname().split("/").pop();
  //const creatorId = pathname.split("/").pop(); // Extract the string
  console.log("task is " + taskId); // Output: 677fd7575173d553baf7f08e

  // Split the string by '-' and assign to two variables
  const [taskId, creatorId] = pathname.split("-");


  console.log("task is " + taskId); // Output: 677fd7575173d553baf7f08e
  console.log("cr is " + creatorId); // Output: 677dc685987257c152dfcd3a


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

  const handleAddComment = async () => {
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
  };

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
      <View style={styles.section}> {/* Task Details Section */}
        

        

        
      </View>
      
      {/*isModalOpen && (
        <View style={styles.modalContainer}>
          <motion.div style={styles.modal}>
          
          </motion.div>
        </View>
      )*/}
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

/*



*/