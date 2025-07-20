import EditProject from '@/components/adminProjects/EditProject';
import config from '@/config/config';
import {
  Feather,
  FontAwesome5
} from "@expo/vector-icons";
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import { usePathname } from 'expo-router';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from "react-native";
import avatarImages from '@/constants/avatar';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const ProjectDetail = () => {
  const projectId = usePathname().split("/").pop();
  const insets = useSafeAreaInsets() // Get safe area insets

  const [showModal, setShowModal] = useState(false);
  const [project, setProject] = useState(null);
  const [email, setEmail] = useState('');
  const [user, setUser] = useState(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const fetchProjectDetails = async () => {
      try {
        const token = await AsyncStorage.getItem('token');
        const projectResponse = await axios.get(
          `${config.VITE_REACT_APP_API_BASE_URL}/admin-projects/${projectId}`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );
        setProject(projectResponse.data)
      } catch (err) {
        console.error(err);
        setError('Using mock data - API connection failed');
      }
    };

    fetchProjectDetails();
  }, [projectId]);

  const handleSearch = async () => {
    setError('');
    setUser(null);
    setSuccess('');
    setIsLoading(true);

    try {
      const token = await AsyncStorage.getItem('token');
      const response = await axios.post(
        `${config.VITE_REACT_APP_API_BASE_URL}/admin-projects/get-searched-user`,
        { email, projectId },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      setUser(response.data);
    } catch (err) {
      //console.error(err);
      setError(err.response?.data?.error || 'Failed to find the user.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddUser = async () => {
    setError('');
    setSuccess('');

    try {
      const token = await AsyncStorage.getItem('token');
      const response = await axios.post(
        `${config.VITE_REACT_APP_API_BASE_URL}/admin-projects/send-project-invitation`,
        { userId: user.userId, projectId },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      setSuccess(response.data.message);
    } catch (err) {
      setError('Failed to add user to project.');
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority?.toLowerCase()) {
      case 'high':
        return 'bg-red-500';
      case 'medium':
        return 'bg-yellow-500';
      case 'low':
        return 'bg-green-500';
      default:
        return 'bg-gray-500';
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  if (!project) {
    return (
      <View className="flex-1 justify-center items-center bg-gray-50">
        <View className="bg-white rounded-2xl p-8 mx-5 ">
          <View className="w-16 h-16 bg-blue-100 rounded-full justify-center items-center mb-4">
            <ActivityIndicator size="large" color="#3B82F6" />
          </View>
          <Text className="text-lg font-semibold text-gray-800 text-center">Loading project...</Text>
        </View>
      </View>
    );
  }

  return (
    <ScrollView
      showsVerticalScrollIndicator={false}
      contentContainerStyle={{ paddingTop: insets.top }}
      className="flex-1 bg-gray-100 px-4 pt-5"
    >
      {showModal && <EditProject project={project} editModal={showModal} setShowModal={setShowModal} />}

      <View className="bg-white rounded-2xl px-4 py-6 mb-5">
        <View className="flex-row justify-between items-start">
          <View className="flex-row items-center flex-1">
            <View className="w-16 h-[60px] bg-blue-600 rounded-2xl justify-center items-center mr-4">
              <FontAwesome5 name="project-diagram" size={22} color="#FFFFFF" />
            </View>

            <View className="flex-1">
              <Text className="text-[17px] font-bold text-gray-900 mb-1">{project.name}</Text>

              {/* <View className="flex-row justify-between items-center">
                <View className="flex-row items-center">
                  <View className="w-2 h-2 bg-green-500 rounded-full mr-2" />
                  <Text className="text-[11px] text-gray-500 font-medium">Active Project</Text>
                </View>
                <TouchableOpacity
                  onPress={() => setShowModal(true)}
                  className="bg-blue-100 px-4 py-1 rounded-xl flex-row items-center ml-4"
                >
                  <Feather name="edit-3" size={14} color="#2563EB" />
                  <Text className="text-blue-600 text-[12px] font-semibold ml-1.5">Edit</Text>
                </TouchableOpacity>

              </View> */}
            </View>
          </View>
        </View>
      </View>

      <View className="bg-white rounded-2xl p-5 mb-4 ">
        <View className="flex-row items-center mb-4">
          <View className="w-10 h-10 bg-blue-100 rounded-full justify-center items-center mr-3">
            <FontAwesome5 name="file-alt" size={16} color="#3B82F6" />
          </View>
          <Text className="text-lg font-semibold text-gray-900">Project Description</Text>
        </View>
        <Text className="text-sm text-gray-500 leading-5">{project.description}</Text>
      </View>


      <View className="bg-white rounded-2xl p-5 mb-4 ">
        <View className="flex-row items-center mb-4">
          <View className="w-10 h-10 bg-purple-100 rounded-full justify-center items-center mr-3">
            <FontAwesome5 name="user-plus" size={16} color="#8B5CF6" />
          </View>
          <Text className="text-lg font-semibold text-gray-900">Add Team Member</Text>
        </View>

        <View className="mb-4">
          <View className="flex-row items-center border-2 border-gray-200 rounded-xl px-3 py-2">
            <FontAwesome5 name="search" size={18} color="#6B7280" />
            <TextInput
              className="flex-1 ml-3 text-base text-gray-900"
              placeholder="Enter user email address"
              placeholderTextColor="#9CA3AF"
              value={email}
              onChangeText={setEmail}
            />
            <TouchableOpacity
              onPress={handleSearch}
              className="bg-purple-600 px-5 py-2 rounded-lg ml-2"
            >
              <Text className="text-white font-semibold">Search</Text>
            </TouchableOpacity>
          </View>
        </View>

        {error && (
          <View className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4">
            <Text className="text-red-600 font-medium">{error}</Text>
          </View>
        )}

        {success && (
          <View className="bg-green-50 border border-green-200 rounded-lg p-3 mb-4">
            <Text className="text-green-600 font-medium">{success}</Text>
          </View>
        )}

        {isLoading && (
          <View className="flex-row items-center justify-center py-4">
            <ActivityIndicator size="small" color="#8B5CF6" />
            <Text className="text-purple-600 ml-2">Searching...</Text>
          </View>
        )}

        {user && (
          <View className="bg-gray-50 rounded-xl p-4 border border-gray-200 flex-row justify-between items-center">
            <View className="flex-row items-center flex-1">
              <Image
                source={avatarImages[user.avatar]}
                className="w-12 h-12 rounded-full mr-3"
              />
              <View className="flex-1">
                <Text className="text-base font-semibold text-gray-900">{user.name}</Text>
                <Text className="text-sm text-gray-500">{user.email}</Text>
              </View>
            </View>
            <TouchableOpacity
              onPress={handleAddUser}
              className="bg-purple-600 px-4 py-2 rounded-lg flex-row items-center"
            >
              <FontAwesome5 name="plus" size={14} color="#FFFFFF" />
              <Text className="text-white font-semibold ml-2">Add</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>

      <View className="bg-white rounded-2xl p-5 mb-4 ">
        <View className="flex-row items-center mb-4">
          <View className="w-10 h-10 bg-yellow-100 rounded-full justify-center items-center mr-3">
            <FontAwesome5 name="crown" size={16} color="#F59E0B" />
          </View>
          <Text className="text-lg font-semibold text-gray-900">Project Manager</Text>
        </View>

        <View className="bg-yellow-50 rounded-xl p-4 border border-yellow-200">
          <View className="flex-row items-center">
            <View className="w-12 h-12 bg-yellow-500 rounded-full justify-center items-center mr-3">
              <FontAwesome5 name="user-tie" size={18} color="#FFFFFF" />
            </View>
            <View className="flex-1">
              <Text className="text-base font-semibold text-gray-900">{project.projectManager.email}</Text>
              <View className="flex-row items-center mt-1">
                <View className="w-2 h-2 bg-green-500 rounded-full mr-2" />
                <Text className="text-sm text-gray-500 font-medium">{project.projectManager.status}</Text>
              </View>
            </View>
          </View>
        </View>
      </View>

      <View className="bg-white rounded-2xl p-5 mb-4 ">
        <View className="flex-row justify-between items-center mb-4">
          <View className="flex-row items-center">
            <View className="w-10 h-10 bg-green-100 rounded-full justify-center items-center mr-3">
              <FontAwesome5 name="users" size={16} color="#10B981" />
            </View>
            <Text className="text-lg font-semibold text-gray-900">Team Members</Text>
          </View>
          <View className="bg-green-100 px-3 py-1 rounded-full">
            <Text className="text-emerald-700 font-medium text-xs">{project.team.length} Members</Text>
          </View>
        </View>

        {project.team.length > 0 ? (
          <View className="space-y-3">
            {project.team.map((member, index) => (
              <View key={index} className="bg-gray-50 rounded-xl p-4 border border-gray-200 flex-row justify-between items-center">
                <View className="flex-row items-center flex-1">
                  <Image
                    source={avatarImages[member.avatar]}
                    className="w-12 h-12 rounded-full mr-3"
                  />
                  <View className="flex-1">
                    <Text className="text-base font-semibold text-gray-900">{member.name}</Text>
                    <Text className="text-sm text-gray-500">{member.email}</Text>
                  </View>
                </View>
                <View className="w-3 h-3 bg-green-500 rounded-full" />
              </View>
            ))}
          </View>
        ) : (
          <View className="bg-gray-50 rounded-xl p-8 items-center">
            <FontAwesome5 name="user-friends" size={32} color="#9CA3AF" />
            <Text className="text-gray-500 mt-3 text-center">No team members yet</Text>
          </View>
        )}
      </View>

      <View className="bg-white rounded-2xl p-5 mb-5 ">
        <View className="flex-row justify-between items-center mb-4">
          <View className="flex-row items-center">
            <View className="w-10 h-10 bg-blue-100 rounded-full justify-center items-center mr-3">
              <FontAwesome5 name="tasks" size={16} color="#3B82F6" />
            </View>
            <Text className="text-lg font-semibold text-gray-900">Project Tasks</Text>
          </View>
          <View className="bg-blue-100 px-3 py-1 rounded-full">
            <Text className="text-blue-800 font-medium text-xs">{project.taskCount} Tasks</Text>
          </View>
        </View>

        {project.tasks.length > 0 ? (
          <View className="space-y-3">
            {project.tasks.map((task, index) => (
              <View key={index} className="bg-gray-50 rounded-xl p-4 border border-gray-200">
                <View className="flex-row justify-between items-start">
                  <View className="flex-1">
                    <Text className="text-base font-semibold text-gray-900 mb-2">{task.title}</Text>
                    <View className="flex-row items-center">
                      <View className={`px-2 py-1 rounded-full ${getPriorityColor(task.priority)}/20 mr-3`}>
                        <Text className={`text-xs font-medium ${getPriorityColor(task.priority)}`}>{task.priority}</Text>
                      </View>
                      <View className="flex-row items-center">
                        <FontAwesome5 name="calendar-alt" size={12} color="#6B7280" />
                        <Text className="text-xs text-gray-500 ml-1">Due: {formatDate(task.dueDate)}</Text>
                      </View>
                    </View>
                  </View>
                  <View className="w-8 h-8 bg-blue-100 rounded-full justify-center items-center">
                    <FontAwesome5 name="clock" size={12} color="#3B82F6" />
                  </View>
                </View>
              </View>
            ))}
          </View>
        ) : (
          <View className="bg-gray-50 rounded-xl p-8 items-center">
            <FontAwesome5 name="clipboard-list" size={32} color="#9CA3AF" />
            <Text className="text-gray-500 mt-3 text-center">No tasks created yet</Text>
          </View>
        )}
      </View>
    </ScrollView>
  );
};

export default ProjectDetail;