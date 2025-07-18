import { useCallback, useEffect, useState } from 'react';
import { View, Text, Image, TouchableOpacity, ScrollView, ActivityIndicator } from 'react-native';
import { Feather, FontAwesome5, MaterialIcons } from '@expo/vector-icons';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import config from '@/config/config';
import { useRouter } from 'expo-router';
import NoTasks from '@/assets/logo.png'; 
import themeImages from '@/constants/themes';
import { useAuthContext } from '@/hooks/AuthProvider';

const Home = () => {
  const { user } = useAuthContext();
  const router = useRouter();
  const [tasks, setTasks] = useState([]);
  const [filteredTasks, setFilteredTasks] = useState([]);
  const [statusFilter, setStatusFilter] = useState('All');
  const [dateFilter, setDateFilter] = useState('All');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null); 

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const token = await AsyncStorage.getItem('token');
        if (!token) return router.push('/authentication/login');

        const tasksResponse = await axios.get(
          `${config.VITE_REACT_APP_API_BASE_URL}/overview/assigned-tasks`,
          { headers: { Authorization: `Bearer ${token}` } }
        );

        const fetchedTasks = tasksResponse.data.tasks;
        setTasks(fetchedTasks);
        setFilteredTasks(fetchedTasks);
      } catch (err) {
        setError(err.message || 'Error fetching tasks');
      } finally {
        setLoading(false);
      }
    };
    fetchUserData();
  }, []);

  const filterTasks = useCallback(() => {
    let filtered = [...tasks];
    const now = new Date();

    if (statusFilter !== 'All') {
      filtered = filtered.filter(task => task.status === statusFilter);
    }

    if (dateFilter === 'Missed') {
      filtered = filtered.filter(task => new Date(task.dueDate) < now && task.status !== 'Completed');
    } else if (dateFilter === 'Upcoming') {
      filtered = filtered.filter(task => new Date(task.dueDate) > now);
    }

    setFilteredTasks(filtered);
  }, [tasks, statusFilter, dateFilter]);

  useEffect(() => {
    filterTasks();
  }, [statusFilter, dateFilter, filterTasks]);

  const statusCounts = {
    'Not Started': tasks.filter(t => t.status === 'Not Started').length,
    'In Progress': tasks.filter(t => t.status === 'In Progress').length,
    'Completed': tasks.filter(t => t.status === 'Completed').length,
  };

  if (loading) {
    return (
      <View className="flex-1 justify-center items-center bg-gray-50">
        <ActivityIndicator size="large" color="#3b82f6" />
        <Text className="mt-4 text-gray-600 text-base">Loading tasks...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View className="flex-1 justify-center items-center bg-gray-50 p-6">
        <MaterialIcons name="error-outline" size={48} color="#ef4444" />
        <Text className="text-red-500 text-center mt-4 text-base">{error}</Text>
      </View>
    );
  }

  return (
    <ScrollView className="bg-gray-50 flex-1">
      <View className="px-4 pt-4">
        {/* Header Section */}
        <View className="relative h-32 rounded-2xl overflow-hidden mb-6">
          <Image source={themeImages["1"]} className="absolute h-full w-full" />
          <View className="absolute inset-0 bg-black/40 justify-center px-6">
            <Text className="text-white text-2xl font-bold">Welcome back,</Text>
            <Text className="text-white text-lg font-medium">{user.name}</Text>
          </View>
        </View>

        {/* Date Filter Section */}
        <View className="mb-6">
          <Text className="text-gray-800 text-lg font-semibold mb-3">Filter by Date</Text>
          <View className="flex-row space-x-3">
            {[
              { label: 'All Dates', value: 'All', icon: 'calendar' },
              { label: 'Missed', value: 'Missed', icon: 'alert-circle' },
              { label: 'Upcoming', value: 'Upcoming', icon: 'clock' }
            ].map(filter => (
              <TouchableOpacity
                key={filter.value}
                onPress={() => setDateFilter(filter.value)}
                className={`flex-row items-center px-4 py-3 rounded-xl border-2 ${
                  dateFilter === filter.value 
                    ? 'bg-blue-600 border-blue-600' 
                    : 'bg-white border-gray-200'
                }`}
              >
                <Feather 
                  name={filter.icon} 
                  size={16} 
                  color={dateFilter === filter.value ? 'white' : '#6b7280'} 
                  style={{ marginRight: 8 }}
                />
                <Text className={`font-medium ${
                  dateFilter === filter.value ? 'text-white' : 'text-gray-600'
                }`}>
                  {filter.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Status Overview Cards */}
        <View className="mb-6">
          <Text className="text-gray-800 text-lg font-semibold mb-3">Task Overview</Text>
          <View className="bg-white rounded-2xl p-5 border border-gray-100">
            {Object.entries(statusCounts).map(([label, count], index) => (
              <View key={label} className="flex-row items-center justify-between py-3">
                <View className="flex-row items-center">
                  <View className={`w-12 h-12 rounded-xl items-center justify-center ${
                    index === 0 ? 'bg-blue-100' : index === 1 ? 'bg-yellow-100' : 'bg-green-100'
                  }`}>
                   <FontAwesome5
                      name={label === 'Not Started' ? 'calendar-alt' : label === 'In Progress' ? 'running' : 'check-circle'}
                      size={20}
                      color={index === 0 ? '#3b82f6' : index === 1 ? '#f59e0b' : '#10b981'}
                    />	
                  </View>
                  <Text className="ml-4 text-gray-700 font-medium text-base">{label}</Text>
                </View>
                <View className={`px-3 py-1 rounded-full ${
                  index === 0 ? 'bg-blue-100' : index === 1 ? 'bg-yellow-100' : 'bg-green-100'
                }`}>
                  <Text className={`font-bold text-lg ${
                    index === 0 ? 'text-blue-600' : index === 1 ? 'text-yellow-600' : 'text-green-600'
                  }`}>
                    {count}
                  </Text>
                </View>
              </View>
            ))}
          </View>
        </View>

        {/* Status Filter Section */}
        <View className="mb-6">
          <Text className="text-gray-800 text-lg font-semibold mb-3">Filter by Status</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} className="flex-row">
            <View className="flex-row">
              {['All', 'Not Started', 'In Progress', 'Completed'].map((status) => (
                <TouchableOpacity
                  key={status}
                  onPress={() => setStatusFilter(status)}
                  className={`px-[15px] py-[5px] mr-[6px] rounded-[15px] border-[1px] ${
                    statusFilter === status 
                      ? 'bg-blue-600 border-blue-600' 
                      : 'bg-white border-gray-200'
                  }`}
                >
                  <Text className={`font-medium text-[12px] ${
                    statusFilter === status ? 'text-white' : 'text-gray-600'
                  }`}>
                    {status}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </ScrollView>
        </View>

        {/* Tasks List */}
        <View className="mb-6">
          <Text className="text-gray-800 text-lg font-semibold mb-3">
            Your Tasks ({filteredTasks.length})
          </Text>
          {filteredTasks.length > 0 ? (
            <View className="space-y-3">
              {filteredTasks.map(task => (
                <TouchableOpacity
                  key={task._id}
                  onPress={() => router.push(`/${task._id}-${user._id}`)}
                  className="bg-white rounded-2xl p-4 border border-gray-100"
                >
                  <View className="flex-row items-center">
                    <View className="w-12 h-12 bg-gray-100 rounded-xl items-center justify-center mr-4">
                      <FontAwesome5 
                        name="clipboard-list" 
                        size={20} 
                        color="#6b7280" 
                      />
                    </View>
                    <View className="flex-1">
                      <Text className="text-gray-800 font-semibold text-base leading-5">
                        {task.title.slice(0, 48)}{task.title.length > 48 && '...'}
                      </Text>
                      <View className="flex-row items-center mt-2">
                        <View className={`px-2 py-1 rounded-full ${
                          task.status === 'Not Started' ? 'bg-blue-100' :
                          task.status === 'In Progress' ? 'bg-yellow-100' : 'bg-green-100'
                        }`}>
                          <Text className={`text-xs font-medium ${
                            task.status === 'Not Started' ? 'text-blue-600' :
                            task.status === 'In Progress' ? 'text-yellow-600' : 'text-green-600'
                          }`}>
                            {task.status}
                          </Text>
                        </View>
                      </View>
                    </View>
                    <MaterialIcons name="chevron-right" size={24} color="#9ca3af" />
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          ) : (
            <View className="items-center py-12">
              <Image source={NoTasks} className="w-32 h-32 mb-6 opacity-50" resizeMode="contain" />
              <Text className="text-gray-500 text-lg font-medium mb-2">No tasks found</Text>
              <Text className="text-gray-400 text-center px-8">
                Try adjusting your filters or create a new task to get started.
              </Text>
            </View>
          )}
        </View>
      </View>
    </ScrollView>
  );
};

export default Home;