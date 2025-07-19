import TeamMembers from '@/components/joinedProjects/TeamMember'
import config from '@/config/config'
import decodeJWT from '@/config/decodeJWT'
import themeImages from '@/constants/themes'
import { FontAwesome5, Ionicons, MaterialIcons } from '@expo/vector-icons'
import AsyncStorage from '@react-native-async-storage/async-storage'
import axios from 'axios'
import { usePathname, useRouter } from 'expo-router'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { Image, ScrollView, StatusBar, Text, TouchableOpacity, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

const JoinedProjectDetails = () => {
  const pathname = usePathname()
  const projectId = pathname.split("/").pop()
  const router = useRouter()
  const insets = useSafeAreaInsets() // Get safe area insets

  const [loggedUser, setLoggedUser] = useState(null)
  const [project, setProject] = useState(null)
  const [teamDetails, setTeamDetails] = useState([])
  const [allTasks, setAllTasks] = useState([])
  const [error, setError] = useState({})
  const [showMyTasks, setShowMyTasks] = useState(true)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [loading, setLoading] = useState(true)

  // Memoized task filtering
  const { myTasks, otherTasks } = useMemo(() => {
    if (!allTasks.length || !loggedUser) {
      return { myTasks: [], otherTasks: [] }
    }

    const assignedToMe = allTasks.filter(task => task.task.assignedTo === loggedUser)
    const assignedToOthers = allTasks.filter(task => task.task.assignedTo !== loggedUser)

    return { myTasks: assignedToMe, otherTasks: assignedToOthers }
  }, [allTasks, loggedUser])

  const openModal = useCallback(() => setIsModalOpen(true), [])
  const closeModal = useCallback(() => setIsModalOpen(false), [])

  const fetchProjectDetails = useCallback(async () => {
    try {
      const token = await AsyncStorage.getItem('token')
      if (!token) {
        setError(prev => ({ ...prev, auth: 'Authentication required' }))
        return
      }

      const decodedUserId = decodeJWT(token)
      setLoggedUser(decodedUserId)

      const response = await axios.get(
        `${config.VITE_REACT_APP_API_BASE_URL}/joinedprojects/${projectId}`,
        { headers: { Authorization: `Bearer ${token}` } }
      )

      setProject(response.data.project)
      setTeamDetails(response.data.project.team || [])
    } catch (err) {
      console.error('Project fetch error:', err)
      setError(prev => ({ ...prev, project: 'Failed to fetch project details.' }))
    }
  }, [projectId])

  const fetchProjectTasks = useCallback(async () => {
    if (!project) return

    try {
      const response = await axios.get(
        `${config.VITE_REACT_APP_API_BASE_URL}/project-tasks/${projectId}/tasks`
      )
      setAllTasks(response.data.tasks || [])
    } catch (err) {
      console.error('Tasks fetch error:', err)
      setError(prev => ({ ...prev, tasks: 'Failed to fetch project tasks.' }))
    } finally {
      setLoading(false)
    }
  }, [project, projectId])

  useEffect(() => {
    fetchProjectDetails()
  }, [fetchProjectDetails])

  useEffect(() => {
    fetchProjectTasks()
  }, [fetchProjectTasks])

  const handleTaskClick = useCallback((taskId) => {
    if (!project?.createdBy) return

    const taskRoute = `${taskId}-${project.createdBy}`
    router.push(`/${taskRoute}`)
  }, [project?.createdBy, router])

  const getStatusStyle = useCallback((status) => {
    const statusMap = {
      'Not Started': 'bg-blue-100 text-blue-700 border-blue-200',
      'Completed': 'bg-green-100 text-green-700 border-green-200',
      'InProgress': 'bg-amber-100 text-amber-700 border-amber-200',
      'In Progress': 'bg-amber-100 text-amber-700 border-amber-200'
    }
    return statusMap[status] || 'bg-gray-100 text-gray-700 border-gray-200'
  }, [])

  const getPriorityStyle = useCallback((priority) => {
    const priorityMap = {
      'High': 'bg-red-100 text-red-700 border-red-200',
      'Medium': 'bg-yellow-100 text-yellow-700 border-yellow-200',
      'Low': 'bg-green-100 text-green-700 border-green-200'
    }
    return priorityMap[priority] || 'bg-gray-100 text-gray-700 border-gray-200'
  }, [])

  const formatDate = useCallback((date) => {
    if (!date) return 'No due date'
    const dateObj = new Date(date.$date || date)
    return isNaN(dateObj.getTime()) ? 'Invalid date' : dateObj.toLocaleDateString()
  }, [])

  const TaskCard = useCallback(({ task, user }) => (
    <TouchableOpacity
      onPress={() => handleTaskClick(task._id)}
      className="bg-white rounded-2xl p-5 mb-4 border border-gray-100 active:opacity-80"
      style={{
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
        elevation: 2
      }}
    >
      {/* Task Header */}
      <View className="flex-row items-start justify-between mb-4">
        <View className="flex-row items-center flex-1">
          <View className="w-12 h-12 bg-indigo-100 rounded-xl items-center justify-center mr-4">
            <FontAwesome5 name="clipboard-list" size={18} color="#6366F1" />
          </View>
          <View className="flex-1">
            <Text className="text-gray-900 font-semibold text-base mb-2 leading-5" numberOfLines={2}>
              {task.title || 'Untitled Task'}
            </Text>
            <View className="flex-row items-center space-x-2">
              <View className={`px-2 py-1 rounded-full border ${getPriorityStyle(task.priority)}`}>
                <Text className="text-xs font-medium">{task.priority || 'No Priority'}</Text>
              </View>
              <View className={`px-2 py-1 rounded-full border ${getStatusStyle(task.status)}`}>
                <Text className="text-xs font-medium">{task.status || 'No Status'}</Text>
              </View>
            </View>
          </View>
        </View>
      </View>

      {/* Task Details */}
      <View className="space-y-3">
        <View className="flex-row items-center justify-between">
          <View className="flex-row items-center flex-1">
            <View className="w-8 h-8 bg-red-50 rounded-lg items-center justify-center mr-3">
              <MaterialIcons name="schedule" size={16} color="#EF4444" />
            </View>
            <View>
              <Text className="text-gray-500 text-xs font-medium">Due Date</Text>
              <Text className="text-gray-900 text-sm font-semibold">
                {formatDate(task.dueDate)}
              </Text>
            </View>
          </View>

          <View className="flex-row items-center flex-1">
            <View className="w-8 h-8 bg-blue-50 rounded-lg items-center justify-center mr-3">
              <Ionicons name="person" size={16} color="#3B82F6" />
            </View>
            <View>
              <Text className="text-gray-500 text-xs font-medium">Assigned to</Text>
              <Text className="text-gray-900 text-sm font-semibold" numberOfLines={1}>
                {user?.name || 'Unassigned'}
              </Text>
            </View>
          </View>
        </View>

        {/* Divider */}
        <View className="h-px bg-gray-100 my-3" />

        {/* Comments */}
        <View className="flex-row items-center">
          <View className="w-8 h-8 bg-gray-50 rounded-lg items-center justify-center mr-3">
            <MaterialIcons name="comment" size={16} color="#6B7280" />
          </View>
          <Text className="text-gray-600 text-sm">
            {task.comments?.length || 0} {(task.comments?.length || 0) === 1 ? 'Comment' : 'Comments'}
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  ), [handleTaskClick, getPriorityStyle, getStatusStyle, formatDate])

  const EmptyState = useCallback(({ message }) => (
    <View className="items-center py-12">
      <View className="w-16 h-16 bg-gray-100 rounded-full items-center justify-center mb-4">
        <FontAwesome5 name="clipboard-list" size={24} color="#9CA3AF" />
      </View>
      <Text className="text-gray-500 text-base font-medium text-center">{message}kkk</Text>
    </View>
  ), [])

  const TasksList = useCallback(({ tasks, isEmpty, emptyMessage }) => {
    if (isEmpty) {
      return <EmptyState message={emptyMessage} />
    }

    return (
      <View>
        {/* Task Summary */}
        <View className="flex-row items-center justify-between mb-6 p-4 bg-gray-50 rounded-xl">
          <View className="flex-row items-center">
            <View className="w-10 h-10 bg-indigo-100 rounded-xl items-center justify-center mr-3">
              <FontAwesome5 name="tasks" size={16} color="#6366F1" />
            </View>
            <View>
              <Text className="text-gray-900 font-semibold text-base">Total Tasks</Text>
              <Text className="text-gray-500 text-sm">{tasks.length} tasks found</Text>
            </View>
          </View>
          <View className="bg-indigo-500 rounded-full w-8 h-8 items-center justify-center">
            <Text className="text-white font-bold text-sm">{tasks.length}</Text>
          </View>
        </View>

        {/* Tasks */}
        <View>
          {tasks.map((item, index) => (
            <TaskCard key={item.task._id || index} task={item.task} user={item.user} />
          ))}
        </View>
      </View>
    )
  }, [TaskCard, EmptyState])

  const currentTasks = showMyTasks ? myTasks : otherTasks
  const totalTasks = myTasks.length + otherTasks.length
 

  if (loading) {
    return (
      <View className="flex-1 bg-gray-50 justify-center items-center">
        <Text className="text-gray-500 text-base">Loading project details...</Text>
      </View>
    )
  }

  return (
    <View className="flex-1 bg-gray-100 relative p-[15px]">
      {project ? (
        <>
          <ScrollView  
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ paddingBottom: 85,paddingTop: insets.top }}
          >
            {/* Error Messages */}
            {(error.project || error.tasks || error.auth) && (
              <View className="flex-row items-center bg-red-50 p-4 mx-4 mt-4 rounded-xl border border-red-200">
                <MaterialIcons name="error-outline" size={20} color="#EF4444" />
                <Text className="text-red-500 text-sm font-medium ml-2">
                  {error.project || error.tasks || error.auth}
                </Text>
              </View>
            )}

            {/* Project Header */}
            <View className="bg-white rounded-lg overflow-hidden"
              style={{
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.1,
                shadowRadius: 12,
                elevation: 5
              }}
            >
              <View className="relative h-48">
                <Image
                  source={themeImages[project.theme]}
                  style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    width: '100%',
                    height: '100%',
                    resizeMode: 'cover',
                  }}
                />
                <View className="absolute inset-0 bg-black/40" />
                <View className="absolute bottom-0 left-0 right-0 p-6">
                  <Text className="text-white text-2xl font-bold mb-2">{project.name}</Text>
                  <Text className="text-white/90 text-base leading-6">{project.description}</Text>
                </View>
              </View>

              {/* Stats */}
              <View className="p-6">
                <View className="flex-row space-x-8">
                  <View className="flex-row items-center">
                    <View className="w-10 h-10 bg-purple-100 rounded-full items-center justify-center mr-3">
                      <Ionicons name="people" size={18} color="#8B5CF6" />
                    </View>
                    <View>
                      <Text className="text-gray-900 font-semibold text-base">{teamDetails.length}</Text>
                      <Text className="text-gray-500 text-sm">Members</Text>
                    </View>
                  </View>
                  <View className="flex-row items-center">
                    <View className="w-10 h-10 bg-green-100 rounded-full items-center justify-center mr-3">
                      <Ionicons name="checkmark-circle" size={18} color="#10B981" />
                    </View>
                    <View>
                      <Text className="text-gray-900 font-semibold text-base">{totalTasks}</Text>
                      <Text className="text-gray-500 text-sm">Tasks</Text>
                    </View>
                  </View>
                </View>
              </View>
            </View>

            {/* Content Section */}
            <View className="px-4 pb-8">
              {/* Team Members */}
              <View className="mt-6">
                <View className="flex-row items-center mb-4">
                  <View className="w-12 h-12 bg-indigo-100 rounded-xl items-center justify-center mr-4">
                    <Ionicons name="people" size={20} color="#6366F1" />
                  </View>
                  <View>
                    <Text className="text-gray-900 text-lg font-semibold">Team Members</Text>
                    <Text className="text-gray-500 text-sm">{teamDetails.length} active members</Text>
                  </View>
                </View>
                <View className="bg-white rounded-2xl border border-gray-100 p-5"
                  style={{
                    shadowColor: '#000',
                    shadowOffset: { width: 0, height: 2 },
                    shadowOpacity: 0.05,
                    shadowRadius: 8,
                    elevation: 2
                  }}
                >
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
                  <View className="w-12 h-12 bg-indigo-100 rounded-xl items-center justify-center mr-4">
                    <Ionicons name="list" size={20} color="#6366F1" />
                  </View>
                  <View>
                    <Text className="text-gray-900 text-lg font-semibold">
                      {showMyTasks ? 'My Tasks' : 'Other Tasks'}
                    </Text>
                    <Text className="text-gray-500 text-sm">
                      {showMyTasks
                        ? `${myTasks.length} tasks assigned to you`
                        : `${otherTasks.length} tasks assigned to others`
                      }
                    </Text>
                  </View>
                </View>
                <View className="bg-white rounded-2xl border border-gray-100 p-5"
                  style={{
                    shadowColor: '#000',
                    shadowOffset: { width: 0, height: 2 },
                    shadowOpacity: 0.05,
                    shadowRadius: 8,
                    elevation: 2
                  }}
                >
                  <TasksList
                    tasks={currentTasks}
                    isEmpty={currentTasks.length === 0}
                    emptyMessage={
                      showMyTasks
                        ? 'No tasks assigned to you yet'
                        : 'No tasks assigned to other team members'
                    }
                  />
                </View>
              </View>
            </View>
          </ScrollView>

          {/* Bottom Tab Bar with Safe Area */}
          <View 
            className="absolute bottom-0 left-0 right-0 bg-white border-t border-gray-100"
            style={{ paddingBottom: insets.bottom }}
          >
            <View className="mx-4">
              <View className="flex-row p-2">
                <TouchableOpacity
                  onPress={() => setShowMyTasks(true)}
                  className={`flex-1 flex-row items-center justify-center py-4 px-4 rounded-xl ${showMyTasks ? 'bg-indigo-500' : 'bg-transparent'
                    }`}
                  style={showMyTasks ? {
                    shadowColor: '#6366F1',
                    shadowOffset: { width: 0, height: 4 },
                    shadowOpacity: 0.25,
                    shadowRadius: 8,
                    elevation: 4
                  } : {}}
                >
                  <Ionicons name="person" size={18} color={showMyTasks ? '#FFFFFF' : '#6B7280'} />
                  <Text className={`ml-2 text-sm font-semibold ${showMyTasks ? 'text-white' : 'text-gray-600'
                    }`}>
                    My Tasks
                  </Text>
                  {myTasks.length > 0 && (
                    <View className={`ml-2 px-2 py-1 rounded-full min-w-[20px] items-center ${showMyTasks ? 'bg-white/20' : 'bg-indigo-100'
                      }`}>
                      <Text className={`text-xs font-semibold ${showMyTasks ? 'text-white' : 'text-indigo-600'
                        }`}>
                        {myTasks.length}
                      </Text>
                    </View>
                  )}
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={() => setShowMyTasks(false)}
                  className={`flex-1 flex-row items-center justify-center py-4 px-4 rounded-xl ${!showMyTasks ? 'bg-indigo-500' : 'bg-transparent'
                    }`}
                  style={!showMyTasks ? {
                    shadowColor: '#6366F1',
                    shadowOffset: { width: 0, height: 4 },
                    shadowOpacity: 0.25,
                    shadowRadius: 8,
                    elevation: 4
                  } : {}}
                >
                  <Ionicons name="grid" size={18} color={!showMyTasks ? '#FFFFFF' : '#6B7280'} />
                  <Text className={`ml-2 text-sm font-semibold ${!showMyTasks ? 'text-white' : 'text-gray-600'
                    }`}>
                    Other Tasks
                  </Text>
                  {otherTasks.length > 0 && (
                    <View className={`ml-2 px-2 py-1 rounded-full min-w-[20px] items-center ${!showMyTasks ? 'bg-white/20' : 'bg-indigo-100'
                      }`}>
                      <Text className={`text-xs font-semibold ${!showMyTasks ? 'text-white' : 'text-indigo-600'
                        }`}>
                        {otherTasks.length}
                      </Text>
                    </View>
                  )}
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </>
      ) : (
        <View className="flex-1 justify-center items-center px-10">
          <View className="w-20 h-20 bg-gray-100 rounded-full items-center justify-center mb-6">
            <MaterialIcons name="search" size={32} color="#9CA3AF" />
          </View>
          <Text className="text-gray-900 text-xl font-bold mb-2">Project not found</Text>
          <Text className="text-gray-500 text-base text-center leading-6">
            Please check the project ID and try again
          </Text>
        </View>
      )}
    </View>
  )
}

export default JoinedProjectDetails