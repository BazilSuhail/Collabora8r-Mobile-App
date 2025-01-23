import React, { useState, useEffect } from 'react';
import axios from 'axios';

import { View, Text, TouchableOpacity, FlatList } from 'react-native';
import { Feather, FontAwesome, FontAwesome5, MaterialIcons } from '@expo/vector-icons';

import AsyncStorage from '@react-native-async-storage/async-storage';
import config from '@/Config/Config';

//import CreateProject from './CreateProject'; 
//import EditProject from './EditProject';
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
    const [editModal, showEditModal] = useState(false);

    useEffect(() => {
        const fetchProjects = async () => {
            try {
                const token = await AsyncStorage.getItem('token');
                const response = await axios.get(`${config.VITE_REACT_APP_API_BASE_URL}/admin-projects/`, {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                });
                //console.log(response.data)
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
        showEditModal(true)
        setProjectDetails(project)
    };


    return (
        <View className="flex-1 relative px-[10px] bg-gray-100">
            {showModal && <CreateProject showModal={showModal} setShowModal={setShowModal} />}
            {editModal && (
                <EditProject
                    project={projectDetails}
                    heading="Assign a Manager"
                    editModal={editModal}
                    setShowModal={setShowEditModal}
                />
            )}

            <TouchableOpacity onPress={() => setShowModal(true)} className="absolute bg-blue-950 border w-[60px] h-[60px] border-gray-200 rounded-full right-[12px] z-[999] bottom-[12px] items-center">
                <Text className='text-blue-50 font-[400] mt-[1px] text-[38px]'>+</Text>
            </TouchableOpacity>

            {error && !projects.length ? (
                <View className="p-2.5 bg-red-100 border border-red-300 rounded-md">
                    <Text className="text-red-500">{error} No projects found.</Text>
                </View>
            ) : (
                <FlatList
                    data={projects}
                    showsVerticalScrollIndicator={false}
                    keyExtractor={(item) => item._id}
                    renderItem={({ item: project }) => (
                        <View className="bg-white overflow-hidden border  border-gray-200 rounded-[15px] mb-4">
                            <View className="flex-row px-[15px] py-[15px] bg-blue-950 items-center justify-between">
                                <View className="flex-row items-center">
                                    <FontAwesome name="user-circle" size={25} color="white" />
                                    <Text className="text-[17px] text-white  font-bold ml-[12px]">{project.name}</Text>
                                </View>

                                <Text className="text-green-300 bg-green-900 text-[10px] px-[15px] py-[2px] rounded-[20px] font-bold">Active</Text>
                            </View>


                            <View className='mt-[15px] ml-[23px] mr-[15px]'>
                                <View className="flex-row items-center ml-[-3px] mb-[3px]">
                                    <FontAwesome5 name="users" size={12} color="#1e90ff" />
                                    <Text className="ml-2 text-[12px] font-[700] text-gray-500">
                                        {project.team.length}{" "}
                                        <Text className="text-[11px]">
                                            {project.team.length === 1 ? "member" : "members"}
                                        </Text>
                                    </Text>
                                </View>

                                <View className="flex-row items-center">
                                    <FontAwesome5 name="tasks" size={12} color="#1e90ff" />
                                    <Text className="ml-2 text-[12px] font-[700] bg-[ #dde2ed] text-gray-500">
                                        {project.tasks.length}{" "}
                                        <Text className="text-[11px]">
                                            {project.tasks.length === 1 ? "task" : "tasks"}
                                        </Text>
                                    </Text>
                                </View>
                                <View className="flex-row mt-[4px] items-center">
                                    <FontAwesome5 name="user-edit" size={12} color="#1e90ff" />
                                    <Text className="ml-[4px] text-[12px] font-semibold text-gray-500">
                                        {project.projectManager.status === "Pending" ? "" : ""}
                                    </Text>
                                    {project.projectManager.status === "Pending" ? (
                                        <Text className="py-[3px] px-3 bg-[#e0f7ff] rounded-lg text-[8px] font-bold text-[#007acc]">
                                            No manager assigned
                                        </Text>
                                    ) : (
                                        <Text className="text-[11px] font-bold text-[#171716] underline">
                                            {project.projectManager.email}
                                        </Text>
                                    )}
                                </View>

                                <TouchableOpacity
                                    onPress={() => handleProjectClick(project._id)}
                                    className="flex-row mt-[4px] items-center">
                                    <Feather name="settings" size={13} color="#001C3D" />
                                    <Text className="ml-2 text-[12px] font-[700]  text-blue-700">
                                        Manage Projects
                                    </Text>
                                </TouchableOpacity>
                                <TouchableOpacity
                                    onPress={() => handleTaskManagement(project._id)}
                                    className="flex-row mt-[4px] items-center">
                                    <MaterialIcons name="workspaces-outline" size={14} color="#001C3D" />
                                    <Text className="ml-2 text-[12px] font-[700]  text-blue-700">
                                        Manage Project Tasks
                                    </Text>
                                </TouchableOpacity>
                            </View>

                            {/*<View className="mt-2.5">
                                <Text>Team Members: {project.team.length}</Text>
                                <Text>Tasks: {project.tasks.length}</Text>
                                {project.projectManager.status === 'Pending' && (
                                    <Text>
                                        Manager: <Text className="font-bold">{project.projectManager.email}</Text>
                                    </Text>
                                )}
                            </View>
                            <TouchableOpacity
                                onPress={() => handleProjectClick(project._id)}
                                className="mt-2.5"
                            >
                                <Text className="text-blue-500 font-bold">Manage Project</Text>
                            </TouchableOpacity>

                            <TouchableOpacity
                                onPress={() => handleTaskManagement(project._id)}
                                className="mt-1.5"
                            >
                                <Text className="text-blue-500 font-bold">Manage Project Tasks</Text>
                            </TouchableOpacity>*/}


                            {project.projectManager.status === 'Pending' ? (
                                <TouchableOpacity
                                    onPress={() => handleManagerAssignmentClick(project)}
                                    className="mt-4 flex-row justify-center items-center bg-blue-50 p-2.5 mx-[15px] mb-[10px] rounded-md"
                                >
                                    <FontAwesome5 name="user-edit" size={15} color="blue" />
                                    <Text className="text-blue-600 ml-[8px] font-bold ">Assign Manager</Text>
                                </TouchableOpacity>
                            ) : (
                                <View className="mt-4 flex-row justify-center items-center bg-gray-100 p-2.5 mx-[15px] mb-[10px] rounded-md">
                                    <FontAwesome5 name="user-check" size={15} color="gray" />
                                    <Text className="text-gray-500 ml-[8px] font-bold ">
                                        {project.projectManager.email}
                                    </Text>
                                </View>
                            )}
                        </View>
                    )}
                />
            )}
        </View>

    );
};

export default Admin;
