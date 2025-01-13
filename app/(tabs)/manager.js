import { useState, useEffect } from 'react';
import axios from 'axios';
import { View, Text, Image, TouchableOpacity, ScrollView } from 'react-native';
import { FontAwesome, FontAwesome5 } from '@expo/vector-icons';

import AsyncStorage from '@react-native-async-storage/async-storage';
import config from '@/Config/Config';


const colors = [
    'bg-red-400', 'bg-blue-400', 'bg-green-700', 'bg-yellow-600', 'bg-indigo-400', 'bg-orange-400', 'bg-cyan-400', 'bg-violet-400'
];
const getRandomColor = () => colors[Math.floor(Math.random() * colors.length)];

const Manager = () => {
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
        <ScrollView style={{ flex: 1, backgroundColor: 'white', padding: 20 }}>
            {/* Header */}
            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 10 }}>
                <FontAwesome5 name="users" size={24} color="gray" />
                <Text style={{ fontSize: 24, fontWeight: 'bold', color: 'gray', marginLeft: 10 }}>Joined Projects</Text>
            </View>
            <Text style={{ fontSize: 13, fontWeight: '500', color: 'gray', marginBottom: 15 }}>
                View all of the projects associated with your account
            </Text>

            {/* Error Message */}
            {error && !projects.length ? (
                <View style={{ padding: 15, backgroundColor: '#ffe5e5', borderColor: '#ffcccc', borderWidth: 1, borderRadius: 10 }}>
                    <Text style={{ color: 'red' }}>{error} No projects found.</Text>
                </View>
            ) : (
                <View style={{ flexWrap: 'wrap', flexDirection: 'row', justifyContent: 'space-between' }}>
                    {projects.map((project) => (
                        <View
                            key={project._id}
                            style={{
                                width: '100%',
                                maxWidth: 380,
                                height: 190,
                                backgroundColor: 'white',
                                borderWidth: 2,
                                borderColor: '#e5e4e4',
                                borderRadius: 15,
                                shadowColor: '#000',
                                shadowOpacity: 0.1,
                                shadowRadius: 5,
                                marginBottom: 15,
                                overflow: 'hidden',
                            }}
                        >
                            {/* Project Image */}
                            <View style={{ height: 75, backgroundColor: '#f7d774', position: 'relative' }}>
                                <Image
                                    source={{ uri: `/Themes/${project.theme}.jpg` }}
                                    style={{ height: 100, width: '100%', transform: [{ scaleX: -1 }], resizeMode: 'cover' }}
                                />
                                <TouchableOpacity
                                    onPress={() => console.log(`Navigate to /tasks/${project._id}`)}
                                    style={{
                                        position: 'absolute',
                                        top: 0,
                                        left: 0,
                                        right: 0,
                                        bottom: 0,
                                        backgroundColor: 'rgba(0, 0, 0, 0.3)',
                                        justifyContent: 'center',
                                        alignItems: 'flex-end',
                                        paddingRight: 50,
                                    }}
                                >
                                    <Text style={{ fontSize: 15, fontWeight: '600', color: 'white' }}>{project.name}</Text>
                                </TouchableOpacity>
                            </View>

                            {/* Avatar and Details */}
                            <TouchableOpacity onPress={() => console.log(`Navigate to /tasks/${project._id}`)} style={{ flexDirection: 'row' }}>
                                <View style={{ marginLeft: 40, marginTop: -45 }}>
                                    <Image
                                        source={{ uri: `/Assets/${project.createdBy.avatar}.jpg` }}
                                        style={{
                                            height: 85,
                                            width: 85,
                                            borderRadius: 50,
                                            borderWidth: 3,
                                            borderColor: 'white',
                                        }}
                                    />
                                </View>

                                <View style={{ marginLeft: 'auto', marginRight: 50, marginTop: -12 }}>
                                    {/* Admin */}
                                    <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 5 }}>
                                        <FontAwesome5 name="user-shield" size={16} color="#1e90ff" />
                                        <Text style={{ marginLeft: 5, fontSize: 12, fontWeight: '600', color: 'gray' }}>Admin:</Text>
                                        <Text style={{ marginLeft: 5, fontSize: 14, fontWeight: '600', color: '#1e90ff' }}>
                                            {project.createdBy.name}
                                        </Text>
                                    </View>

                                    {/* Team */}
                                    <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 5 }}>
                                        <FontAwesome5 name="users" size={16} color="#1e90ff" />
                                        <Text style={{ marginLeft: 5, fontSize: 13, fontWeight: '600', color: 'gray' }}>Team:</Text>
                                        <Text style={{ marginLeft: 5, fontSize: 14, fontWeight: '600', color: '#1e90ff' }}>
                                            {project.teamCount}{' '}
                                            <Text style={{ fontSize: 12 }}>{project.teamCount === 1 ? 'member' : 'members'}</Text>
                                        </Text>
                                    </View>

                                    {/* Tasks */}
                                    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                                        <FontAwesome5 name="tasks" size={16} color="#1e90ff" />
                                        <Text style={{ marginLeft: 5, fontSize: 13, fontWeight: '600', color: 'gray' }}>Tasks:</Text>
                                        <Text style={{ marginLeft: 5, fontSize: 14, fontWeight: '600', color: '#1e90ff' }}>
                                            {project.taskCount}{' '}
                                            <Text style={{ fontSize: 12 }}>{project.taskCount === 1 ? 'task' : 'tasks'}</Text>
                                        </Text>
                                    </View>
                                </View>
                            </TouchableOpacity>
                        </View>
                    ))}
                </View>
            )}
        </ScrollView>
    )
};
export default Manager