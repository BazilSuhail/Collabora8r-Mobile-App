import React, { useState, useEffect } from 'react';
import axios from 'axios';

import { View, Text, TouchableOpacity, FlatList } from 'react-native';
import { FontAwesome, FontAwesome5 } from '@expo/vector-icons';

import AsyncStorage from '@react-native-async-storage/async-storage';
import config from '@/Config/Config';

//import CreateProject from './CreateProject'; 
//import EditProject from './EditProject';
import { useRouter } from 'expo-router';

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
                console.log(response.data)
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
        <View style={{ flex: 1, padding: 10, backgroundColor: '#f5f5f5' }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                    <FontAwesome name="folder" size={24} color="gray" />
                    <Text style={{ fontSize: 24, fontWeight: 'bold', color: 'gray', marginLeft: 5 }}>Created Projects</Text>
                </View>
            </View>
            <Text style={{ fontSize: 13, color: 'gray', marginBottom: 15 }}>List of All Projects Administered By You</Text>
            <View style={{ height: 2, backgroundColor: 'gray', borderRadius: 10, marginBottom: 10 }} />

            {error && !projects.length ? (
                <View style={{ padding: 10, backgroundColor: '#ffe5e5', borderWidth: 1, borderColor: '#ffcccc', borderRadius: 5 }}>
                    <Text style={{ color: 'red' }}>{error} No projects found.</Text>
                </View>
            ) : (
                <FlatList
                    data={projects}
                    keyExtractor={(item) => item._id}
                    ListHeaderComponent={() => (
                        <TouchableOpacity onPress={() => setShowModal(true)} style={{ marginBottom: 15, alignItems: 'center' }}>
                            <FontAwesome name="plus-circle" size={24} color="blue" />
                            <Text>Create a new Project</Text>
                        </TouchableOpacity>
                    )}
                    renderItem={({ item: project }) => (
                        <View style={{ borderWidth: 1, borderColor: 'gray', borderRadius: 10, marginBottom: 15, padding: 10 }}>
                            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                                    <FontAwesome name="user-circle" size={32} color="gray" />
                                    <Text style={{ fontSize: 16, fontWeight: 'bold', marginLeft: 5 }}>{project.name}</Text>
                                </View>
                                <Text style={{ color: 'green', fontWeight: 'bold' }}>Active</Text>
                            </View>

                            <View style={{ marginTop: 10 }}>
                                <Text>Team Members: {project.team.length}</Text>
                                <Text>Tasks: {project.tasks.length}</Text>
                                {project.projectManager.status === 'Pending' && (
                                    <Text>
                                        Manager: <Text style={{ fontWeight: 'bold' }}>{project.projectManager.email}</Text>
                                    </Text>
                                )}
                            </View>

                            <TouchableOpacity onPress={() => handleProjectClick(project._id)} style={{ marginTop: 10 }}>
                                <Text style={{ color: 'blue', fontWeight: 'bold' }}>Manage Project</Text>
                            </TouchableOpacity>

                            <TouchableOpacity onPress={() => handleTaskManagement(project._id)} style={{ marginTop: 5 }}>
                                <Text style={{ color: 'blue', fontWeight: 'bold' }}>Manage Project Tasks</Text>
                            </TouchableOpacity>

                            {project.projectManager.status === 'Pending' ? (
                                <TouchableOpacity
                                    onPress={() => handleManagerAssignmentClick(project)}
                                    style={{
                                        marginTop: 15,
                                        borderWidth: 1,
                                        borderColor: 'gray',
                                        padding: 10,
                                        alignItems: 'center',
                                        borderRadius: 5,
                                    }}
                                >
                                    <FontAwesome5 name="user-edit" size={24} color="red" />
                                    <Text style={{ color: 'red', fontWeight: 'bold', marginTop: 5 }}>Assign Manager</Text>
                                </TouchableOpacity>
                            ) : (
                                <View
                                    style={{
                                        marginTop: 15,
                                        borderWidth: 1,
                                        borderColor: 'gray',
                                        padding: 10,
                                        alignItems: 'center',
                                        borderRadius: 5,
                                    }}
                                >
                                    <FontAwesome5 name="user-check" size={24} color="gray" />
                                    <Text style={{ color: 'gray', marginTop: 5 }}>Manager: {project.projectManager.email}</Text>
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
