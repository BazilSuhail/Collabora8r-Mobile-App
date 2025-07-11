import React, { useCallback, useEffect, useState } from 'react'; 
import { View, Text, TextInput, ScrollView, Image, TouchableOpacity, Modal } from 'react-native';
import { usePathname } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import config from '@/config/config';
import decodeJWT from '@/config/decodeJWT';
import { useAuthContext } from '../../hooks/AuthProvider'; 
import { FontAwesome, FontAwesome5 } from '@expo/vector-icons';

// import axios from 'axios';
// import { useCallback, useEffect, useState } from 'react';

// import { FontAwesome5, Ionicons } from '@expo/vector-icons';
// import { Image, Pressable, ScrollView, Text, TextInput, TouchableOpacity, View } from 'react-native';
// //import Loader from '../../Assets/Loader';

// //import { Picker } from '@react-native-picker/picker';
// //import Slider from '@react-native-community/slider';

// import config from '@/config/config';
// import decodeJWT from '@/config/decodeJWT';
// import avatarImages from '@/constants/avatar';
// import AsyncStorage from '@react-native-async-storage/async-storage';
// import { usePathname } from 'expo-router';

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
              <Text className="font-semibold text-gray-800">{comment.user?.name || 'Unknown'}</Text>
              {comment.userId === currentUserId && (
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
      {task.assignedTo === user._id && (
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

// import axios from 'axios';
// import { useCallback, useEffect, useState } from 'react';

// import { FontAwesome5, Ionicons } from '@expo/vector-icons';
// import { Image, Pressable, ScrollView, Text, TextInput, TouchableOpacity, View } from 'react-native';
// //import Loader from '../../Assets/Loader';

// //import { Picker } from '@react-native-picker/picker';
// //import Slider from '@react-native-community/slider';

// import config from '@/config/config';
// import decodeJWT from '@/config/decodeJWT';
// import avatarImages from '@/constants/avatar';
// import AsyncStorage from '@react-native-async-storage/async-storage';
// import { usePathname } from 'expo-router';

// const TaskDetails = () => {
  // const pathname = usePathname().split("/").pop();
  // const [taskId, creatorId] = pathname.split("-");

  // console.log("task is " + taskId);
  // //console.log("cr is " + creatorId);

  // const [task, setTask] = useState(null);
  // const [taskProgress, setTaskProgress] = useState(1);
  // const [status, setStatus] = useState("Not Started");
  // const [comments, setComments] = useState([]);
  // const [commentContent, setCommentContent] = useState('');
  // const [error, setError] = useState(null);
  // const [currentUserId, setCurrentUserId] = useState(null);
  // const [editCommentId, setEditCommentId] = useState(null);
  // const [editCommentContent, setEditCommentContent] = useState('');
  // const [creatorName, setCreatorName] = useState('');
  // const [isModalOpen, setIsModalOpen] = useState(false);

  // useEffect(() => {
  //   const fetchTaskDetails = async () => {
  //     try {
  //       const token = await AsyncStorage.getItem('token');
  //       const userId = decodeJWT(token);
  //       setCurrentUserId(userId);

  //       const response = await axios.get(`${config.VITE_REACT_APP_API_BASE_URL}/project-tasks/${taskId}`, {
  //         headers: { Authorization: `Bearer ${token}` },
  //       });
  //       setTask(response.data);
  //       setTaskProgress(response.data.progress);
  //       setStatus(response.data.status)

  //       const commentsResponse = await axios.get(`${config.VITE_REACT_APP_API_BASE_URL}/comments/tasks/${taskId}/comments`, {
  //         headers: { Authorization: `Bearer ${token}` },
  //       });
  //       setComments(commentsResponse.data.comments);
  //     } catch (err) {
  //       console.error(err);
  //       setError('Failed to fetch task details or comments.');
  //     }
  //   };

  //   const fetchCreatorName = async () => {
  //     try {
  //       const response = await axios.get(`${config.VITE_REACT_APP_API_BASE_URL}/comments/${creatorId}/name`);
  //       setCreatorName(response.data.name);
  //     } catch (err) {
  //       setError('Failed to fetch creator name');
  //     }
  //   };

  //   fetchCreatorName();
  //   fetchTaskDetails();
  // }, [taskId, creatorId]);

  // const toggleModal = () => setIsModalOpen((prev) => !prev);

  // const handleSaveChanges = async () => {
  //   try {
  //     const token = await AsyncStorage.getItem("token");
  //     await axios.put(
  //       `${config.VITE_REACT_APP_API_BASE_URL}/projecttasks/update-task-progress/${taskId}`,
  //       { progress: taskProgress, status },
  //       {
  //         headers: { Authorization: `Bearer ${token}` },
  //       }
  //     );
  //     setTask((prev) => ({
  //       ...prev,
  //       progress: taskProgress,
  //       status,
  //     }));
  //     toggleModal();
  //   } catch (err) {
  //     console.error(err);
  //     setError("Failed to update task details.");
  //   }
  // };

  // const handleAddComment = useCallback(async () => {
  //   try {
  //     const token = await AsyncStorage.getItem('token');
  //     const userId = decodeJWT(token);
  //     const response = await axios.post(
  //       `${config.VITE_REACT_APP_API_BASE_URL}/comments/tasks/${taskId}/comments`,
  //       { content: commentContent, userId },
  //       {
  //         headers: { Authorization: `Bearer ${token}` },
  //       }
  //     );
  //     const newComment = {
  //       ...response.data.comment,
  //       user: {
  //         _id: currentUserId,
  //         name: 'Reload Page',
  //         email: '',
  //         avatar: '1',
  //       },
  //     };

  //     setComments((prev) => [...prev, newComment]);
  //     setCommentContent('');
  //   } catch (err) {
  //     console.error(err);
  //     setError('Failed to add comment.');
  //   }
  // }, [commentContent]);

  // const handleEditComment = async (commentId) => {
  //   try {
  //     const token = await AsyncStorage.getItem('token');
  //     const response = await axios.put(
  //       `${config.VITE_REACT_APP_API_BASE_URL}/comments/${commentId}`,
  //       { content: editCommentContent },
  //       {
  //         headers: { Authorization: `Bearer ${token}` },
  //       }
  //     );

  //     setComments((prev) =>
  //       prev.map((comment) =>
  //         comment._id === commentId
  //           ? { ...comment, content: response.data.comment.content }
  //           : comment
  //       )
  //     );

  //     setEditCommentId(null);
  //   } catch (err) {
  //     console.error(err);
  //     setError('Failed to edit comment.');
  //   }
  // };

  // const handleDeleteComment = async (commentId) => {
  //   try {
  //     const token = await AsyncStorage.getItem('token');
  //     await axios.delete(`${config.VITE_REACT_APP_API_BASE_URL}/comments/${commentId}`, {
  //       headers: { Authorization: `Bearer ${token}` },
  //     });

  //     setComments((prev) => prev.filter((comment) => comment._id !== commentId));
  //   } catch (err) {
  //     console.error(err);
  //     setError('Failed to delete comment.');
  //   }
  // };


  // const clampedProgress = Math.min(Math.max(taskProgress, 0), 100);

  // // Calculate the stroke dash offset
  // const radius = 50; // Radius of the circle
  // const circumference = 2 * Math.PI * radius;
  // const offset = circumference - (clampedProgress / 100) * circumference;

  // const handleStartEditing = (comment) => {
  //   setEditCommentId(comment._id);
  //   setEditCommentContent(comment.content);
  // };

  // const handleCancelEditing = () => {
  //   setEditCommentId(null);
  //   setEditCommentContent('');
  // };


  // if (error) {
  //   return <View>
  //     <Text>
  //       {error}
  //     </Text>
  //   </View>;
  // }

  // if (!task) {
  //   return <View>
  //     <Text>
  //       lakdm
  //     </Text>
  //   </View>;
  // }

//   return (
//     <ScrollView className="bg-gray-50 flex-1 p-4">
//       <View className="space-y-6">

//         {/* Task Card */}
//         <View className="bg-white p-4 rounded-lg border border-gray-300 shadow-sm">
//           <View className="flex-row items-center space-x-3 mb-3">
//             <FontAwesome5 name="clipboard-list" size={28} className="text-blue-600" />
//             <Text className="text-lg font-bold text-gray-800">{task.title}</Text>
//           </View>
//           <View className="flex-row items-center space-x-2">
//             <Text className="text-gray-600">{creatorName}</Text>
//             <View className="w-1.5 h-1.5 bg-gray-400 rounded-full" />
//             <Text className="text-gray-600">{new Date(task.createdAt).toLocaleDateString()}</Text>
//           </View>
//           <View className="flex-row items-center justify-between mt-4">
//             <Text
//               className={`
//             px-3 py-1 rounded-full font-bold text-sm
//             ${task.priority === 'High' ? 'bg-red-100 text-red-800' : ''}
//             ${task.priority === 'Medium' ? 'bg-yellow-100 text-yellow-800' : ''}
//             ${task.priority === 'Low' ? 'bg-green-100 text-green-800' : ''}
//           `}
//             >
//               {task.priority}
//             </Text>
//             <Text className="text-gray-600">Due: {new Date(task.dueDate).toLocaleDateString()}</Text>
//           </View>
//         </View>

//         {/* Guidelines Card */}
//         <View className="bg-white p-4 rounded-lg border border-gray-300 shadow-sm">
//           <View className="flex-row items-center space-x-2 mb-3">
//             <FontAwesome5 name="file-alt" size={20} className="text-blue-600" />
//             <Text className="text-blue-600 font-medium">Task Guidelines</Text>
//           </View>
//           <Text className="text-gray-600">{task.description}</Text>
//         </View>

//         {/* Comments Section */}
//         <View className="bg-white p-4 rounded-lg border border-gray-300 shadow-sm">
//           {comments.length === 0 ? (
//             <View className="flex-row items-center space-x-2">
//               <FontAwesome5 name="snowboarding" size={22} className="text-blue-600" />
//               <Text className="text-gray-500">No comments yet.</Text>
//             </View>
//           ) : (
//             <View>
//               <View className="flex-row items-center space-x-2 mb-3">
//                 <FontAwesome5 name="users" size={18} className="text-gray-500" />
//                 <Text className="text-gray-600">{comments.length} task comments</Text>
//               </View>
//               {comments.map((comment) => (
//                 <View key={comment._id} className="bg-red-50 mt-4 p-3 rounded-lg border border-red-100">
//                   <View className="flex-row items-center justify-between">
//                     <View className="flex-row items-center space-x-3">
//                       {comment.user && (
//                         <Image
//                           source={avatarImages[comment.user.avatar]}
//                           className="w-9 h-9 rounded-full bg-yellow-50"
//                         />
//                       )}
//                       <View>
//                         <Text className="font-medium">{comment.user?.name || 'Unknown User'}</Text>
//                         <Text className="text-xs">{comment.user?.email}</Text>
//                       </View>
//                     </View>
//                     {comment.userId === currentUserId && (
//                       <View className="flex-row space-x-4">
//                         <Pressable onPress={() => handleStartEditing(comment)}>
//                           <FontAwesome5 name="edit" size={18} className="text-blue-600" />
//                         </Pressable>
//                         <Pressable onPress={() => handleDeleteComment(comment._id)}>
//                           <FontAwesome5 name="trash-alt" size={18} className="text-red-600" />
//                         </Pressable>
//                       </View>
//                     )}
//                   </View>
//                   {editCommentId === comment._id ? (
//                     <View>
//                       <TextInput
//                         value={editCommentContent}
//                         onChangeText={setEditCommentContent}
//                         className="border border-gray-300 rounded-md p-2 mt-2"
//                       />
//                       <View className="flex-row space-x-3 mt-2">
//                         <Pressable onPress={() => handleEditComment(comment._id)} className="bg-blue-500 px-4 py-2 rounded-md">
//                           <Text className="text-white font-medium">Save</Text>
//                         </Pressable>
//                         <Pressable onPress={handleCancelEditing} className="bg-gray-400 px-4 py-2 rounded-md">
//                           <Text className="text-white font-medium">Cancel</Text>
//                         </Pressable>
//                       </View>
//                     </View>
//                   ) : (
//                     <Text className="mt-2 text-gray-600">{comment.content}</Text>
//                   )}
//                 </View>
//               ))}
//             </View>
//           )}
//         </View>

//         {/* Task Status */}
//         <View className="bg-white p-4 rounded-lg border border-gray-300 shadow-sm">
//           <View className="flex-row items-center border-b-2 border-gray-200 pb-1 mb-3">
//             <Ionicons name="checkmark-done" size={23} className="text-gray-600" />
//             <Text className="ml-2 text-lg font-medium text-gray-600">Task Status</Text>
//           </View>
//           <View className="flex items-center justify-center">
//             <Text className="text-4xl text-green-600 font-bold">{taskProgress}%</Text>
//           </View>
//           <Text
//             className={`
//           mt-4 text-center py-2 rounded-md font-semibold
//           ${taskProgress === 0 ? 'bg-blue-50 text-blue-600' : ''}
//           ${taskProgress === 100 ? 'bg-green-50 text-green-600' : ''}
//           ${taskProgress > 0 && taskProgress < 100 ? 'bg-yellow-50 text-yellow-600' : ''}
//         `}
//           >
//             {status}
//           </Text>
//           <TouchableOpacity
//             onPress={toggleModal}
//             className="mt-4 bg-blue-500 py-2 rounded-md items-center"
//           >
//             <Text className="text-white font-semibold">Update Task</Text>
//           </TouchableOpacity>
//           <Text className="mt-2 text-center text-sm text-gray-500 italic">
//             Task Status Cannot be Updated After the Due Date
//           </Text>
//         </View>
//       </View>
//     </ScrollView>

//   );
// };


// export default TaskDetails; 