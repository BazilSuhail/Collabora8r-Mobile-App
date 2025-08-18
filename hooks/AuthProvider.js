import config from '@/config/config';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from "axios";
import { createContext, useContext, useEffect, useRef, useState, useCallback, useMemo, useReducer } from "react";

const AuthContext = createContext();

export const useAuthContext = () => useContext(AuthContext);

// Constants moved outside component to prevent recreation
const COLORS = [
  'bg-red-400', 'bg-blue-400', 'bg-green-700', 'bg-yellow-600', 
  'bg-indigo-400', 'bg-orange-400', 'bg-cyan-400', 'bg-violet-400'
];

const INITIAL_USER_STATE = {
  _id: '',
  name: '',
  gender: '',
  phone: '',
  email: '',
  dob: '',
  avatar: '2',
};



// Utility functions moved outside component
const getRandomColor = () => COLORS[Math.floor(Math.random() * COLORS.length)];

const validateToken = (token) => {
  try {
    const payload = JSON.parse(atob(token.split(".")[1]));
    return !(payload.exp && Date.now() >= payload.exp * 1000);
  } catch (error) {
    console.error("Invalid token:", error);
    return false;
  }
};

// Reducer for better state management
const authReducer = (state, action) => {
  switch (action.type) {
    case 'SET_LOADING':
      return { ...state, loading: action.payload };
    case 'SET_USER':
      return { ...state, user: action.payload, userLoginStatus: true };
    case 'SET_PROJECTS':
      return { ...state, projects: action.payload };
    case 'SET_NOTIFICATIONS':
      return { ...state, userNotifications: action.payload };

    case 'LOGOUT':
      return {
        ...state,
        user: INITIAL_USER_STATE,
        userLoginStatus: false,
        userNotifications: [],
        notifications: [],
        notificationsCount: 0,
      };
    case 'SET_AVATAR':
      return {
        ...state,
        user: {
          ...state.user,
          avatar: action.payload,  // update only the avatar
        },
      };
    case 'SET_NOTIFICATION_COUNT':
      return { ...state, notificationsCount: action.payload };
    default:
      return state;
  }
};

const initialState = {
  user: INITIAL_USER_STATE,
  userLoginStatus: false,
  loading: true,
  projects: [],
  userNotifications: [],
  notifications: [],
  notificationsCount: 0,

};

