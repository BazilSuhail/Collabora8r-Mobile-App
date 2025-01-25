import React, { useCallback, useEffect, useState } from 'react';
import { View, Text, Image, TouchableOpacity, ScrollView } from 'react-native';
import { FontAwesome, FontAwesome5 } from '@expo/vector-icons'; // Updated import
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import config from '@/Config/Config';

import { useRouter } from 'expo-router';

import NoTasks from "@/assets/logo.png";
import decodeJWT from '@/Config/DecodeJWT';
import avatarImages from '@/constants/avatar';
import themeImages from '@/constants/themes';

const colors = [
  'bg-red-400', 'bg-blue-400', 'bg-green-700', 'bg-yellow-600', 'bg-indigo-400', 'bg-orange-400', 'bg-cyan-400', 'bg-violet-400'
];

const getRandomColor = () => colors[Math.floor(Math.random() * colors.length)];

const Home = () => {
  const router = useRouter();
  const [tasks, setTasks] = useState([]);
  const [filteredTasks, setFilteredTasks] = useState([]);
  const [statusFilter, setStatusFilter] = useState('All');
  const [dateFilter, setDateFilter] = useState('All');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [userName, setUserName] = useState('');
  const [usersId, setUsersId] = useState('');
  const [projectColors, setProjectColors] = useState({});

  useEffect(() => {
    const fetchUserData = async () => {
      try {

        //const response = await axios.post(`${config.VITE_REACT_APP_API_BASE_URL}/auth/signin`, {email:'a@gmail.com',password:'112233'});
        //await AsyncStorage.setItem('token', response.data.token);
        const token = await AsyncStorage.getItem('token');

        //console.log(token);
        if (!token) {
          //throw new Error('No token found, please sign in again.');
          router.push("/authentication/login")
        }

        setUserName("asdasd");
        //const userId = decodeJWT(token);
        //setUsersId(userId);

        const tasksResponse = await axios.get(`${config.VITE_REACT_APP_API_BASE_URL}/overview/assigned-tasks`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        //console.log('jjsjj');
        const fetchedTasks = tasksResponse.data.tasks;
        setTasks(fetchedTasks);
        setFilteredTasks(fetchedTasks);

        const colorMapping = {};
        fetchedTasks.forEach(project => {
          const projectId = project.projectId;
          if (!colorMapping[projectId]) {
            colorMapping[projectId] = getRandomColor();
          }
        });
        setProjectColors(colorMapping);
      }
      catch (err) {
        setError(err.message || 'Error fetching tasks');
      }
      finally {
        setLoading(false);
      }
    };

    fetchUserData();
  }, []);

  const filterTasks = useCallback(() => {
    let filtered = tasks;

    if (statusFilter !== 'All') {
      filtered = filtered.filter(task => task.status === statusFilter);
    }

    if (dateFilter !== 'All') {
      const now = new Date();
      if (dateFilter === 'Upcoming') {
        filtered = filtered.filter(task => new Date(task.dueDate) > now);
      } else if (dateFilter === 'Missed') {
        filtered = filtered.filter(task => new Date(task.dueDate) < now && task.status !== 'Completed');
      }
    }

    setFilteredTasks(filtered);
  }, [tasks, statusFilter, dateFilter]);

  useEffect(() => {
    filterTasks();
  }, [statusFilter, dateFilter, filterTasks]);

  const statusCounts = {
    'Not Started': tasks.filter((task) => task.status === 'Not Started').length,
    'In Progress': tasks.filter((task) => task.status === 'In Progress').length,
    'Completed': tasks.filter((task) => task.status === 'Completed').length,
  };

  if (loading) {
    return <View><Text>loading</Text></View>;
  }
  if (error) {
    return <View><Text>{error}</Text></View>;
  }

  return (
    <View className="min-h-screen bg-white py-6 px-3 sm:p-6">
      <View className="relative mb-[18px] w-full h-[120px] rounded-xl overflow-hidden">
        dsjd
        <View className="absolute inset-0 w-full flex-row space-x-[8px] items-center pb-[8px]">
          <Image source={themeImages["1"]}
            className="h-[120px] w-full object-cover"
          />
        </View>

        <View className="absolute h-[120px] inset-0 w-full px-[18px] bg-black/50 z-10">
          <Text className="ml-[8px] underline mt-[25px] underline-offset-[12px] font-[700] text-[15px] md:text-[24px] xl:text-[30px] text-blue-100">
            Bazil
          </Text>
        </View>
      </View>

      <ScrollView className="grid grid-cols-1">
        <View className="col-span-1 xl:col-span-2 mb-[15px]">
          <View className="flex-row space-x-[8px] mb-[15px]">
            <TouchableOpacity
              className={`text-[15px] border border-gray-300 flex-row space-x-[8px] whitespace-nowrap md:mr-[12px] items-center px-4 py-[3px] rounded-lg shadow-md transition-colors duration-200 ${dateFilter === 'All' ? 'bg-green-600 text-white' : 'bg-gray-100 text-gray-700'}`}
              onPress={() => setDateFilter('All')}
            >
              <FontAwesome name="filter" className="mr-2" />
              <Text className='font-[600]'>All Dates</Text>
            </TouchableOpacity>
            <TouchableOpacity
              className={`flex-row space-x-[8px] whitespace-nowrap text-[15px] border border-gray-300 items-center px-4 py-[3px] rounded-lg shadow-md transition-colors duration-200 ${dateFilter === 'Missed' ? 'bg-red-600 text-white' : 'bg-gray-100 text-gray-700'}`}
              onPress={() => setDateFilter('Missed')}
            >
              <FontAwesome name="times-circle" className="mr-2" />
              <Text className='font-[600]'>Missed</Text>
            </TouchableOpacity>
          </View>

          <View className="xsx:mx-[5px] border-[2px] pl-[15px] py-[20px] w-full rounded-xl bg-white">
            <View className="mb-[12px] flex-row space-x-[8px] items-center text-gray-700 lg:text-[18px]">
              <FontAwesome name="calendar" className="bg-blue-500 mr-[5px] lg:mr-[10px] text-white rounded-full p-2 text-[24px] lg:text-[28px]" />
              <Text className='font-[600]'>Scheduled: </Text>
              <Text className="font-semibold text-lg lg:text-[19px] ml-[8px]">{statusCounts['Not Started']}</Text>
            </View>
            <View className="mb-[12px] flex-row space-x-[8px] items-center text-gray-700 lg:text-[18px]">
              <FontAwesome5 name="running" className="bg-yellow-500 mr-[5px] lg:mr-[10px] text-white rounded-full p-2 text-[24px] lg:text-[28px]" />
              <Text className='font-[600]'>In Progress: </Text>
              <Text className="font-semibold text-lg lg:text-[19px] ml-[8px]">{statusCounts['In Progress']}</Text>
            </View>
            <View className="flex-row space-x-[8px] items-center text-gray-700 lg:text-[18px]">
              <FontAwesome name="check-circle" className="bg-green-500 mr-[5px] lg:mr-[10px] text-white rounded-full p-2 text-[24px] lg:text-[28px]" />
              <Text className='font-[600]'>Completed: </Text>
              <Text className="font-semibold text-lg lg:text-[19px] ml-[8px]">{statusCounts['Completed']}</Text>
            </View>
          </View>
        </View>

        <View className="col-span-3 xsx:mx-[8px] xl:col-span-5 xl:px-[25px]">
          <ScrollView horizontal className="flex-row space-x-[8px] overflow-x-auto space-x-[4px space-x-[8px] hide-scrollbar">
            <TouchableOpacity
              className={`flex-row space-x-[8px] text-[15px] border border-gray-300 whitespace-nowrap items-center px-3 py-[2px] rounded-lg transition-colors duration-200 ${statusFilter === 'All' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700'}`}
              onPress={() => setStatusFilter('All')}
            >
              <FontAwesome5 name="tasks" className="mr-2" />
              <Text className='font-[600]'>All Tasks</Text>
            </TouchableOpacity>
            {['Not Started', 'In Progress', 'Completed'].map((status) => (
              <TouchableOpacity
                key={status}
                className={`flex-row space-x-[8px] whitespace-nowrap text-[15px] border border-gray-300 items-center px-3 py-[3px] rounded-lg transition-colors duration-200 ${statusFilter === status ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700'}`}
                onPress={() => setStatusFilter(status)}
              >
                {status === 'Not Started' && <FontAwesome name="hourglass-half" className="mr-2" />}
                {status === 'In Progress' && <FontAwesome name="check-circle" className="mr-2" />}
                {status === 'Completed' && <FontAwesome name="times-circle" className="mr-2" />}
                <Text className={`font-[600] ${statusFilter === status ? ' text-white' : 'text-gray-700'}`}>{status}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          <View className="grid gap-4 mt-[20px]">
            {filteredTasks.length > 0 ? (
              filteredTasks.map((task) => (
                <TouchableOpacity
                  key={task._id}
                  onPress={() => router.push(`/${task._id}-${usersId}`)}
                  className="px-4 pt-4 pb-[-12px] bg-white border-[2px] rounded-lg transform transition duration-300 hover:scale-[1.01]"
                >
                  <View className="flex-row space-x-[8px]">
                    <Text className="text-[17px] xsx:text-[19px] flex-row space-x-[8px] items-center font-[600]">
                      <View className="bg-gray-400 p-[5px] xsx:p-[8px] rounded-full">
                        <FontAwesome5 name="clipboard-list" className="text-white text-[17px] xsx:text-[20px]" />
                      </View>
                      <Text className="ml-[8px] text-[14px] sm:text-[17px] mt-[-3px]">{task.title.slice(0, 48)}{task.title.length > 29 && '...'}</Text>
                    </Text>
                  </View>
                </TouchableOpacity>
              ))
            ) : (
              <View className="flex-row space-x-[8px]   space-x-[8px]-col items-center">
                <Image source={NoTasks} className="scale-[0.75] mt-[55px] md:mt-[-80px]" />
                <Text className="text-center text-blue-500 mt-[-45px] md:mt-[-105px] bg-blue-100 rounded-lg px-[35px] py-2">No tasks found.</Text>
              </View>
            )}
          </View>
        </View>
      </ScrollView>
    </View>
  );
};

export default Home;
