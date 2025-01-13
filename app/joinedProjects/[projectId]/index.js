import { useState, useEffect } from 'react'
import axios from 'axios'
import { View, Text, Image, TouchableOpacity, ScrollView, StyleSheet } from 'react-native';
import { FontAwesome5 } from '@expo/vector-icons';
//import TeamMembers from './TeamMembersModal'
//import ProjectTasks from './ProjectTasks'

import AsyncStorage from '@react-native-async-storage/async-storage';
import config from '@/Config/Config';
import decodeJWT from '@/Config/DecodeJWT';
import { usePathname } from 'expo-router';
import ProjectTasks from '@/components/joinedProjects/ProjectTasks';

const JoinedProjectDetails = () => {

  const pathname = usePathname();
  const projectId = pathname.split("/").pop();
  //const { projectId } = useParams();

  const [loggedUser, setloggedUser] = useState(null);
  const [project, setProject] = useState(null);
  const [teamDetails, setTeamDetails] = useState([]);
  const [myTasks, setMyTasks] = useState([]);
  const [otherTasks, setOtherTasks] = useState([]);
  const [error, setError] = useState({});
  const [view, setView] = useState('all');
  const [isModalOpen, setIsModalOpen] = useState(false);

  const openModal = () => setIsModalOpen(true);
  const closeModal = () => setIsModalOpen(false);

  useEffect(() => {
    const fetchProjectDetails = async () => {
      try {
        const token = await AsyncStorage.getItem('token');
        const DecodeUserId = decodeJWT(token);
        setloggedUser(DecodeUserId);
        const response = await axios.get(`${config.VITE_REACT_APP_API_BASE_URL}/joinedprojects/${projectId}`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (response.data.project) {
          setProject(response.data.project)
          setTeamDetails(response.data.project.team)
          console.log(teamDetails.length)
          console.log(teamDetails)
        }
        else {
          setError((prev) => ({ ...prev, project: 'Project not found.' }));
        }
      }
      catch (err) {
        console.error(err);
        setError((prev) => ({ ...prev, project: 'Failed to fetch project details.' }));
      }
    };

    const fetchProjectTasks = async () => {
      try {
        const response = await axios.get(`${config.VITE_REACT_APP_API_BASE_URL}/project-tasks/${projectId}/tasks`);

        const tasks = response.data.tasks;
        const assignedToMe = tasks.filter(task => task.task.assignedTo === loggedUser);
        const assignedToOthers = tasks.filter(task => task.task.assignedTo !== loggedUser);
        // tasks.forEach(task => { console.log(task);});

        setMyTasks(assignedToMe);
        setOtherTasks(assignedToOthers);
      }
      catch (err) {
        console.error(err);
        setError((prev) => ({ ...prev, tasks: 'Failed to fetch project tasks.' }));
      }
    };

    fetchProjectDetails();
    fetchProjectTasks();
  }, [projectId, loggedUser]);

  const styles = StyleSheet.create({
    mainContainer: { flex: 1, backgroundColor: 'white', padding: 20 },
    sectionContainer: { flexWrap: 'wrap' },
    projectImageContainer: {
      height: 220,
      borderRadius: 15,
      overflow: 'hidden',
      backgroundColor: '#f7d774',
      position: 'relative',
      marginBottom: 20,
    },
    projectImage: { width: '100%', height: '100%', resizeMode: 'cover' },
    overlay: {
      ...StyleSheet.absoluteFillObject,
      backgroundColor: 'rgba(0, 0, 0, 0.3)',
      paddingHorizontal: 15,
      zIndex: 10,
    },
    overlayText: { color: '#fff', fontWeight: '700' },
    button: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: 5,
      paddingHorizontal: 15,
      borderRadius: 8,
      backgroundColor: '#1E3A8A',
      marginBottom: 15,
    },
    buttonText: { color: '#fff', fontWeight: '600', fontSize: 13 },
    teamContainer: { flexDirection: 'row', flexWrap: 'wrap', marginBottom: 15 },
    memberCard: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: '#fff',
      padding: 10,
      borderWidth: 1,
      borderColor: '#ddd',
      borderRadius: 8,
      marginBottom: 10,
    },
    memberAvatar: { width: 40, height: 40, borderRadius: 20, marginRight: 10, borderWidth: 2, borderColor: '#ddd' },
    memberInfo: { flexDirection: 'column' },
    memberName: { fontWeight: 'bold' },
    memberEmail: { color: '#888', fontSize: 12 },
    errorMessage: { color: 'red', fontSize: 14, marginBottom: 15 },
    noMembersText: { color: '#3B82F6', textDecorationLine: 'underline', textAlign: 'center' },
  });


  return (
    <ScrollView style={styles.mainContainer}>
      {project ? (
        <View>
          {error.project && <Text style={styles.errorMessage}>{error.project}</Text>}

          {/* Project Header */}
          <View style={styles.projectImageContainer}>
            <Image source={{ uri: `/Themes/${project.theme}.jpg` }} style={styles.projectImage} />
            <View style={styles.overlay}>
              <TouchableOpacity onPress={() => console.log(`Navigate to /joinedprojects/${project._id}`)}>
                <Text style={[styles.overlayText, { fontSize: 24, marginTop: 30 }]}>{project.name}</Text>
                <Text style={[styles.overlayText, { fontSize: 14, marginTop: 10 }]}>{project.description}</Text>
              </TouchableOpacity>
              
            </View>
          </View>

          {/* Team Members Button */}
          <TouchableOpacity onPress={openModal} style={styles.button}>
            <FontAwesome5 name="users" size={17} color="#fff" style={{ marginRight: 8 }} />
            <Text style={styles.buttonText}>Team Members</Text>
          </TouchableOpacity>

          {/* Section: Team and Tasks */}
          <View style={styles.sectionContainer}>
            {/* Team Members */}
            <View style={{ flex: 2, marginBottom: 15 }}>
              <View style={{ flexDirection: 'row', marginBottom: 15 }}>
                <TouchableOpacity
                  onPress={() => setView('my')}
                  style={[
                    styles.button,
                    {
                      backgroundColor: view === 'my' ? '#3B82F6' : '#E5E7EB',
                      paddingVertical: 5,
                      marginRight: 10,
                    },
                  ]}
                >
                  <FontAwesome5 name="border-all" size={16} color={view === 'my' ? '#fff' : '#1F2937'} style={{ marginRight: 5 }} />
                  <Text style={{ color: view === 'my' ? '#fff' : '#1F2937' }}>All Tasks</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => setView('all')}
                  style={[
                    styles.button,
                    {
                      backgroundColor: view === 'all' ? '#3B82F6' : '#E5E7EB',
                      paddingVertical: 5,
                    },
                  ]}
                >
                  <FontAwesome5 name="tasks" size={16} color={view === 'all' ? '#fff' : '#1F2937'} style={{ marginRight: 5 }} />
                  <Text style={{ color: view === 'all' ? '#fff' : '#1F2937' }}>My Tasks</Text>
                </TouchableOpacity>
              </View>

              {/* Team Members List 
              <TeamMembers teamDetails={teamDetails} isOpen={isModalOpen} onClose={closeModal} />
              */}
              <Text style={[styles.buttonText, { color: '#1E40AF', fontSize: 17 }]}>
                <FontAwesome5 name="users" size={20} color="#1E40AF" style={{ marginRight: 8 }} />
                Team Members
              </Text>
              
              {teamDetails.length > 0 ? (
                teamDetails
                  .filter((member) => member._id !== loggedUser)
                  .map((member) => (
                    <View key={member._id} style={styles.memberCard}>
                      <Image
                        source={{ uri: `/Assets/${member.avatar}.jpg` }}
                        style={styles.memberAvatar}
                      />
                      <View style={styles.memberInfo}>
                        <Text style={styles.memberName}>{member.name}</Text>
                        <Text style={styles.memberEmail}>{member.email}</Text>
                      </View>
                    </View>
                  ))
              ) : (
                <Text style={styles.noMembersText}>No team members found.</Text>
              )}
            </View>

            {/* Tasks Section */}
            <View style={{ flex: 5, marginLeft: 15 }}>
              {view === 'my' ? (
                <ProjectTasks creator={project.createdBy} tasks={otherTasks} />
              ) : (
                <ProjectTasks creator={project.createdBy} tasks={myTasks} />
              )}
            </View>
            
            
          </View>
        </View>
      ) : (
        <Text>Project not found.</Text>
      )}
    </ScrollView>
  );
};

export default JoinedProjectDetails;