export const AuthProvider = ({ children }) => {
  const [state, dispatch] = useReducer(authReducer, initialState); 
  const isInitialized = useRef(false);
  
  // Memoized API base URL
  const apiBaseUrl = useMemo(() => config.VITE_REACT_APP_API_BASE_URL, []);

  // Memoized axios instance with interceptors
  const axiosInstance = useMemo(() => {
    const instance = axios.create({
      baseURL: apiBaseUrl,
    });

    // Add request interceptor to automatically add token
    instance.interceptors.request.use(async (config) => {
      const token = await AsyncStorage.getItem("token");
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      return config;
    });

    // Add response interceptor for error handling
    instance.interceptors.response.use(
      (response) => response,
      (error) => {
        if (error.response?.status === 401) {
          handleLogout();
        }
        return Promise.reject(error);
      }
    );

    return instance;
  }, [apiBaseUrl]);

  // Memoized functions to prevent unnecessary re-renders
  const fetchUserData = useCallback(async (token) => {
    try {
      const response = await axiosInstance.get('/profile');
      dispatch({ type: 'SET_USER', payload: response.data });
    } catch (error) {
      console.error("Error fetching user data:", error);
      handleLogout();
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  }, [axiosInstance]);

  const fetchUserNotifications = useCallback(async () => {
    try {
      const response = await axiosInstance.get('/profile/get-notifications');
      dispatch({ type: 'SET_NOTIFICATIONS', payload: response.data });
      dispatch({ type: 'SET_NOTIFICATION_COUNT', payload: response.data.length });
    } catch (error) {
      console.error("Error fetching notifications:", error);
    }
  }, [axiosInstance]);

  const fetchJoinedProjects = useCallback(async () => {
    try {
      const response = await axiosInstance.get('/joinedprojects');
      const updatedProjects = response.data.map((project) => ({
        ...project,
        color: getRandomColor(),
      }));
      dispatch({ type: 'SET_PROJECTS', payload: updatedProjects });
    } catch (error) {
      console.error('Failed to fetch projects:', error);
    }
  }, [axiosInstance]);

  const handleLogout = useCallback(async () => {
    try {
      await AsyncStorage.removeItem("token");

      dispatch({ type: 'LOGOUT' });
    } catch (error) {
      console.error("Error during logout:", error);
    }
  }, []);

  const login = useCallback(async (token) => {
    try {
      await AsyncStorage.setItem("token", token);
      await fetchUserData(token);
      await fetchUserNotifications();
      await fetchJoinedProjects();
    } catch (error) {
      console.error("Error during login:", error);
      handleLogout();
    }
  }, [fetchUserData, fetchUserNotifications, fetchJoinedProjects, handleLogout]);

  const reFetchProfile = useCallback(async () => {
    const token = await AsyncStorage.getItem("token");
    if (token && validateToken(token)) {
      await fetchUserData(token);
    } else {
      handleLogout();
    }
  }, [fetchUserData, handleLogout]);

const updateAvatar = useCallback(async (newAvatar) => {
  try {
    dispatch({ type: 'SET_AVATAR', payload: newAvatar });
  } catch (error) {
    console.error("Error updating avatar:", error);
  }
}, [axiosInstance]);

  const logout = useCallback(() => {
    handleLogout();
  }, [handleLogout]);

  // Single initialization effect
  useEffect(() => {
    if (isInitialized.current) return;
    
    const initialize = async () => {
      try {
        dispatch({ type: 'SET_LOADING', payload: true });
        const token = await AsyncStorage.getItem("token");
        
        if (token && validateToken(token)) {
          // Parallel fetch for better performance
          await Promise.allSettled([
            fetchUserData(token),
            fetchUserNotifications(),
            fetchJoinedProjects(),
          ]);
        } else {
          if (token) {
            await AsyncStorage.removeItem("token");
          }
          dispatch({ type: 'SET_LOADING', payload: false });
        }
      } catch (error) {
        console.error("Error during initialization:", error);
        dispatch({ type: 'SET_LOADING', payload: false });
      } finally {
        isInitialized.current = true;
      }
    };

    initialize();
  }, [fetchUserData, fetchUserNotifications, fetchJoinedProjects]);


  // Memoized context value to prevent unnecessary re-renders
  const contextValue = useMemo(() => ({
    user: state.user,
    userLoginStatus: state.userLoginStatus,
    loading: state.loading,
    projects: state.projects,
    notifications: state.notifications,
    notificationsCount: state.notificationsCount,
    userNotifications: state.userNotifications,
    login,
    logout,
    updateAvatar,
    reFetchProfile,
    refreshProjects: fetchJoinedProjects,
    refreshNotifications: fetchUserNotifications,
  }), [
    state,
    login,
    logout,
    reFetchProfile,
    fetchJoinedProjects,
    fetchUserNotifications,
    updateAvatar
  ]);

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
};

// import config from '@/config/config';
// import AsyncStorage from '@react-native-async-storage/async-storage';
// import axios from "axios";
// import { createContext, useContext, useEffect, useRef, useState } from "react";

// const AuthContext = createContext();

// export const useAuthContext = () => useContext(AuthContext);

// const colors = [
//   'bg-red-400', 'bg-blue-400', 'bg-green-700', 'bg-yellow-600', 'bg-indigo-400', 'bg-orange-400', 'bg-cyan-400', 'bg-violet-400'
// ];
// const getRandomColor = () => colors[Math.floor(Math.random() * colors.length)];


// export const AuthProvider = ({ children }) => {
//   const [user, setUser] = useState({
//     _id: '',
//     name: '',
//     gender: '',
//     phone: '',
//     email: '',
//     dob: '',
//     avatar: '2',
//   });

//   const [userLoginStatus, setUserLoginStatus] = useState(false);
//   const [loading, setLoading] = useState(true);
//   const [projects, setProjects] = useState([]); 


//   // notifications
//   const [userNotifications, setUserNotifications] = useState([]);
//   const [notifications, setNotifications] = useState([]);
//   const [notificationsCount, setNotificationsCount] = useState(0);

//   // toasts
//   const [toast, setToast] = useState({ message: "", visible: false });
//   const toastTimeoutRef = useRef(null);

//   useEffect(() => {
//     const initialize = async () => {
//       try {
//         const token = await AsyncStorage.getItem("token");
//         if (token) {
//           const isValid = validateToken(token);
//           if (isValid) {
//             await fetchUserData(token);
//             await fetchUserNotifications(token);
//           } else {
//             handleLogout();
//           }
//         } else {
//           setLoading(false);
//         }
//       } catch (error) {
//         //console.error("Error during initialization:", error);
//       }
//     };

//     initialize();
//   }, []);

  
//   useEffect(() => {
//     const fetchJoinedProjects = async () => {
//       try {
//         const token = await AsyncStorage.getItem('token');
//         const response = await axios.get(`${config.VITE_REACT_APP_API_BASE_URL}/joinedprojects`, {
//           headers: { Authorization: `Bearer ${token}` },
//         });

//         const updatedProjects = response.data.map((project) => ({
//           ...project,
//           color: getRandomColor(),
//         }));

//         setProjects(updatedProjects);
//       } catch (err) { 
//         setError('Failed to fetch projects.');
//       }
//     };

//     fetchJoinedProjects();
//   }, []);

//   const validateToken = (token) => {
//     try {
//       const payload = JSON.parse(atob(token.split(".")[1]));
//       return !(payload.exp && Date.now() >= payload.exp * 1000);
//     } catch (error) {
//       console.error("Invalid token:", error);
//       return false;
//     }
//   };

//   const fetchUserData = async (token) => {
//     try {
//       const response = await axios.get(`${config.VITE_REACT_APP_API_BASE_URL}/profile`, {
//         headers: { Authorization: `Bearer ${token}` },
//       });

//       setUser(response.data);
//       setUserLoginStatus(true);
//     } catch (error) {
//       console.error("Error fetching user data:", error);
//       handleLogout();
//     } finally {
//       setLoading(false);
//     }
//   };

//   const fetchUserNotifications = async (token) => {
//     try {
//       const response = await axios.get(`${config.VITE_REACT_APP_API_BASE_URL}/profile/get-notifications`, {
//         headers: { Authorization: `Bearer ${token}` },
//       });
//       setUserNotifications(response.data);
//     } catch (error) {
//       //console.error("Error fetching notifications:", error);
//     }
//   };

//   const login = async (token) => {
//     await AsyncStorage.setItem("token", token);
//     await fetchUserData(token);
//   };

//   const reFetchProfile = async () => {
//     const token = await AsyncStorage.getItem("token");
//     if (token) {
//       await fetchUserData(token);
//     }
//   };

//   const handleLogout = async () => {
//     try {
//       await AsyncStorage.removeItem("token");
//       setUserLoginStatus(false);
//       setUser({
//         _id: '',
//         name: '',
//         gender: '',
//         phone: '',
//         email: '',
//         dob: '',
//         avatar: '1',
//       });
//       setNotifications([]);
//     } catch (error) {
//       console.error("Error during logout:", error);
//     }
//   };

//   const logout = () => {
//     handleLogout();
//   };

//   const showToast = (message) => {
//     setToast({ message, visible: true });
//     if (toastTimeoutRef.current) {
//       clearTimeout(toastTimeoutRef.current);
//     }
//     toastTimeoutRef.current = setTimeout(() => {
//       setToast({ message: "", visible: false });
//     }, 6000);
//   };

//   const closeToast = () => {
//     if (toastTimeoutRef.current) {
//       clearTimeout(toastTimeoutRef.current);
//     }
//     setToast({ message: "", visible: false });
//   };

//   return (
//     <AuthContext.Provider
//       value={{
//         user,
//         userLoginStatus,
//         loading,
//         login,
//         logout,
//         notifications,
//         notificationsCount,
//         userNotifications,
//         toast,
//         reFetchProfile,
//         showToast,
//         closeToast,
//       }}
//     >
//       {children}
//     </AuthContext.Provider>
//   );
// };