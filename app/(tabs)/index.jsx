import NoTasks from '@/assets/images/icon.png';
import config from '@/config/config';
import themeImages from '@/constants/themes';
import { useAuthContext } from '@/hooks/AuthProvider';
import { FontAwesome5, Ionicons, MaterialIcons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import { useRouter } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  RefreshControl,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import EmptyState from '../../components/EmptyState';

const Home = () => {
  const { user } = useAuthContext();
  const router = useRouter();
  const [tasks, setTasks] = useState([]);
  const [filteredTasks, setFilteredTasks] = useState([]);
  const [statusFilter, setStatusFilter] = useState('All');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);

  // New state for projects
  const [projectStats, setProjectStats] = useState({
    joined: 0,
    admin: 0,
    manageed: 0,
    allProjects: 0,
  });

  const fetchUserData = async (initial = false) => {
    try {
      if (initial) setLoading(true);
      setRefreshing(true);

      const token = await AsyncStorage.getItem('token');
      if (!token) return router.push('/authentication/login');

      // Fetch tasks
      const tasksResponse = await axios.get(
        `${config.VITE_REACT_APP_API_BASE_URL}/overview/assigned-tasks`,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      const fetchedTasks = tasksResponse.data.tasks;
      setTasks(fetchedTasks);
      setFilteredTasks(fetchedTasks);

      // Fetch admin projects
      const adminProjectsResponse = await axios.get(
        `${config.VITE_REACT_APP_API_BASE_URL}/admin-projects/`,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      // Fetch joined projects
      const joinedProjectsResponse = await axios.get(
        `${config.VITE_REACT_APP_API_BASE_URL}/joinedprojects`,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      const managedProjectsResponse = await axios.get(
        `${config.VITE_REACT_APP_API_BASE_URL}/joinedprojects/as-manager`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      // Calculate project statistics
      const adminProjects = adminProjectsResponse.data;
      const joinedProjects = joinedProjectsResponse.data;
      const manageedProjects = managedProjectsResponse.data;
      const allProjects = [...adminProjects, ...joinedProjects, ...manageedProjects];

      setProjectStats({
        admin: adminProjects.length,
        joined: joinedProjects.length,
        manageed: manageedProjects.length,
        allProjects: allProjects.length,
      });

      setError(null);
    } catch (err) {
      setError(err.message || 'Error fetching data');
    } finally {
      if (initial) setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchUserData(true);
  }, []);

  const filterTasks = useCallback(() => {
    let filtered = [...tasks];

    if (statusFilter !== 'All') {
      filtered = filtered.filter(task => task.status === statusFilter);
    }

    setFilteredTasks(filtered);
  }, [tasks, statusFilter]);

  useEffect(() => {
    filterTasks();
  }, [statusFilter, filterTasks]);

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const statusCounts = {
    'Not Started': tasks.filter(t => t.status === 'Not Started').length,
    'In Progress': tasks.filter(t => t.status === 'In Progress').length,
    'Completed': tasks.filter(t => t.status === 'Completed').length,
  };

  if (loading) {
    return (
      <View className="flex-1 justify-center items-center bg-gray-100">
        <ActivityIndicator size="large" color="#6366f1" />
        <Text className="mt-3 text-gray-500 text-sm font-medium">Loading dashboard...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View className="flex-1 justify-center items-center bg-gray-100 p-6">
        <View className="w-16 h-16 bg-red-50 rounded-full items-center justify-center mb-4">
          <MaterialIcons name="error-outline" size={28} color="#ef4444" />
        </View>
        <Text className="text-red-600 text-center text-sm font-medium">{error}</Text>
        <TouchableOpacity
          onPress={() => fetchUserData(true)}
          className="mt-4 px-4 py-2 bg-red-50 rounded-lg"
        >
          <Text className="text-red-600 text-sm font-medium">Try again</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <ScrollView
      className="bg-gray-100 flex-1"
      showsVerticalScrollIndicator={false}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={() => fetchUserData(false)} />
      }
    >
      <View className="px-4 pt-6 pb-8">
        {/* Header */}
        <View className="relative h-40 rounded-t-2xl rounded-b-md overflow-hidden mb-3">
          <Image source={themeImages["3"]} className="absolute h-full w-full" />
          <View className="absolute inset-0 bg-black/40 justify-center px-6">
            <Text className="text-white text-sm font-bold">Welcome !!</Text>
            <Text className="text-white/90 text-[25px] font-medium mt-1">
              {user.name.length > 15 ? user.name.slice(0, 15) + "..." : user.name}
            </Text>
          </View>
          <View className="absolute top-4 right-4">
            <TouchableOpacity className="w-8 h-8 bg-white/20 rounded-full items-center justify-center">
              <MaterialIcons name="more-horiz" size={20} color="white" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Overview Section */}
        <View className="mb-6">
          <View className="">
            {/* Top Row */}
            <View className="flex-row justify-between mb-4">
              {/* Time Tracked */}
              <View className="flex-1 mr-2">
                <View className="bg-white rounded-lg p-6 items-start relative">
                  <View className="absolute top-2 right-2 bg-red-500 rounded-full w-5 h-5 items-center justify-center">
                    <Text className="text-white text-xs font-bold">1</Text>
                  </View>
                  <View className="w-8 h-8 bg-red-100 rounded-lg items-center justify-center mb-3">
                    <MaterialIcons name="schedule" size={16} color="#ef4444" />
                  </View>
                  <Text className="text-gray-900 text-xl font-bold mb-1">{projectStats.allProjects}</Text>
                  <Text className="text-gray-600 text-xs font-medium">All Projects</Text>
                </View>
              </View>

              {/* Projects Finished */}
              <View className="flex-1 ml-2">
                <View className="bg-white rounded-lg p-6 items-start">
                  <View className="absolute top-3 right-3">
                    <TouchableOpacity>
                      <MaterialIcons name="more-horiz" size={18} color="#9ca3af" />
                    </TouchableOpacity>
                  </View>
                  <View className="w-8 h-8 bg-blue-100 rounded-lg items-center justify-center mb-3">
                    <MaterialIcons name="check-circle" size={16} color="#3b82f6" />
                  </View>
                  <Text className="text-gray-900 text-xl font-bold mb-1">{projectStats.admin}</Text>
                  <Text className="text-gray-600 text-xs font-medium">Projects Adminstered</Text>
                </View>
              </View>
            </View>


            {/* Bottom Row */}
            <View className="flex-row justify-between">
              {/* Total Revenue */}
              <View className="flex-1 mr-2">
                <View className="bg-white rounded-lg p-6 items-start">
                  <View className="absolute top-3 right-3">
                    <TouchableOpacity>
                      <MaterialIcons name="more-horiz" size={18} color="#9ca3af" />
                    </TouchableOpacity>
                  </View>
                  <View className="w-8 h-8 bg-yellow-100 rounded-lg items-center justify-center mb-3">
                    <MaterialIcons name="attach-money" size={16} color="#f59e0b" />
                  </View>
                  <Text className="text-gray-900 text-xl font-bold mb-1">{projectStats.manageed}</Text>
                  <Text className="text-gray-600 text-xs font-medium">Managed Projects</Text>
                </View>
              </View>

              {/* Total Members */}
              <View className="flex-1 ml-2">
                <View className="bg-white rounded-lg p-6 items-start">
                  <View className="absolute top-3 right-3">
                    <TouchableOpacity>
                      <MaterialIcons name="more-horiz" size={18} color="#9ca3af" />
                    </TouchableOpacity>
                  </View>
                  <View className="w-8 h-8 bg-purple-100 rounded-lg items-center justify-center mb-3">
                    <MaterialIcons name="group" size={16} color="#8b5cf6" />
                  </View>
                  <Text className="text-gray-900 text-xl font-bold mb-1">{projectStats.joined}</Text>
                  <Text className="text-gray-600 text-xs font-medium">Joined Projects</Text>
                </View>
              </View>
            </View>
          </View>
        </View>

        {/* Task Statistics */}
        <View className="mb-6">

          <View className="bg-white rounded-xl p-4">
            <View className="flex-row justify-between" style={{ gap: 12 }}>
              {Object.entries(statusCounts).map(([label, count], index) => {
                const colors = {
                  0: {
                    bg: 'bg-blue-50',
                    iconBg: 'bg-blue-100',
                    iconColor: '#3b82f6',
                    accent: 'bg-blue-500',
                    textColor: 'text-blue-600'
                  },
                  1: {
                    bg: 'bg-yellow-50',
                    iconBg: 'bg-yellow-100',
                    iconColor: '#f59e0b',
                    accent: 'bg-yellow-500',
                    textColor: 'text-yellow-600'
                  },
                  2: {
                    bg: 'bg-green-50',
                    iconBg: 'bg-green-100',
                    iconColor: '#10b981',
                    accent: 'bg-green-500',
                    textColor: 'text-green-600'
                  }
                };

                const config = colors[index];

                return (
                  <View key={label} className="flex-1 items-center ">
                    <View
                      className={`w-full  h-24 ${config.bg} rounded-xl items-center justify-center relative p-2`}
                    >
                      {/* Count badge */}
                      <View
                        className={`absolute -top-1 -right-1 w-6 h-6 ${config.accent} rounded-full items-center justify-center`}
                      >
                        <Text className="text-white text-xs font-bold">{count}</Text>
                      </View>

                      {/* Icon */}
                      <View className={`w-12 h-12 ${config.iconBg} rounded-lg items-center justify-center mb-1`}>
                        <FontAwesome5
                          name={
                            label === 'Not Started'
                              ? 'calendar-alt'
                              : label === 'In Progress'
                                ? 'clock'
                                : 'check-circle'
                          }
                          size={20}
                          color={config.iconColor}
                        />
                      </View>

                      {/* Label inside the card */}
                      <Text className={`${config.textColor} text-[10px] font-semibold text-center`}>
                        {label === 'Not Started' ? 'To Start' : label === 'In Progress' ? 'Active' : 'Done'}
                      </Text>
                    </View>
                  </View>
                );
              })}
            </View>

          </View>
        </View>

        {/* Status Filter */}
        <View className="mb-6">
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <View className="flex-row px-1" style={{ gap: 8 }}>
              {[
                { label: 'All', value: 'All', icon: 'layers' },
                { label: 'To Start', value: 'Not Started', icon: 'calendar' },
                { label: 'Active', value: 'In Progress', icon: 'play' },
                { label: 'Done', value: 'Completed', icon: 'checkmark-circle' }
              ].map((status) => (
                <TouchableOpacity
                  key={status.value}
                  onPress={() => setStatusFilter(status.value)}
                  className={`flex-row items-center px-4 py-2.5 rounded-lg ${statusFilter === status.value
                    ? 'bg-blue-500'
                    : 'bg-white'
                    }`}
                >
                  <Ionicons
                    name={status.icon}
                    size={14}
                    color={statusFilter === status.value ? 'white' : '#6b7280'}
                    style={{ marginRight: 6 }}
                  />
                  <Text className={`font-medium text-sm ${statusFilter === status.value ? 'text-white' : 'text-gray-600'
                    }`}>
                    {status.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </ScrollView>
        </View>

        {/* To-do List Section */}
        <View className="min-h-[400px]">
          <View className="flex-row items-center justify-between mb-3">
            <Text className="text-gray-900 text-lg font-semibold">To-do List</Text>
            <TouchableOpacity>
              <Text className="text-indigo-500 text-sm font-medium">View All</Text>
            </TouchableOpacity>
          </View>
          {filteredTasks.length > 0 ? (
            <View className="]" style={{ gap: 12 }}>
              {filteredTasks.slice(0, 5).map((task) => {
                // Map status to styles
                const statusConfig = {
                  "Not Started": {
                    icon: "hourglass-empty",
                    iconBg: "bg-blue-100",
                    iconColor: "#3b82f6", // blue-500
                    progressColor: "bg-blue-500",
                    textColor: "text-blue-600",
                    label: "To Start",
                  },
                  "In Progress": {
                    icon: "autorenew",
                    iconBg: "bg-yellow-100",
                    iconColor: "#eab308", // yellow-500
                    progressColor: "bg-yellow-500",
                    textColor: "text-yellow-600",
                    label: "Active",
                  },
                  "Completed": {
                    icon: "check-circle",
                    iconBg: "bg-green-100",
                    iconColor: "#22c55e", // green-500
                    progressColor: "bg-green-500",
                    textColor: "text-green-600",
                    label: "Done",
                  },
                };

                const config = statusConfig[task.status] || statusConfig["Not Started"];

                return (
                  <TouchableOpacity
                    key={task._id}
                    onPress={() => router.push(`/${task._id}-${user._id}`)}
                    className="bg-white rounded-xl p-4"
                  >
                    <View className="flex-row items-start">
                      {/* Status Icon */}
                      <View
                        className={`w-10 h-10 rounded-lg items-center justify-center mr-3 ${config.iconBg}`}
                      >
                        <MaterialIcons name={config.icon} size={18} color={config.iconColor} />
                      </View>

                      {/* Task Details */}
                      <View className="flex-1">
                        {/* Title */}
                        <Text className="text-gray-900 font-semibold text-sm mb-1">
                          {task.title.slice(0, 50)}
                          {task.title.length > 50 && "..."}
                        </Text>

                        {/* Status + Due Date */}
                        <View className="flex-row items-center justify-between">
                          <View className={`px-2.5 py-1 rounded-full ${config.iconBg}`}>
                            <Text className={`text-xs font-medium ${config.textColor}`}>
                              {config.label}
                            </Text>
                          </View>

                          {task.dueDate && (
                            <Text className="text-gray-500 text-xs">
                              Due: {formatDate(task.dueDate)}
                            </Text>
                          )}
                        </View>

                        {/* Progress bar */}
                        <View className="mt-2">
                          <View className="w-full bg-gray-200 rounded-full h-1">
                            <View
                              className={`${config.progressColor} h-1 rounded-full`}
                              style={{ width: task.progress }}
                            />
                          </View>
                          <Text className={`${config.textColor} text-xs font-medium mt-1`}>
                            {task.progress}
                          </Text>
                        </View>
                      </View>
                    </View>
                  </TouchableOpacity>
                );
              })}
            </View>
          ) : (
          <EmptyState 
  title="No Projects Found" 
  desc="Create your first project to get started"
  imageSource={require('@/assets/placeholders/noTasks.png')}
/>
          )}

        </View>
      </View>
    </ScrollView>
  );
};

export default Home;