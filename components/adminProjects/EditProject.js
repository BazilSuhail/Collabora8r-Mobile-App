import React, { useState, useEffect } from 'react';
import axios from 'axios';

import { View, Text, TouchableOpacity, TextInput, ScrollView, Image, FlatList, Modal } from 'react-native';
import { FontAwesome, FontAwesome5 } from '@expo/vector-icons';

import AsyncStorage from '@react-native-async-storage/async-storage';
import config from '@/Config/Config';


const EditProject = ({ setShowModal, project, showModal, heading = "Edit Project" }) => {
    const [name, setName] = useState('');
    const [description, setDescription] = useState('');
    const [projectManagerEmail, setProjectManagerEmail] = useState('');
    const [theme, setTheme] = useState(null);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [showThemeModal, setShowThemeModal] = useState(false);

    useEffect(() => {
        if (project) {
            setName(project.name || '');
            setDescription(project.description || '');
            setProjectManagerEmail(project.projectManager.email || '');
            setTheme(project.theme || null);
        }
    }, [project]);

    const handleEditProject = async (e) => {
        e.preventDefault();
        const token = await AsyncStorage.getItem('token');

        try {
            await axios.put(
                `${config.VITE_REACT_APP_API_BASE_URL}/projects/${project._id}/update`,
                { name, description, projectManagerEmail, theme },
                {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                }
            );
            setSuccess('Project updated successfully!');
            setShowModal(false);
        } catch (err) {
            setError('Failed to update project.');
        }
    };

    return (
        <Modal transparent={true} visible={showModal} animationType="none">
            <View
                style={{
                    flex: 1,
                    backgroundColor: 'rgba(0, 0, 0, 0.5)',
                    justifyContent: 'center',
                    alignItems: 'center',
                }}
            >
                <View
                    style={{
                        backgroundColor: 'white',
                        borderRadius: 10,
                        padding: 20,
                        width: '90%',
                        maxWidth: 400,
                    }}
                >
                    <TouchableOpacity
                        onPress={() => setShowModal(false)}
                        style={{ alignSelf: 'flex-end', marginBottom: 10 }}
                    >
                        <Text style={{ fontSize: 22, color: 'gray' }}>&times;</Text>
                    </TouchableOpacity>

                    <Text
                        style={{
                            fontSize: 18,
                            fontWeight: '600',
                            textAlign: 'center',
                            marginBottom: 10,
                        }}
                    >
                        Update Project
                    </Text>
                    <View
                        style={{
                            height: 2,
                            backgroundColor: '#D1D5DB',
                            marginVertical: 10,
                        }}
                    />

                    {error ? (
                        <Text style={{ color: 'red', marginBottom: 10 }}>{error}</Text>
                    ) : null}
                    {success ? (
                        <Text style={{ color: 'green', marginBottom: 10 }}>{success}</Text>
                    ) : null}

                    <View>
                        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                            <FontAwesome5 name="subscript" size={16} color="#4B5563" />
                            <Text
                                style={{
                                    marginLeft: 5,
                                    fontSize: 14,
                                    fontWeight: '600',
                                    color: '#4B5563',
                                }}
                            >
                                Project Name
                            </Text>
                        </View>
                        <TextInput
                            value={name}
                            onChangeText={setName}
                            style={{
                                borderWidth: 1,
                                borderColor: '#D1D5DB',
                                borderRadius: 5,
                                marginTop: 5,
                                padding: 8,
                                fontSize: 14,
                            }}
                            placeholder="Enter project name"
                        />
                    </View>

                    <View
                        style={{
                            flexDirection: 'row',
                            justifyContent: 'space-between',
                            marginTop: 15,
                        }}
                    >
                        <View style={{ width: '48%' }}>
                            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                                <FontAwesome5 name="palette" size={16} color="#4B5563" />
                                <Text
                                    style={{
                                        marginLeft: 5,
                                        fontSize: 14,
                                        fontWeight: '600',
                                        color: '#4B5563',
                                    }}
                                >
                                    Select Theme
                                </Text>
                            </View>
                            <TouchableOpacity
                                onPress={() => setShowThemeModal(true)}
                                style={{
                                    borderWidth: 1,
                                    borderColor: '#D1D5DB',
                                    borderRadius: 5,
                                    marginTop: 5,
                                    padding: 8,
                                    alignItems: 'center',
                                }}
                            >
                                <Text style={{ fontSize: 14 }}>
                                    {theme !== null ? `Theme ${theme + 1}` : 'Select Theme'}
                                </Text>
                            </TouchableOpacity>
                        </View>

                        <View style={{ width: '48%' }}>
                            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                                <FontAwesome name="envelope" size={16} color="#4B5563" />
                                <Text
                                    style={{
                                        marginLeft: 5,
                                        fontSize: 14,
                                        fontWeight: '600',
                                        color: '#4B5563',
                                    }}
                                >
                                    Manager Email
                                </Text>
                            </View>
                            <TextInput
                                value={projectManagerEmail}
                                onChangeText={setProjectManagerEmail}
                                style={{
                                    borderWidth: 1,
                                    borderColor: '#D1D5DB',
                                    borderRadius: 5,
                                    marginTop: 5,
                                    padding: 8,
                                    fontSize: 14,
                                }}
                                placeholder="Enter manager's email"
                                keyboardType="email-address"
                            />
                        </View>
                    </View>

                    <View style={{ marginTop: 15 }}>
                        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                            <FontAwesome5 name="file-alt" size={16} color="#4B5563" />
                            <Text
                                style={{
                                    marginLeft: 5,
                                    fontSize: 14,
                                    fontWeight: '600',
                                    color: '#4B5563',
                                }}
                            >
                                Project Description
                            </Text>
                        </View>
                        <TextInput
                            value={description}
                            onChangeText={setDescription}
                            style={{
                                borderWidth: 1,
                                borderColor: '#D1D5DB',
                                borderRadius: 5,
                                marginTop: 5,
                                padding: 8,
                                fontSize: 14,
                                textAlignVertical: 'top',
                                height: 80,
                            }}
                            multiline
                            numberOfLines={4}
                            placeholder="Enter project description"
                        />
                    </View>

                    <TouchableOpacity
                        onPress={handleEditProject}
                        style={{
                            backgroundColor: '#275ca2',
                            marginTop: 15,
                            padding: 10,
                            borderRadius: 5,
                            flexDirection: 'row',
                            justifyContent: 'center',
                            alignItems: 'center',
                        }}
                    >
                        <FontAwesome5 name="check-circle" size={18} color="#FFFFFF" />
                        <Text
                            style={{
                                color: 'white',
                                fontSize: 14,
                                marginLeft: 10,
                            }}
                        >
                            Updae Project Details
                        </Text>
                    </TouchableOpacity>
                </View>

                {showThemeModal && (
                    <Modal transparent={true} visible={showThemeModal} animationType="none">
                        <View
                            style={{
                                flex: 1,
                                backgroundColor: 'rgba(0, 0, 0, 0.75)',
                                justifyContent: 'center',
                                alignItems: 'center',
                            }}
                        >
                            <TouchableOpacity
                                onPress={() => setShowThemeModal(false)}
                                style={{
                                    marginBottom: 20,
                                    backgroundColor: 'red',
                                    padding: 10,
                                    borderRadius: 5,
                                }}
                            >
                                <Text style={{ color: 'white' }}>Close</Text>
                            </TouchableOpacity>
                            <ScrollView
                                contentContainerStyle={{
                                    flexDirection: 'row',
                                    flexWrap: 'wrap',
                                    justifyContent: 'center',
                                }}
                            >
                                {Array.from({ length: 6 }).map((_, index) => (
                                    <TouchableOpacity
                                        key={index}
                                        onPress={() => {
                                            setTheme(index);
                                            setShowThemeModal(false);
                                        }}
                                        style={{
                                            width: 100,
                                            height: 100,
                                            margin: 10,
                                            borderRadius: 5,
                                            overflow: 'hidden',
                                        }}
                                    >
                                        <Image
                                            source={{ uri: `/Themes/${index + 1}.jpg` }}
                                            style={{ width: '100%', height: '100%' }}
                                        />
                                    </TouchableOpacity>
                                ))}
                            </ScrollView>
                        </View>
                    </Modal>
                )}
            </View>
        </Modal>
    );
};

export default EditProject;
