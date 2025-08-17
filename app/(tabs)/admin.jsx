import { useState, useEffect } from 'react';
import axios from 'axios';
import { View, Text, TouchableOpacity, FlatList, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import config from '@/config/config';
import { useRouter } from 'expo-router';
import CreateProject from '@/components/adminProjects/CreateProject';
import EditProject from '@/components/adminProjects/EditProject';
import avatarImages from '@/constants/avatar';
import themeImages from '@/constants/themes';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const colors = [
    'bg-red-400', 'bg-blue-400', 'bg-green-700', 'bg-yellow-600', 'bg-indigo-400', 'bg-orange-400', 'bg-cyan-400', 'bg-violet-400'
];

const getRandomColor = () => colors[Math.floor(Math.random() * colors.length)];

const Admin = () => {
    const insets = useSafeAreaInsets();
    const navigate = useRouter();
    const [projects, setProjects] = useState([]);
    const [projectDetails, setProjectDetails] = useState([]);
    const [error, setError] = useState('');
    const [showModal, setShowModal] = useState(false);
    const [editModal, setshowEditModal] = useState(false);
    const [refreshing, setRefreshing] = useState(false);

    const fetchProjects = async (isRefreshing = false) => {
        try {
            if (isRefreshing) {
                setRefreshing(true);
            }
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
            setError('');
        } catch (err) {
            setError('Failed to fetch projects.');
        } finally {
            if (isRefreshing) {
                setRefreshing(false);
            }
        }
    };

    useEffect(() => {
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
            {showModal &&
                <CreateProject
                    showModal={showModal}
                    setShowModal={setShowModal}
                />
            }
            {editModal &&
                <EditProject
                    project={projectDetails}
                    heading="Assign a Manager"
                    editModal={editModal}
                    setShowModal={setshowEditModal}
                />
            }

            {/* Header */}
            <View className="mx-6 py-4 flex-row items-center justify-between border-b-[2px] border-gray-200">
                <Text className="text-sm text-gray-600 mt-1">Manage your team projects</Text>
                <View className="bg-blue-50 px-3 py-1 rounded-full">
                    <Text className="text-blue-600 font-semibold text-sm">{projects.length} Projects</Text>
                </View>
            </View>

            {/* Floating Action Button */}
            <TouchableOpacity
                onPress={() => setShowModal(true)}
                className="absolute bg-blue-200 w-14 h-14 border border-blue-300 rounded-[12px] right-5 z-50 items-center justify-center"
                style={{ bottom: insets.bottom }} // ensures it stays above nav bar
            >
                <Ionicons name="add" size={26} color={"#2563EB"} />
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
                    refreshing={refreshing}
                    onRefresh={() => fetchProjects(true)}
                    contentContainerStyle={{ paddingHorizontal: 15, paddingTop: 16, paddingBottom: 100 }}
                    renderItem={({ item: project }) => (
                        <View className="bg-white rounded-2xl overflow-hidden mb-4 shadow-sm border-[2px] border-gray-100">

                            <View className="relative h-44 w-full rounded-t-2xl overflow-hidden">
                                {/* Background Image */}
                                <Image
                                    source={themeImages[project.theme]}
                                    resizeMode="cover"
                                    className="absolute inset-0 w-full h-full"
                                />

                                <LinearGradient
                                    colors={['rgba(0,0,0,0.7)', 'rgba(0,0,0,0.3)']}
                                    className="absolute w-full h-full"
                                />

                                {/* Content Overlay */}
                                <View className="absolute inset-0 p-4 flex">
                                    {/* Top Row - Project Title + Status */}
                                    <View className="flex-row items-center justify-between">
                                        <View className="flex-row items-center flex-1">
                                            <View className="w-9 h-9 bg-white/20 rounded-[50px] items-center justify-center">
                                                <Ionicons name="folder" size={16} color="white" />
                                            </View>
                                            <Text
                                                className="ml-2 text-white font-semibold text-base"
                                                numberOfLines={1}
                                            >
                                                {project.name}
                                            </Text>
                                        </View>

                                        <View className="bg-green-200 px-3 py-[2px] rounded-full">
                                            <Text className="text-green-800 text-xs font-semibold">Active</Text>
                                        </View>
                                    </View>

                                    {/* Bottom - Manager Info Box */}
                                    <View className="bg-white/10 px-4 py-3 rounded-[12px] mt-8">
                                        <View className="flex-row items-center mb-1">
                                            <Ionicons name="person-circle" size={16} color="#f9fafb" />
                                            <Text className="ml-2 text-sm font-semibold text-white/90">Project Manager</Text>
                                        </View>

                                        {project.projectManager.status === "Pending" ? (
                                            <View className="flex-row items-center mt-1">
                                                <View className="w-2 h-2 bg-orange-400 rounded-full mr-2" />
                                                <Text className="text-orange-300 font-medium text-sm">No manager assigned</Text>
                                            </View>
                                        ) : (
                                            <View className="flex-row items-center mt-1">
                                                <View className="w-2 h-2 bg-green-400 rounded-full mr-2" />
                                                <Text className="text-white font-medium text-sm">
                                                    {project.projectManager.email}
                                                </Text>
                                            </View>
                                        )}
                                    </View>
                                </View>
                            </View>


                            {/* Project Stats */}
                            <View className="px-5 pt-5">
                                <View className="flex-row flex-wrap justify-between ">
                                    {/* Team Info */}
                                    <View className="bg-blue-50 p-3 w-[48%] flex-row items-center rounded-xl mb-4">
                                        <View className="flex-row items-center">
                                            <Ionicons name="people" size={16} color="#3b82f6" />
                                            <Text className="ml-1 text-sm font-semibold text-blue-600">Team: </Text>
                                        </View>
                                        <Text className="text-lg font-bold text-blue-800 ml-1">
                                            {project.team.length}
                                        </Text>
                                        <Text className="text-xs ml-1 text-blue-600">
                                            {project.team.length === 1 ? "member" : "members"}
                                        </Text>
                                    </View>

                                    {/* Tasks Info */}
                                    <View className="bg-purple-50 p-3 w-[48%] flex-row items-center rounded-xl mb-4">
                                        <View className="flex-row items-center">
                                            <Ionicons name="checkmark-circle" size={16} color="#8b5cf6" />
                                            <Text className="ml-2 text-sm font-semibold text-purple-600">Tasks: </Text>
                                        </View>
                                        <Text className="text-lg font-bold text-purple-800 ml-2">
                                            {project.tasks.length}
                                        </Text>
                                        <Text className="text-xs text-purple-600 ml-1">
                                            {project.tasks.length === 1 ? "task" : "tasks"}
                                        </Text>
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
                                            <Text className="ml-3 text-slate-700 text-[12px] font-semibold">Manage Project</Text>
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
                                            <Text className="ml-3 text-slate-700 text-[12px] font-semibold">Manage Tasks</Text>
                                            <View className="flex-1" />
                                            <Ionicons name="chevron-forward" size={14} color="#94a3b8" />
                                        </View>
                                    </TouchableOpacity>
                                </View>


                            </View>

                            {/* Manager Assignment */}
                            <View className="px-5 py-4">
                                {project.projectManager.status === 'Pending' ? (
                                    <TouchableOpacity
                                        onPress={() => handleManagerAssignmentClick(project)}
                                        className="bg-blue-600 p-4 rounded-xl"
                                    >
                                        <View className="flex-row items-center justify-center">
                                            <Ionicons name="person-add" size={18} color="white" />
                                            <Text className="text-white ml-2  font-bold">Assign Manager</Text>
                                        </View>
                                    </TouchableOpacity>
                                ) : (
                                    <View className="bg-green-50 p-4 rounded-xl border border-green-200">
                                        <View className="flex-row items-center justify-center">
                                            <Ionicons name="checkmark-circle" size={18} color="#16a34a" />
                                            <Text className="text-green-700 ml-2 text-[13px] font-bold">Manager Assigned</Text>
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