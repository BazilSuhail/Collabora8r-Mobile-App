import React, { useState, useEffect } from 'react';
import axios from 'axios'; 
//import TasksTimeline from '../TasksTimeline';  
import { View, Text, TouchableOpacity, Image, ScrollView } from 'react-native';
import { FontAwesome, FontAwesome5 } from '@expo/vector-icons';


import AsyncStorage from '@react-native-async-storage/async-storage';
import config from '@/Config/Config';
import { Link } from 'expo-router';


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
    <ScrollView style={{ flex: 1, backgroundColor: 'white', padding: 20 }}>
    {/* Header */}
    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
      <View style={{ flexDirection: 'row', alignItems: 'center' }}>
        <FontAwesome5 name="users" size={24} color="gray" />
        <Text style={{ fontSize: 24, fontWeight: 'bold', color: 'gray', marginLeft: 10 }}>Joined Projects</Text>
      </View>
    </View>

    <Text style={{ marginTop: 5, fontSize: 13, fontWeight: '500', color: 'gray', marginBottom: 15 }}>
      View all of the projects associated with your account
    </Text>

    <View style={{ height: 3, backgroundColor: '#d3d3d3', marginBottom: 15 }} />

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
              height: 275,
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
            <Link href={`/joinedProjects/${project._id}`} replace={true} style={{ height: 140, backgroundColor: '#f7d774', position: 'relative' }}>
              <Image
              source={{ uri: `assets/Themes/${project.theme}.jpg` }}
                style={{ height: 140, width: '100%', resizeMode: 'cover' }}
              />
              <View
                style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  right: 0,
                  bottom: 0,
                  backgroundColor: 'rgba(0, 0, 0, 0.3)',
                  justifyContent: 'space-between',
                  flexDirection: 'row',
                  padding: 15,
                  alignItems: 'center',
                }}
              >
                <View>
                  <Text style={{ fontSize: 15, fontWeight: '600', color: 'white' }}>{project.name}</Text>
                  <Text style={{ fontSize: 13, fontWeight: '600', color: 'white' }}>{project.createdBy.name}</Text>
                </View>
                {/*<TouchableOpacity onPress={() => handleProjectClick(project._id)}>
                  <FontAwesome5 name="eye" size={25} color="white" />
                </TouchableOpacity>*/}
              </View>
            </Link>

            {/* Avatar and Details */}
            <View style={{ alignItems: 'center', marginTop: -45 }}>
              <Image
                source={{ uri: `@/assets/Assets/${project.createdBy.avatar}.jpg` }}
                style={{
                  height: 95,
                  width: 95,
                  borderRadius: 50,
                  borderWidth: 3,
                  borderColor: 'white',
                }}
              />
            </View>

            <View style={{ paddingHorizontal: 25, marginTop: 15 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 5 }}>
                <FontAwesome5 name="users" size={16} color="#1e90ff" />
                <Text style={{ marginLeft: 5, fontSize: 13, fontWeight: '600', color: 'gray' }}>Team:</Text>
                <Text style={{ marginLeft: 5, fontSize: 14, fontWeight: '600', color: '#1e90ff' }}>
                  {project.teamCount} <Text style={{ fontSize: 12 }}>{project.teamCount === 1 ? 'member' : 'members'}</Text>
                </Text>
              </View>

              <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 5 }}>
                <FontAwesome5 name="tasks" size={16} color="#1e90ff" />
                <Text style={{ marginLeft: 5, fontSize: 13, fontWeight: '600', color: 'gray' }}>Tasks:</Text>
                <Text style={{ marginLeft: 5, fontSize: 14, fontWeight: '600', color: '#1e90ff' }}>
                  {project.taskCount} <Text style={{ fontSize: 12 }}>{project.taskCount === 1 ? 'task' : 'tasks'}</Text>
                </Text>
              </View>

              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <FontAwesome5 name="user-edit" size={16} color="#1e90ff" />
                <Text style={{ marginLeft: 5, fontSize: 13, fontWeight: '600', color: 'gray' }}>
                  {project.projectManager.status === 'Pending' ? 'Requested ' : ''}Manager:
                </Text>
                {project.projectManager.status === 'Pending' ? (
                  <Text
                    style={{
                      marginLeft: 5,
                      paddingHorizontal: 15,
                      backgroundColor: '#e0f7ff',
                      borderRadius: 10,
                      fontSize: 11,
                      fontWeight: '700',
                      color: '#007acc',
                    }}
                  >
                    No manager assigned
                  </Text>
                ) : (
                  <Text style={{ marginLeft: 5, fontSize: 11, fontWeight: '700', color: '#ffa500', textDecorationLine: 'underline' }}>
                    {project.projectManager.email}
                  </Text>
                )}
              </View>
            </View>
          </View>
        ))}
      </View>
    )}

    {/* Tasks Timeline */}
    {/*selectedProjectId && (
      <View>
        <View style={{ height: 4, backgroundColor: '#d3d3d3', borderRadius: 10, marginVertical: 35 }} />
        <TasksTimeline projectId={selectedProjectId} />
      </View>
    )*/}
  </ScrollView>
  )
};
export default JoinedProjects