import { useCallback, useEffect, useState } from 'react';
import { View, Text, Image, TouchableOpacity, ScrollView, ActivityIndicator } from 'react-native';
import { FontAwesome, FontAwesome5 } from '@expo/vector-icons';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import config from '@/config/config';
import { useRouter } from 'expo-router';
import NoTasks from '@/assets/logo.png'; 
import themeImages from '@/constants/themes';
import { useAuthContext } from '@/hooks/AuthProvider';

const colors = [
  'bg-red-400', 'bg-blue-400', 'bg-green-700', 'bg-yellow-600',
  'bg-indigo-400', 'bg-orange-400', 'bg-cyan-400', 'bg-violet-400'
]; 

const Home = () => {
  const { user } = useAuthContext();
  const router = useRouter();
  const [tasks, setTasks] = useState([]);
  const [filteredTasks, setFilteredTasks] = useState([]);
  const [statusFilter, setStatusFilter] = useState('All');
  const [dateFilter, setDateFilter] = useState('All');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null); 
  //const [usersId, setUsersId] = useState('');

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
    return <View className="flex-1 justify-center items-center"><ActivityIndicator size="large" color="#0000ff" /></View>;
  }
  if (error) {
    return <View className="p-4"><Text className="text-red-500">{error}</Text></View>;
  }

  return (
    <ScrollView className="bg-white min-h-screen p-2">
      <View className="relative h-[120px] rounded-xl overflow-hidden mb-6">
        <Image source={themeImages["1"]} className="absolute h-full w-full" />
        <View className="absolute inset-0 bg-black/50 justify-center pl-4">
          <Text className="text-blue-100 text-xl font-bold underline">{user.name}</Text>
        </View>
      </View>

      <View className="mb-4 flex-row space-2">
        {[{ label: 'All Dates', value: 'All', icon: 'filter' }, { label: 'Missed', value: 'Missed', icon: 'times-circle' }].map(filter => (
          <TouchableOpacity
            key={filter.value}
            onPress={() => setDateFilter(filter.value)}
            className={`flex-row items-center px-4 py-2 rounded-lg border ${dateFilter === filter.value ? 'bg-green-600' : 'bg-gray-100 '}`}
          >
            <FontAwesome name={filter.icon} size={16} style={{ marginRight: 6 }} color={`${dateFilter === filter.value ? ' text-white' : 'text-gray-500'}`}/>
            <Text className={`font-semibold ${dateFilter === filter.value ? 'bg-green-600 text-white' : 'bg-gray-100 text-gray-500'}`}>{filter.label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <View className="bg-white border p-4 rounded-xl mb-4">
        {Object.entries(statusCounts).map(([label, count], index) => (
          <View key={label} className="flex-row items-center mb-2">
            <FontAwesome5
              name={label === 'Not Started' ? 'calendar' : label === 'In Progress' ? 'running' : 'check-circle'}
              size={20}
              color="white"
              style={{ backgroundColor: index === 0 ? '#3b82f6' : index === 1 ? '#f59e0b' : '#10b981', borderRadius: 20, padding: 6, marginRight: 8 }}
            />
            <Text className="font-semibold">{label}:</Text>
            <Text className="ml-2 text-lg">{count}</Text>
          </View>
        ))}
      </View>

      <ScrollView horizontal className="mb-4">
        <View className="flex-row space-x-2">
          {['All', 'Not Started', 'In Progress', 'Completed'].map((status) => (
            <TouchableOpacity
              key={status}
              onPress={() => setStatusFilter(status)}
              className={`flex-row items-center px-4 py-2 border rounded-lg ${statusFilter === status ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700'}`}
            >
              <Text className="font-semibold">{status}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>

      {filteredTasks.length > 0 ? (
        filteredTasks.map(task => (
          <TouchableOpacity
            key={task._id}
            onPress={() => router.push(`/${task._id}-${user._id}`)}
            className="bg-white border p-4 rounded-lg mb-3 shadow-sm"
          >
            <View className="flex-row items-center">
              <FontAwesome5 name="clipboard-list" size={20} color="white" style={{ backgroundColor: '#6b7280', padding: 8, borderRadius: 20, marginRight: 8 }} />
              <Text className="text-base font-semibold">{task.title.slice(0, 48)}{task.title.length > 48 && '...'}</Text>
            </View>
          </TouchableOpacity>
        ))
      ) : (
        <View className="items-center">
          <Image source={NoTasks} className="w-48 h-48 mt-4" resizeMode="contain" />
          <Text className="mt-2 text-blue-500 bg-blue-100 px-4 py-2 rounded-lg">No tasks found.</Text>
        </View>
      )}
    </ScrollView>
  );
};

export default Home;