import React, { useState, useEffect } from 'react';
import axios from 'axios';

import { View, Text, TouchableOpacity, FlatList } from 'react-native';
import { Feather, FontAwesome, FontAwesome5, MaterialIcons, Ionicons } from '@expo/vector-icons';

import AsyncStorage from '@react-native-async-storage/async-storage';
import config from '@/config/config';

import { useRouter } from 'expo-router';
import CreateProject from '@/components/adminProjects/CreateProject';
import EditProject from '@/components/adminProjects/EditProject';

const colors = [
    'bg-red-400', 'bg-blue-400', 'bg-green-700', 'bg-yellow-600', 'bg-indigo-400', 'bg-orange-400', 'bg-cyan-400', 'bg-violet-400'
];

const getRandomColor = () => colors[Math.floor(Math.random() * colors.length)];

const Admin = () => {
    const navigate = useRouter();
    const [projects, setProjects] = useState([]);
    const [projectDetails, setProjectDetails] = useState([]);
    const [error, setError] = useState('');
    const [showModal, setShowModal] = useState(false);
    const [editModal, setshowEditModal] = useState(false);

    useEffect(() => {
        const fetchProjects = async () => {
            try {
                const token = await AsyncStorage.getItem('token');
                const response = await axios.get(`${config.VITE_REACT_APP_API_BASE_URL}/admin-projects/`, {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                });
                const updatedProjects = response.data.map((project) => ({
                    ...project,
                    color: getRandomColor(),
                }));
                setProjects(updatedProjects);
            } catch (err) {
                setError('Failed to fetch projects.');
            }
        };

        fetchProjects();
    }, []);

    const handleTaskManagement = (projectId) => {
        navigate.push(`/adminProjects/tasks/${projectId}`);
    };

    const handleProjectClick = (projectId) => {
        navigate.push(`/adminProjects/${projectId}`);
    };

    const handleManagerAssignmentClick = (project) => {
        setshowEditModal(true)
        setProjectDetails(project)
    };

    return (
        <View className="flex-1 bg-gray-50">
            {showModal && <CreateProject showModal={showModal} setShowModal={setShowModal} />}
            {editModal && (
                <EditProject
                    project={projectDetails}
                    heading="Assign a Manager"
                    editModal={editModal}
                    setShowModal={setshowEditModal}
                />
            )}

            {/* Header */}
            <View className="px-5 py-4 shadow-sm">
                <View className="flex-row items-center justify-between">
                    <View>
                        <Text className="text-2xl font-bold text-gray-900">Projects</Text>
                        <Text className="text-sm text-gray-500 mt-1">Manage your team projects</Text>
                    </View>
                    <View className="bg-blue-50 px-3 py-1 rounded-full">
                        <Text className="text-blue-600 font-semibold text-sm">{projects.length} Projects</Text>
                    </View>
                </View>
            </View>

            {/* Floating Action Button */}
            <TouchableOpacity
                onPress={() => setShowModal(true)}
                className="absolute bg-blue-600 w-14 h-14 border border-blue-500 rounded-full right-5 z-50 bottom-6 items-center justify-center shadow-lg"
                style={{ elevation: 8 }}
            >
                <Ionicons name="add" size={24} color="white" />
            </TouchableOpacity>

            {/* Error State */}
            {error && !projects.length ? (
                <View className="mx-5 mt-4 p-4 bg-red-50 border border-red-200 rounded-xl">
                    <View className="flex-row items-center">
                        <Ionicons name="alert-circle" size={20} color="#ef4444" />
                        <Text className="text-red-600 ml-2 font-medium">{error} No projects found.</Text>
                    </View>
                </View>
            ) : (
                <FlatList
                    data={projects}
                    showsVerticalScrollIndicator={false}
                    keyExtractor={(item) => item._id}
                    contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 16, paddingBottom: 100 }}
                    renderItem={({ item: project }) => (
                        <View className="bg-white rounded-2xl mb-4 shadow-sm border border-gray-100">
                            {/* Project Header */}
                            <View className="px-5 py-4 bg-gradient-to-r from-slate-800 to-slate-900 rounded-t-2xl">
                                <View className="flex-row items-center justify-between">
                                    <View className="flex-row items-center flex-1">
                                        <View className="w-10 h-10 rounded-full items-center justify-center">
                                            <Ionicons name="folder" size={21} color="black" />
                                        </View>
                                        <View className="ml-2 flex-1">
                                            <Text className="text-gray-400 font-bold text-[14px]" numberOfLines={1}>
                                                {project.name}
                                            </Text> 
                                        </View>
                                    </View>
                                    <View className="bg-green-100 px-3 ml-1 py-1 rounded-full">
                                        <Text className="text-green-700 text-xs font-bold">Active</Text>
                                    </View>
                                </View>
                            </View>

                            {/* Project Stats */}
                            <View className="px-5 py-4">
                                <View className="flex-row justify-between mb-4">
                                    <View className="flex-1 mr-2">
                                        <View className="bg-blue-50 p-3 rounded-xl">
                                            <View className="flex-row items-center">
                                                <Ionicons name="people" size={16} color="#3b82f6" />
                                                <Text className="ml-2 text-sm font-semibold text-blue-600">Team</Text>
                                            </View>
                                            <Text className="text-lg font-bold text-blue-800 mt-1">
                                                {project.team.length}
                                            </Text>
                                            <Text className="text-xs text-blue-600">
                                                {project.team.length === 1 ? "member" : "members"}
                                            </Text>
                                        </View>
                                    </View>

                                    <View className="flex-1 ml-2">
                                        <View className="bg-purple-50 p-3 rounded-xl">
                                            <View className="flex-row items-center">
                                                <Ionicons name="checkmark-circle" size={16} color="#8b5cf6" />
                                                <Text className="ml-2 text-sm font-semibold text-purple-600">Tasks</Text>
                                            </View>
                                            <Text className="text-lg font-bold text-purple-800 mt-1">
                                                {project.tasks.length}
                                            </Text>
                                            <Text className="text-xs text-purple-600">
                                                {project.tasks.length === 1 ? "task" : "tasks"}
                                            </Text>
                                        </View>
                                    </View>
                                </View>

                                {/* Manager Status */}
                                <View className="bg-gray-50 p-3 rounded-xl mb-4">
                                    <View className="flex-row items-center">
                                        <Ionicons name="person-circle" size={16} color="#6b7280" />
                                        <Text className="ml-2 text-sm font-semibold text-gray-600">Project Manager</Text>
                                    </View>
                                    <View className="mt-2">
                                        {project.projectManager.status === "Pending" ? (
                                            <View className="flex-row items-center">
                                                <View className="w-2 h-2 bg-orange-400 rounded-full mr-2"></View>
                                                <Text className="text-orange-600 font-medium text-sm">No manager assigned</Text>
                                            </View>
                                        ) : (
                                            <View className="flex-row items-center">
                                                <View className="w-2 h-2 bg-green-400 rounded-full mr-2"></View>
                                                <Text className="text-gray-800 font-medium text-sm">
                                                    {project.projectManager.email}
                                                </Text>
                                            </View>
                                        )}
                                    </View>
                                </View>

                                {/* Action Buttons */}
                                <View className="flex-row w-full">
  <TouchableOpacity
    onPress={() => handleProjectClick(project._id)}
    className="flex-1 bg-slate-50 p-3 rounded-xl border border-slate-200 mr-2"
  >
    <View className="flex-row items-center">
      <Ionicons name="settings-outline" size={16} color="#475569" />
      <Text className="ml-3 text-slate-700 text-[13px] font-semibold">Manage Project</Text>
      <View className="flex-1" />
      <Ionicons name="chevron-forward" size={14} color="#94a3b8" />
    </View>
  </TouchableOpacity>

  <TouchableOpacity
    onPress={() => handleTaskManagement(project._id)}
    className="flex-1 bg-slate-50 p-3 rounded-xl border border-slate-200 ml-2"
  >
    <View className="flex-row items-center">
      <Ionicons name="list-outline" size={16} color="#475569" />
      <Text className="ml-3 text-slate-700 text-[13px] font-semibold">Manage Tasks</Text>
      <View className="flex-1" />
      <Ionicons name="chevron-forward" size={14} color="#94a3b8" />
    </View>
  </TouchableOpacity>
</View>


                            </View>

                            {/* Manager Assignment */}
                            <View className="px-5 pb-4">
                                {project.projectManager.status === 'Pending' ? (
                                    <TouchableOpacity
                                        onPress={() => handleManagerAssignmentClick(project)}
                                        className="bg-blue-600 p-4 rounded-xl"
                                    >
                                        <View className="flex-row items-center justify-center">
                                            <Ionicons name="person-add" size={18} color="white" />
                                            <Text className="text-white ml-2 font-bold">Assign Manager</Text>
                                        </View>
                                    </TouchableOpacity>
                                ) : (
                                    <View className="bg-green-50 p-4 rounded-xl border border-green-200">
                                        <View className="flex-row items-center justify-center">
                                            <Ionicons name="checkmark-circle" size={18} color="#16a34a" />
                                            <Text className="text-green-700 ml-2 font-bold">Manager Assigned</Text>
                                        </View>
                                    </View>
                                )}
                            </View>
                        </View>
                    )}
                />
            )}
        </View>
    );
};

export default Admin;