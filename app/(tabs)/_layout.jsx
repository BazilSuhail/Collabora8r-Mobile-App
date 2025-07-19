import { useAuthContext } from '@/hooks/AuthProvider';
import { Drawer } from 'expo-router/drawer';
import { View, Text, Image, TouchableOpacity, ScrollView } from 'react-native';
import { DrawerContentScrollView, DrawerItem } from '@react-navigation/drawer';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import avatarImages from '@/constants/avatar';

function CustomDrawerContent(props) {
  const { user } = useAuthContext();

  const projects = [
    { id: 1, name: 'Mobile App', color: '#FF6B6B' },
    { id: 2, name: 'Website Redesign', color: '#4ECDC4' },
    { id: 3, name: 'E-commerce Platform', color: '#45B7D1' },
    { id: 4, name: 'Marketing Campaign', color: '#96CEB4' },
    { id: 5, name: 'Data Analytics', color: '#FECA57' },
    { id: 6, name: 'Social Media Tool', color: '#FF9FF3' },
    { id: 7, name: 'AI Assistant', color: '#A8E6CF' },
    { id: 8, name: 'Cloud Infrastructure', color: '#FFB3E6' },
    { id: 9, name: 'Security Audit', color: '#C7CEEA' },
    { id: 10, name: 'User Research', color: '#FFD93D' },
  ];

  const handleLogout = () => {
    console.log('Logout pressed');
  };

  const handleProjectPress = (project) => {
    console.log('Project pressed:', project.name);
  };

  return (
    <DrawerContentScrollView {...props} contentContainerStyle={{ flex: 1 }}>
      <View style={{ flex: 1, paddingHorizontal: 8 }}>
        {/* Profile Section */}
        <View className="flex-row items-center justify-between mt-3 mb-5">
          <TouchableOpacity onPress={() => router.push('/profile')} className="flex-row items-center">
            <Image
              source={avatarImages[user.avatar]}
              className="w-[50px] h-[50px] rounded-full mr-4"
            />
            <View>
              <Text className="text-lg font-bold text-gray-800 mb-1">{user.name}</Text>
              <Text className="text-sm text-gray-600">{user.email}</Text>
            </View>
          </TouchableOpacity>
          <TouchableOpacity onPress={handleLogout} className="p-2 rounded-full bg-red-100">
            <Ionicons name="log-out-outline" size={24} color="#e74c3c" />
          </TouchableOpacity>
        </View>

        <View className="h-px bg-gray-300 mb-1 mt-1" />

        {/* Drawer Navigation */}
        <View className="ml-[-12px]" style={{ flexDirection: 'column', gap: -12 }}>
          <DrawerItem
            label="Home"
            onPress={() => router.push('/')}
            icon={({ color }) => <Ionicons name="home-outline" size={20} color={color} />}
            labelStyle={{ fontSize: 14, color: '#333' }}
          />
          <DrawerItem
            label="Admin"
            onPress={() => router.push('/admin')}
            icon={({ color }) => <Ionicons name="shield-outline" size={20} color={color} />}
            labelStyle={{ fontSize: 14, color: '#333' }}
          />
          <DrawerItem
            label="Joined"
            onPress={() => router.push('/joined')}
            icon={({ color }) => <Ionicons name="people-outline" size={20} color={color} />}
            labelStyle={{ fontSize: 14, color: '#333' }}
          />
          <DrawerItem
            label="Manager"
            onPress={() => router.push('/manager')}
            icon={({ color }) => <Ionicons name="briefcase-outline" size={20} color={color} />}
            labelStyle={{ fontSize: 14, color: '#333' }}
          />
          <DrawerItem
            label="Workflow"
            onPress={() => router.push('/workflow')}
            icon={({ color }) => <Ionicons name="git-branch-outline" size={20} color={color} />}
            labelStyle={{ fontSize: 14, color: '#333' }}
          />
        </View>

        <View className="h-px bg-gray-300 my-3" />

        {/* Projects Section */}
        <View style={{ flex: 1 }}>
          <Text className="text-base font-semibold text-gray-800 mb-4 ml-1">Projects</Text>
          <ScrollView
            showsVerticalScrollIndicator={false}
            nestedScrollEnabled={true}
            contentContainerStyle={{ paddingBottom: 20 }}
          >
            {projects.map((project) => (
              <TouchableOpacity
                key={project.id}
                className="flex-row items-center py-3 px-1"
                onPress={() => handleProjectPress(project)}
              >
                <View
                  className="w-10 h-10 rounded-full justify-center items-center mr-4"
                  style={{ backgroundColor: project.color }}
                >
                  <Text className="text-base font-bold text-white">
                    {project.name.charAt(0).toUpperCase()}
                  </Text>
                </View>
                <Text className="text-sm text-gray-800 flex-1">{project.name}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      </View>
    </DrawerContentScrollView>
  );
}

export default function TabsLayout() {
  const { user } = useAuthContext();

  return (
    <Drawer
      drawerContent={CustomDrawerContent}
      screenOptions={{
        headerStyle: { backgroundColor: '#f5f5f5', height: 60, },
        headerTintColor: '#333',
        drawerStyle: { backgroundColor: '#fff' },
        headerTitle: () => (
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}> 
            <Text style={{ fontSize: 18, fontWeight: 'bold', color: '#333' }}>Collabora<Text className="text-red-600">8</Text>r</Text>

            {/* Right Side: Avatar + Dots */}
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
              <Image
                source={avatarImages[user.avatar]}
                style={{ width: 28, height: 28, borderRadius: 14 }}
              />
              <Ionicons name="ellipsis-vertical" size={20} color="#333" />
            </View>
          </View>
        ),

      }}
    >
      <Drawer.Screen name="index" options={{ drawerLabel: 'Home' }} />
      <Drawer.Screen name="admin" options={{ drawerLabel: 'Admin' }} />
      <Drawer.Screen name="joined" options={{ drawerLabel: 'Joined' }} />
      <Drawer.Screen name="manager" options={{ drawerLabel: 'Manager' }} />
      <Drawer.Screen name="profile" options={{ drawerLabel: 'Profile' }} />
      <Drawer.Screen name="workflow" options={{ drawerLabel: 'Workflow' }} />
    </Drawer>
  );
}
