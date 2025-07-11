import React, { useState, useEffect } from 'react';
import axios from 'axios';
//import TasksTimeline from '../TasksTimeline';  
import { View, Text, TouchableOpacity, Image, ScrollView } from 'react-native';
import { FontAwesome, FontAwesome5 } from '@expo/vector-icons';


import AsyncStorage from '@react-native-async-storage/async-storage';
import config from '@/config/config';
import { Link } from 'expo-router';
import themeImages from '@/constants/themes';
import avatarImages from '@/constants/avatar';


const colors = [
  'bg-red-400', 'bg-blue-400', 'bg-green-700', 'bg-yellow-600', 'bg-indigo-400', 'bg-orange-400', 'bg-cyan-400', 'bg-violet-400'
];
const getRandomColor = () => colors[Math.floor(Math.random() * colors.length)];

const JoinedProjects = () => {
  const [projects, setProjects] = useState([]);
  const [error, setError] = useState('');
  const [selectedProjectId, setSelectedProjectId] = useState(null);

  useEffect(() => {
    const fetchJoinedProjects = async () => {
      try {
        const token = await AsyncStorage.getItem('token');
        const response = await axios.get(`${config.VITE_REACT_APP_API_BASE_URL}/joinedprojects`, {
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

    fetchJoinedProjects();
  }, []);

  const handleProjectClick = (projectId) => {
    setSelectedProjectId(projectId); // Update selected project ID
  };

  // Render conditional components
  return (
    <ScrollView className="flex-1 bg-white px-[8px]">
      {/* Header */}
      <View className="flex-row justify-between items-center">
        <View className="flex-row items-center">
          <FontAwesome5 name="users" size={24} color="gray" />
          <Text className="text-2xl font-bold text-gray-500 ml-2">Joined Projects</Text>
        </View>
      </View>

      <Text className="mt-1 text-sm font-medium text-gray-500 mb-4">
        View all of the projects associated with your account
      </Text>

      <View className="h-0.5 bg-gray-300 mb-4" />

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
              className="w-full h-[120px] bg-white border-2 border-gray-200 rounded-xl shadow-sm mb-[3px] overflow-hidden"
            >
              <Link href={`/joinedProjects/${project._id}`}>
                <View className="relative mb-[45px] w-full h-[120px] overflow-hidden">
                  <View className="absolute inset-0 w-full flex-row space-x-[8px] items-center pb-[8px]">
                    <Image source={themeImages[project.theme]}
                      className="h-[120px] w-full object-cover"
                    />
                  </View>

                  {/* detauls of project */}
                  <View className="absolute h-[140px] pt-[5px] flex inset-0 w-full px-[18px] bg-black/50 z-10">

                    <View className="flex-row items-center inset-0 w-full">
                      <Text className="text-[28px] mb-[15px] mt-[8px] font-[400] scale-y-[0.9] text-gray-200">
                        {project.name}{project.name.length > 2 ? project.name.substring(0, 2) : project.name}
                      </Text>
                    </View>

                    <View className='flex-row justify-between items-center w-full'>
                      <View>
                        <View className="flex-row items-center ml-[-3px]  mb-[3px]">
                          <FontAwesome5 name="users" size={12} color="#dde2ed" />
                          <Text className="ml-2 text-[12px] font-[700] text-gray-200">
                            {project.teamCount}{" "}
                            <Text className="text-[11px]">
                              {project.teamCount === 1 ? "member" : "members"}
                            </Text>
                          </Text>
                        </View>

                        <View className="flex-row items-center">
                          <FontAwesome5 name="tasks" size={12} color="#dde2ed" />
                          <Text className="ml-2 text-[12px] font-[700] bg-[ #dde2ed] text-gray-200">
                            {project.taskCount}{" "}
                            <Text className="text-[11px]">
                              {project.taskCount === 1 ? "task" : "tasks"}
                            </Text>
                          </Text>

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
                      </View>

                      <View className="flex inset-0"> 
                          <Image
                            source={avatarImages[project.createdBy.avatar]}
                            className="h-[24px] w-[24px] rounded-full border-4 border-white"
                          /> 
                        <Text className="text-[12px] mt-[3px] font-semibold text-gray-200">
                          {project.createdBy.name}
                        </Text>
                      </View>
                    </View>
                  </View>

                </View>
              </Link>

              {/*<View className="pl-[20px] mt-[15px]">
                <View className="flex-row items-center mb-1">
                  <FontAwesome5 name="users" size={12} color="#1e90ff" />
                  <Text className="ml-2 text-[12px] font-semibold text-gray-500">Team:</Text>
                  <Text className="ml-2 text-[12px] font-[700] text-gray-200">
                    {project.teamCount}{" "}
                    <Text className="text-[11px]">
                      {project.teamCount === 1 ? "member" : "members"}
                    </Text>
                  </Text>
                </View>

                <View className="flex-row items-center mb-1">
                  <FontAwesome5 name="tasks" size={12} color="#1e90ff" />
                  <Text className="ml-2 text-[12px] font-semibold text-gray-500">Tasks:</Text> 
                  <Text className="ml-2 text-[12px] font-[700] text-gray-200">
                    {project.taskCount}{" "}
                    <Text className="text-[11px]">
                    {project.taskCount === 1 ? "task" : "tasks"}
                    </Text>
                  </Text>
                </View>

                <View className="flex-row items-center">
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
                </View>
              </View>*/}
            </View>
          ))}
        </View>
      )}

      {/* Tasks Timeline */}
      {/*selectedProjectId && (
    <View>
      <View className="h-1 bg-gray-300 rounded-xl my-9" />
      <TasksTimeline projectId={selectedProjectId} />
    </View>
  )*/}
    </ScrollView>

  )
};
export default JoinedProjects