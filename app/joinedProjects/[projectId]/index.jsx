import ProjectTasks from '@/components/joinedProjects/ProjectTasks'
import TeamMembers from '@/components/joinedProjects/TeamMember'
import config from '@/config/config'
import decodeJWT from '@/config/decodeJWT'
import themeImages from '@/constants/themes'
import { Ionicons, MaterialIcons } from '@expo/vector-icons'
import AsyncStorage from '@react-native-async-storage/async-storage'
import axios from 'axios'
import { usePathname } from 'expo-router'
import { useEffect, useState } from 'react'
import { Image, ScrollView, StatusBar, Text, TouchableOpacity, View } from 'react-native'

const JoinedProjectDetails = () => {
  const pathname = usePathname()
  const projectId = pathname.split("/").pop()

  const [loggedUser, setloggedUser] = useState(null)
  const [project, setProject] = useState(null)
  const [teamDetails, setTeamDetails] = useState([])
  const [myTasks, setMyTasks] = useState([])
  const [otherTasks, setOtherTasks] = useState([])
  const [error, setError] = useState({})
  const [view, setView] = useState('all')
  const [isModalOpen, setIsModalOpen] = useState(false)

  const openModal = () => setIsModalOpen(true)
  const closeModal = () => setIsModalOpen(false)

  useEffect(() => {
    const fetchProjectDetails = async () => {
      try {
        const token = await AsyncStorage.getItem('token')
        const DecodeUserId = decodeJWT(token)
        setloggedUser(DecodeUserId)

        const response = await axios.get(`${config.VITE_REACT_APP_API_BASE_URL}/joinedprojects/${projectId}`, {
          headers: { Authorization: `Bearer ${token}` },
        })

        setProject(response.data.project)
        setTeamDetails(response.data.project.team)
      } catch (err) {
        setError((prev) => ({ ...prev, project: 'Failed to fetch project details.' }))
      }
    }

    fetchProjectDetails()
  }, [projectId])

  useEffect(() => {
    const fetchProjectTasks = async () => {
      if (!project || !loggedUser) return

      try {
        const response = await axios.get(`${config.VITE_REACT_APP_API_BASE_URL}/project-tasks/${projectId}/tasks`)

        const tasks = response.data.tasks

        const assignedToMe = tasks.filter(task => task.task.assignedTo === loggedUser)
        const assignedToOthers = tasks.filter(task => task.task.assignedTo !== loggedUser)

        setMyTasks(assignedToMe)
        setOtherTasks(assignedToOthers)
      } catch (err) {
        console.error(err)
        setError((prev) => ({ ...prev, tasks: 'Failed to fetch project tasks.' }))
      }
    }

    fetchProjectTasks()
  }, [project, loggedUser])

  return (
    <View className="flex-1 bg-slate-50">
      <StatusBar barStyle="light-content" backgroundColor="#1F2937" />
      
      {project ? (
        <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
          {error.project && (
            <View className="flex-row items-center bg-red-50 p-3 mx-4 mt-4 rounded-xl border border-red-200">
              <MaterialIcons name="error-outline" size={20} color="#EF4444" />
              <Text className="text-red-500 text-sm font-medium ml-2">{error.project}</Text>
            </View>
          )}

          {/* Modern Project Header */}
          <View className="bg-white shadow-lg shadow-black/10 rounded-b-3xl overflow-hidden">
            <View className="relative h-48">
              <Image 
                source={themeImages[project.theme]} 
                className="w-full h-full"
                resizeMode="cover"
              />
              <View className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
              
              {/* Project Info Overlay */}
              <View className="absolute bottom-0 left-0 right-0 p-6">
                <Text className="text-white text-2xl font-bold mb-2">{project.name}</Text>
                <Text className="text-white/90 text-base leading-6">{project.description}</Text>
              </View>
            </View>
            
            {/* Project Stats */}
            <View className="p-5 pb-6">
              <View className="flex-row space-x-6">
                <View className="flex-row items-center">
                  <View className="w-8 h-8 bg-purple-100 rounded-full items-center justify-center mr-3">
                    <Ionicons name="people" size={16} color="#8B5CF6" />
                  </View>
                  <Text className="text-gray-600 text-sm font-medium">{teamDetails.length} members</Text>
                </View>
                <View className="flex-row items-center">
                  <View className="w-8 h-8 bg-green-100 rounded-full items-center justify-center mr-3">
                    <Ionicons name="checkmark-circle" size={16} color="#10B981" />
                  </View>
                  <Text className="text-gray-600 text-sm font-medium">{myTasks.length + otherTasks.length} tasks</Text>
                </View>
              </View>
            </View>
          </View>

          {/* Navigation Tabs */}
          <View className="mx-4 mt-6 p-1 bg-gray-100 rounded-xl">
            <View className="flex-row">
              <TouchableOpacity
                onPress={() => setView('all')}
                className={`flex-1 flex-row items-center justify-center py-3 px-4 rounded-lg ${
                  view === 'all' 
                    ? 'bg-indigo-500 shadow-md shadow-indigo-500/25' 
                    : 'bg-transparent'
                }`}
              >
                <Ionicons 
                  name="person" 
                  size={18} 
                  color={view === 'all' ? '#FFFFFF' : '#6B7280'} 
                />
                <Text className={`ml-2 text-sm font-semibold ${
                  view === 'all' ? 'text-white' : 'text-gray-600'
                }`}>
                  My Tasks
                </Text>
                {myTasks.length > 0 && (
                  <View className="ml-2 bg-white px-2 py-1 rounded-full min-w-[20px] items-center">
                    <Text className="text-indigo-600 text-xs font-semibold">{myTasks.length}</Text>
                  </View>
                )}
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => setView('my')}
                className={`flex-1 flex-row items-center justify-center py-3 px-4 rounded-lg ${
                  view === 'my' 
                    ? 'bg-indigo-500 shadow-md shadow-indigo-500/25' 
                    : 'bg-transparent'
                }`}
              >
                <Ionicons 
                  name="grid" 
                  size={18} 
                  color={view === 'my' ? '#FFFFFF' : '#6B7280'} 
                />
                <Text className={`ml-2 text-sm font-semibold ${
                  view === 'my' ? 'text-white' : 'text-gray-600'
                }`}>
                  All Tasks
                </Text>
                {otherTasks.length > 0 && (
                  <View className="ml-2 bg-white px-2 py-1 rounded-full min-w-[20px] items-center">
                    <Text className="text-indigo-600 text-xs font-semibold">{otherTasks.length}</Text>
                  </View>
                )}
              </TouchableOpacity>
            </View>
          </View>

          {/* Content Section */}
          <View className="px-4 pb-6">
            {/* Team Members Section */}
            <View className="mt-6">
              <View className="flex-row items-center mb-4">
                <View className="w-10 h-10 bg-indigo-100 rounded-full items-center justify-center mr-3">
                  <Ionicons name="people" size={20} color="#6366F1" />
                </View>
                <Text className="text-gray-900 text-lg font-semibold">Team Members</Text>
              </View>
              <View className="bg-white rounded-2xl shadow-sm shadow-black/5 p-4">
                <TeamMembers 
                  teamDetails={teamDetails} 
                  isOpen={isModalOpen} 
                  onClose={closeModal} 
                />
              </View>
            </View>

            {/* Tasks Section */}
            <View className="mt-6">
              <View className="flex-row items-center mb-4">
                <View className="w-10 h-10 bg-indigo-100 rounded-full items-center justify-center mr-3">
                  <Ionicons name="list" size={20} color="#6366F1" />
                </View>
                <Text className="text-gray-900 text-lg font-semibold">
                  {view === 'all' ? 'My Tasks' : 'All Tasks'}
                </Text>
              </View>
              <View className="bg-white rounded-2xl shadow-sm shadow-black/5 p-4">
                {view === 'my' ? (
                  <ProjectTasks creator={project.createdBy} tasks={otherTasks} />
                ) : (
                  <ProjectTasks creator={project.createdBy} tasks={myTasks} />
                )}
              </View>
            </View>
          </View>
        </ScrollView>
      ) : (
        <View className="flex-1 justify-center items-center px-10">
          <View className="w-16 h-16 bg-gray-200 rounded-full items-center justify-center mb-4">
            <MaterialIcons name="search" size={32} color="#9CA3AF" />
          </View>
          <Text className="text-gray-700 text-xl font-semibold mb-2">Project not found</Text>
          <Text className="text-gray-500 text-sm text-center leading-5">
            Please check the project ID and try again
          </Text>
        </View>
      )}
    </View>
  )
}

export default JoinedProjectDetails