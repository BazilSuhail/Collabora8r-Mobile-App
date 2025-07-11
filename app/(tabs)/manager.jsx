import { useState, useEffect } from 'react';
import axios from 'axios';
import { View, Text, Image, TouchableOpacity, ScrollView } from 'react-native';
import { FontAwesome, FontAwesome5 } from '@expo/vector-icons';

import AsyncStorage from '@react-native-async-storage/async-storage';
import config from '@/config/config';
import { Link, useRouter } from 'expo-router';
import themeImages from '@/constants/themes';
import avatarImages from '@/constants/avatar';


const colors = [
    'bg-red-400', 'bg-blue-400', 'bg-green-700', 'bg-yellow-600', 'bg-indigo-400', 'bg-orange-400', 'bg-cyan-400', 'bg-violet-400'
];
const getRandomColor = () => colors[Math.floor(Math.random() * colors.length)];

const Manager = () => {
    const navigate = useRouter();
    const [projects, setProjects] = useState([]);
    const [error, setError] = useState('');

    useEffect(() => {
        const fetchAsManagerProjects = async () => {
            try {
                const token = await AsyncStorage.getItem('token');
                const response = await axios.get(`${config.VITE_REACT_APP_API_BASE_URL}/joinedprojects/as-manager`, {
                    headers: { Authorization: `Bearer ${token}` },
                });

                const updatedProjects = response.data.map((project) => ({
                    ...project,
                    color: getRandomColor(),
                }));

                setProjects(updatedProjects);
            } catch (err) {
                console.error(err);
                setError('Failed to fetch projects.');
            }
        };

        fetchAsManagerProjects();
    }, []);

    // Render conditional components
    return (
        <ScrollView className="flex-1 bg-white p-5">
            {/* Header */}
            <View className="flex-row items-center mb-2.5">
                <FontAwesome5 name="users" size={24} color="gray" />
                <Text className="text-2xl font-bold text-gray-500 ml-2.5">Joined Projects</Text>
            </View>
            <Text className="text-sm font-medium text-gray-500 mb-4">
                View all of the projects associated with your account
            </Text>

            {/* Error Message */}
            {error && !projects.length ? (
                <View className="p-4 bg-red-100 border border-red-300 rounded-md">
                    <Text className="text-red-500">{error} No projects found.</Text>
                </View>
            ) : (
                <View className="flex-wrap flex-row justify-between">
                    {projects.map((project) => (
                        <View
                            key={project._id}
                            className="w-full max-w-[380px] h-[170px] bg-white border-2 border-gray-200 rounded-xl shadow-sm mb-4 overflow-hidden"
                        >
                  
                  <Link href={`/joinedProjects/${project._id}`}>
                <View className="relative mb-[45px] w-full h-[100px] overflow-hidden">
                  <View className="absolute inset-0 w-full flex-row space-x-[8px] items-center pb-[8px]">
                    <Image source={themeImages[project.theme]}
                      className="h-[120px] w-full object-cover"
                    />
                  </View>
                  <View className="absolute h-[100px] flex-row items-center justify-between inset-0 w-full px-[18px] bg-black/40 z-10">
                    <View>
                      <Text className="text-[15px] font-semibold text-white">
                        {project.name}{project.name.length > 2 ? project.name.substring(0, 2) : project.name}
                      </Text>
                      <Text className="text-[11px] font-semibold text-gray-400">
                        {project.createdBy.name}
                      </Text>
                    </View>
                    <View className="items-center">
                      <Image
                        source={avatarImages[project.createdBy.avatar]}
                        className="h-[60px] w-[60px] rounded-full border-4 border-white"
                      />
                    </View>
                  </View>
                </View>
              </Link>

              <View className="pl-[20px] mt-[15px]">
                <View className="flex-row items-center ml-[-1] mb-1">
                  <FontAwesome5 name="users" size={12} color="#1e90ff" />
                  <Text className="ml-[6px] text-[12px] font-semibold text-gray-500">Team:</Text>
                  <Text className="ml-2 text-[12px] font-[700] text-[#1e90ff]">
                    {project.teamCount}{" "}
                    <Text className="text-[11px]">
                      {project.teamCount === 1 ? "member" : "members"}
                    </Text>
                  </Text>
                </View>

                <View className="flex-row items-center mb-1">
                  <FontAwesome5 name="tasks" size={12} color="#1e90ff" />
                  <Text className="ml-2 text-[12px] font-semibold text-gray-500">Tasks:</Text> 
                  <Text className="ml-2 text-[12px] font-[700] text-[#1e90ff]">
                    {project.taskCount}{" "}
                    <Text className="text-[11px]">
                    {project.taskCount === 1 ? "task" : "tasks"}
                    </Text>
                  </Text>
                </View>

                {/*<View className="flex-row items-center">
                  <FontAwesome5 name="user-edit" size={12} color="#1e90ff" />
                  <Text className="ml-2 text-[12px] font-semibold text-gray-500">
                    {project.projectManager.status === "Pending" ? "Requested " : ""}
                    Manager:
                  </Text>
                  {project.projectManager.status === "Pending" ? (
                    <Text className="ml-2  py-[3px] px-3 bg-[#e0f7ff] rounded-lg text-[10px] font-bold text-[#007acc]">
                      No manager assigned
                    </Text>
                  ) : (
                    <Text className="ml-2 text-xs font-bold text-[#ffa500] underline">
                      {project.projectManager.email}
                    </Text>
                  )}
                </View>*/}
              </View>

                            {/* Project Image
                            <View className="h-[75px] bg-[#f7d774] relative">
                                <Image
                                    source={themeImages[project.theme]}
                                    className="h-[100px] w-full scale-x-[-1] object-cover"
                                />
                                <TouchableOpacity
                                    onPress={() => navigate.push(`/adminProjects/tasks/${project._id}`)}
                                    className="absolute inset-0 bg-black/30 justify-center items-end pr-12"
                                >
                                    <Text className="text-base font-semibold text-white">{project.name}</Text>
                                </TouchableOpacity>
                            </View>
 
                            <TouchableOpacity
                                onPress={() => console.log(`Navigate to /tasks/${project._id}`)}
                                className="flex-row"
                            >
                                <View className="ml-10 -mt-11">
                                    <Image
                                        source={avatarImages[project.createdBy.avatar]}
                                        className="h-[85px] w-[85px] rounded-full border-4 border-white"
                                    />
                                </View>

                                <View className="ml-auto mr-12 -mt-3"> 
                                    <View className="flex-row items-center mb-1">
                                        <FontAwesome5 name="user-shield" size={16} color="#1e90ff" />
                                        <Text className="ml-2 text-xs font-semibold text-gray-500">Admin:</Text>
                                        <Text className="ml-2 text-base font-semibold text-[#1e90ff]">
                                            {project.createdBy.name}
                                        </Text>
                                    </View>
 
                                    <View className="flex-row items-center mb-1">
                                        <FontAwesome5 name="users" size={16} color="#1e90ff" />
                                        <Text className="ml-2 text-sm font-semibold text-gray-500">Team:</Text>
                                        <Text className="ml-2 text-base font-semibold text-[#1e90ff]">
                                            {project.teamCount}{" "}
                                            <Text className="text-xs">
                                                {project.teamCount === 1 ? "member" : "members"}
                                            </Text>
                                        </Text>
                                    </View>
 
                                    <View className="flex-row items-center">
                                        <FontAwesome5 name="tasks" size={16} color="#1e90ff" />
                                        <Text className="ml-2 text-sm font-semibold text-gray-500">Tasks:</Text>
                                        <Text className="ml-2 text-base font-semibold text-[#1e90ff]">
                                            {project.taskCount}{" "}
                                            <Text className="text-xs">
                                                {project.taskCount === 1 ? "task" : "tasks"}
                                            </Text>
                                        </Text>
                                    </View>
                                </View>
                            </TouchableOpacity>
                             */}
                        </View>
                    ))}
                </View>
            )}
        </ScrollView>

    )
};
export default Manager