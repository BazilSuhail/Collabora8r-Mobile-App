// Manager.jsx - updated version
import { FontAwesome5, Ionicons } from '@expo/vector-icons';
import axios from 'axios';
import { useEffect, useState } from 'react';
import { Image, ScrollView, Text, View } from 'react-native';

import EmptyState from '@/components/EmptyState';
import ManagerSkeletonLoader from '@/components/skeletonLoaders/manager';
import config from '@/config/config';
import avatarImages from '@/constants/avatar';
import themeImages from '@/constants/themes';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { LinearGradient } from 'expo-linear-gradient';
import { Link } from 'expo-router';

const colors = [
  'bg-red-400', 'bg-blue-400', 'bg-green-700', 'bg-yellow-600', 'bg-indigo-400', 'bg-orange-400', 'bg-cyan-400', 'bg-violet-400'
];
const getRandomColor = () => colors[Math.floor(Math.random() * colors.length)];

const Manager = () => {
  const [projects, setProjects] = useState([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true); // Add loading state

  useEffect(() => {
    const fetchAsManagerProjects = async () => {
      try {
        setLoading(true); // Set loading to true
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
      } finally {
        setLoading(false); // Set loading to false when done
      }
    };

    fetchAsManagerProjects();
  }, []);

  // Show skeleton loader while loading
  if (loading) {
    return <ManagerSkeletonLoader />;
  }

  // Render conditional components
  return (
    <ScrollView className="flex-1 bg-white px-4 py-5">
      {/* Error Message */}
      {error && !projects.length ? (
        <View className="h-screen bg-gray-50 flex-1 items-center">
          <EmptyState
            title="No Managed Project Found"
            desc="Consult or help someone to manage a project to get started"
            imageSource={require('@/assets/placeholders/noManaged.png')}
            imageWidth={280}
            imageHeight={200}
          />
        </View>
      ) : (
        <>
          {/* Header */}
          <View className="mx-1 pb-4 mb-4 flex-row items-center justify-between border-b-[2px] border-gray-200">
            <Text className="text-sm text-gray-600 mt-1">Manage your team projects</Text>
            <View className="bg-blue-50 px-3 py-1 rounded-full">
              <Text className="text-blue-600 font-semibold text-sm">{projects.length} Projects</Text>
            </View>
          </View>
          <View className="flex-wrap flex-row justify-between">
            {projects.map((project) => (
              <Link
                key={project._id}
                href={`/adminProjects/tasks/${project._id}`}
                className="w-full bg-white border-2 border-gray-200 rounded-2xl overflow-hidden mb-4"
              >
                <View className="relative w-full h-[150px]">

                  <View className="absolute inset-0 w-full">
                    <Image source={themeImages[project.theme]} className="h-full w-full object-cover rounded-t-2xl" />
                  </View>

                  <View className="absolute w-full h-full rounded-t-2xl overflow-hidden">
                    <LinearGradient
                      colors={['rgba(0,0,0,0.7)', 'rgba(0,0,0,0.3)']}
                      className="w-full h-full"
                    />
                  </View>

                  <View className="absolute h-[150px] pt-5 inset-0 w-full px-[18px] z-10">
                    <View className="flex-row items-start justify-between">
                      <View className="flex-1">
                        <Text className="text-white text-lg font-bold mb-1 mr-3" numberOfLines={1}>
                          {project.name}
                        </Text>
                        <View className="flex-row mt-1 items-center">
                          <View className="w-2 h-2 bg-green-400 rounded-full mr-2" />
                          <Text className="text-green-300 text-[10px] font-medium">Active Project</Text>
                        </View>
                      </View>

                      {/* Project Creator */}
                      <View className="items-center ml-3">
                        <View className="relative">
                          <Image
                            source={avatarImages[project.createdBy.avatar]}
                            className="h-10 w-10 rounded-full border-2 border-white"
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

                    <View className="flex-row mt-5 items-center ml-[-1] mb-1">
                      <FontAwesome5 name="users" size={12} color="#1e90ff" />
                      <Text className="ml-[6px] text-[12px] font-semibold text-blue-300">Team:</Text>
                      <Text className="ml-2 text-[12px] font-[700] text-[#9bccfe]">
                        {project.teamCount}{" "}
                        <Text className="text-[11px]">
                          {project.teamCount === 1 ? "member" : "members"}
                        </Text>
                      </Text>
                    </View>
                    <View className="flex-row items-center mb-1">
                      <FontAwesome5 name="tasks" size={12} color="#1e90ff" />
                      <Text className="ml-2 text-[12px] font-semibold text-blue-300">Tasks:</Text>
                      <Text className="ml-2 text-[12px] font-[700] text-[#9bccfe]">
                        {project.taskCount}{" "}
                        <Text className="text-[11px]">
                          {project.taskCount === 1 ? "task" : "tasks"}
                        </Text>
                      </Text>
                    </View>
                  </View>

                </View>
                {/* Project Details Card */}
                <View className="flex-row p-4 w-full items-center justify-between">
                  <View className="flex-row items-center">
                    <View className="w-8 h-8 bg-blue-100 rounded-full items-center justify-center">
                      <Ionicons name="folder-open" size={14} color="#3b82f6" />
                    </View>
                    <View className="ml-3">
                      <Text className="text-gray-900 font-semibold text-sm">Project Details</Text>
                      <Text className="text-gray-500 text-xs">View tasks and progress</Text>
                    </View>
                  </View>

                  <View className="flex-row items-center">
                    <View className="bg-blue-50 px-2 py-1 rounded-full">
                      <Text className="text-blue-600 text-xs font-medium">In Progress</Text>
                    </View>
                    <Ionicons name="chevron-forward" size={16} color="#9ca3af" />
                  </View>
                </View>
              </Link>
            ))}
          </View>
        </>
      )}
    </ScrollView>
  )
};

export default Manager;