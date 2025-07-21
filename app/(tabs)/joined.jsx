import { Ionicons } from '@expo/vector-icons';
import axios from 'axios';
import { useEffect, useState } from 'react';
import { Image, ScrollView, Text, View } from 'react-native';

import config from '@/config/config';
import avatarImages from '@/constants/avatar';
import themeImages from '@/constants/themes';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Link } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';

const colors = [
  'bg-red-400', 'bg-blue-400', 'bg-green-700', 'bg-yellow-600', 'bg-indigo-400', 'bg-orange-400', 'bg-cyan-400', 'bg-violet-400'
];
const getRandomColor = () => colors[Math.floor(Math.random() * colors.length)];

const JoinedProjects = () => {
  const [projects, setProjects] = useState([]);
  const [error, setError] = useState('');

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


  return (
    <View className="flex-1 bg-gray-100">
      {/* Header */}
      <View className=" border-b border-gray-100 px-3 py-4 shadow-sm">
        <View className="flex-row items-center justify-between">
          <View>
            <View className="flex-row items-center">
              <View className="w-10 h-10 bg-blue-100 rounded-full items-center justify-center">
                <Ionicons name="people" size={20} color="#3b82f6" />
              </View>
              <View className="ml-3">
                <Text className="text-[15px] font-bold text-gray-900">My Projects</Text>
                <Text className="text-[10px] text-gray-500 mt-[3px]">Projects you're part of</Text>
              </View>
            </View>
          </View>
          <View className="bg-blue-50 px-3 py-1 rounded-full">
            <Text className="text-blue-600 font-semibold text-sm">{projects.length} Active</Text>
          </View>
        </View>
      </View>

      <ScrollView
        className="flex-1 px-3 py-4"
        showsVerticalScrollIndicator={false}
      >
        {/* Error Message */}
        {error && !projects.length ? (
          <View className="p-4 bg-red-50 border border-red-200 rounded-xl">
            <View className="flex-row items-center">
              <Ionicons name="alert-circle" size={20} color="#ef4444" />
              <Text className="text-red-600 ml-2 font-medium">{error} No projects found.</Text>
            </View>
          </View>
        ) : (
          <View className="">
            {projects.map((project) => (
              <View
                key={project._id}
                className="bg-white rounded-2xl mb-2 border border-gray-100 overflow-hidden"
              >
                <Link href={`/(tabs)/joinedProjects/${project._id}`}>
                  <View className="relative h-[148px] w-full">
                    {/* Background Image */}
                    <View className="absolute inset-0 w-full">
                      <Image
                        source={themeImages[project.theme]}
                        className="h-full w-full object-cover"
                      />
                    </View> 

                    <LinearGradient
                      colors={['rgba(0,0,0,0.7)', 'rgba(0,0,0,0.3)']}
                      className="absolute w-full h-full"
                    />

                    {/* Content Overlay */}
                    <View className="absolute inset-0 p-5">
                      {/* Top Section - Project Name */}
                      <View className="flex-row items-start justify-between">
                        <View className="flex-1">
                          <Text className="text-white text-xl font-bold mb-1 mr-3" numberOfLines={1}>
                            {project.name}
                          </Text>
                          <View className="flex-row items-center">
                            <View className="w-2 h-2 bg-green-400 rounded-full mt-[1px] mr-1" />
                            <Text className="text-green-300 text-[10px] font-medium">Active Project</Text>
                          </View>
                        </View>

                        {/* Project Creator */}
                        <View className="items-center ml-3">
                          <View className="relative">
                            <Image
                              source={avatarImages[project.createdBy.avatar]}
                              className="h-12 w-12 rounded-full border-2 border-white"
                            />
                            <View className="absolute -bottom-1 -right-1 w-4 h-4 bg-blue-500 rounded-full border-2 border-white items-center justify-center">
                              <Ionicons name="star" size={8} color="white" />
                            </View>
                          </View>
                          <Text className="text-white text-xs font-medium mt-1 text-center">
                            {project.createdBy.name}
                          </Text>
                        </View>
                      </View>

                      {/* Bottom Section - Stats */}
                      <View className="flex-row items-end mt-7 justify-between">
                        <View className="flex-row">
                          {/* Team Count */}
                          <View className="flex-row items-center ">
                            <View className="bg-white/20 backdrop-blur-sm rounded-full p-[6px]">
                              <Ionicons name="people" size={13} color="white" />
                            </View>
                            <Text className="text-white text-[14px] font-bold ml-1">
                              {project.teamCount}
                            </Text>
                            <Text className="text-white/80 text-xs ml-1">
                              {project.teamCount === 1 ? "member" : "members"}
                            </Text>
                          </View>

                          {/* Task Count */}
                          <View className="flex-row items-center ml-3">
                            <View className="bg-white/20 backdrop-blur-sm mt-1 rounded-full p-[6px] mb-1">
                              <Ionicons name="checkmark-circle" size={13} color="white" />
                            </View>
                            <Text className="text-white text-[14px] font-bold ml-1">
                              {project.taskCount}
                            </Text>
                            <Text className="text-white/80 text-xs ml-1">
                              {project.taskCount === 1 ? "task" : "tasks"}
                            </Text>
                          </View>
                        </View>

                        {/* Action Indicator */}
                        <View className="bg-white/30 backdrop-blur-sm rounded-[50%] p-2">
                          <Ionicons name="arrow-forward" size={16} color="white" />
                        </View>
                      </View>
                    </View>
                  </View>
                </Link>
              </View>
            ))}

            {/* Empty State */}
            {projects.length === 0 && !error && (
              <View className="items-center justify-center py-16">
                <View className="w-20 h-20 bg-gray-100 rounded-full items-center justify-center mb-4">
                  <Ionicons name="folder-outline" size={32} color="#9ca3af" />
                </View>
                <Text className="text-gray-500 text-lg font-medium mb-2">No Projects Yet</Text>
                <Text className="text-gray-400 text-sm text-center px-8">
                  You haven't joined any projects yet. When you do, they'll appear here.
                </Text>
              </View>
            )}
          </View>
        )}
      </ScrollView>
    </View>
  );
};

export default JoinedProjects;