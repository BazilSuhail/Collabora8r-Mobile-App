import { useRouter } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import {
  Animated,
  Dimensions,
  Text,
  TouchableOpacity,
  View,
  ScrollView,
  Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';

const { width, height } = Dimensions.get('window');

const OnboardingSlide = ({ title, description, index, currentIndex }) => {
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (index === currentIndex) {
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
      }).start();
    } else {
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }).start();
    }
  }, [currentIndex, index]);

  return (
    <Animated.View
      style={{
        opacity: fadeAnim,
        width: width,
        height: height * 0.6,
        paddingHorizontal: 24,
        justifyContent: 'flex-end',
      }}
    >
      <View className="items-center pb-12">
        {/* Image Placeholder */}
        <View className="w-64 h-64 rounded-2xl bg-gradient-to-br from-sky-100 to-cyan-100 border-2 border-sky-300 items-center justify-center mb-12 shadow-lg">
          <Ionicons name="image-outline" size={80} color="#06B6D4" />
          <Text className="text-cyan-600 text-sm font-semibold mt-3">Placeholder {index + 1}</Text>
        </View>

        {/* Title */}
        <Text className="text-3xl font-bold text-slate-800 text-center mb-4">
          {title}
        </Text>

        {/* Description */}
        <Text className="text-center text-slate-600 text-base leading-6 px-4">
          {description}
        </Text>
      </View>
    </Animated.View>
  );
};

const Onboarding = () => {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [currentIndex, setCurrentIndex] = useState(0);
  const scrollViewRef = useRef(null);
  const scrollAnim = useRef(new Animated.Value(0)).current;

  const slides = [
    {
      title: 'Collaborate Seamlessly',
      description: 'Work together with your team in real-time on projects and tasks. Share ideas and stay aligned with everyone.',
    },
    {
      title: 'Manage Projects Easily',
      description: 'Keep track of all your projects, deadlines, and team members in one centralized platform.',
    },
    {
      title: 'Boost Your Productivity',
      description: 'Stay organized, prioritize tasks, and achieve your goals with powerful collaboration tools.',
    },
  ];

  const completeOnboarding = async () => {
    try {
      await AsyncStorage.setItem('onboardingCompleted', 'true');
      router.replace('authentication/login');
    } catch (error) {
      console.error('Error saving onboarding status:', error);
      router.replace('authentication/login');
    }
  };

  const handleNext = () => {
    if (currentIndex < slides.length - 1) {
      const nextIndex = currentIndex + 1;
      setCurrentIndex(nextIndex);
      scrollViewRef.current?.scrollTo({
        x: nextIndex * width,
        animated: true,
      });
    } else {
      // Navigate to login after marking onboarding as complete
      completeOnboarding();
    }
  };

  const handlePrev = () => {
    if (currentIndex > 0) {
      const prevIndex = currentIndex - 1;
      setCurrentIndex(prevIndex);
      scrollViewRef.current?.scrollTo({
        x: prevIndex * width,
        animated: true,
      });
    }
  };

  const handleSkip = () => {
    completeOnboarding();
  };

  const handleDotPress = (index) => {
    setCurrentIndex(index);
    scrollViewRef.current?.scrollTo({
      x: index * width,
      animated: true,
    });
  };

  return (
    <View className="flex-1 bg-white" style={{ paddingTop: insets.top, paddingBottom: insets.bottom }}>
      <StatusBar barStyle="dark-content" backgroundColor="transparent" translucent />

      {/* Header with Skip Button */}
      <View className="pt-6 px-6 pb-4 flex-row justify-between items-center" style={{ paddingTop: Math.max(16, insets.top) }}>
        <Text className="text-2xl font-bold text-transparent bg-gradient-to-r from-blue-500 to-cyan-500 bg-clip-text">
          Jobsly
        </Text>
        <TouchableOpacity onPress={handleSkip} activeOpacity={0.7}>
          <Text className="text-cyan-500 font-semibold text-base">Skip</Text>
        </TouchableOpacity>
      </View>

      {/* Slides Container */}
      <ScrollView
        ref={scrollViewRef}
        horizontal
        pagingEnabled
        scrollEnabled={false}
        showsHorizontalScrollIndicator={false}
        className="flex-1"
      >
        {slides.map((slide, index) => (
          <OnboardingSlide
            key={index}
            title={slide.title}
            description={slide.description}
            index={index}
            currentIndex={currentIndex}
          />
        ))}
      </ScrollView>

      {/* Bottom Navigation Section */}
      <View className="px-6" style={{ paddingBottom: Math.max(insets.bottom, 24) }}>
        {/* Dots Indicator */}
        <View className="flex-row justify-center gap-2 mb-10">
          {slides.map((_, index) => (
            <TouchableOpacity
              key={index}
              onPress={() => handleDotPress(index)}
              activeOpacity={0.7}
              className={`rounded-full transition-all ${
                index === currentIndex
                  ? 'bg-gradient-to-r from-blue-500 to-cyan-500 w-8 h-3'
                  : 'bg-slate-200 w-2 h-2'
              }`}
              style={{
                width: index === currentIndex ? 32 : 8,
                height: 8,
              }}
            />
          ))}
        </View>

        {/* Arrow Navigation */}
        <View className="flex-row justify-between items-center mb-6">
          {/* Previous Arrow */}
          <TouchableOpacity
            onPress={handlePrev}
            disabled={currentIndex === 0}
            activeOpacity={currentIndex === 0 ? 1 : 0.7}
            className={`w-14 h-14 rounded-full items-center justify-center border-2 ${
              currentIndex === 0
                ? 'bg-slate-100 border-slate-200'
                : 'bg-white border-cyan-300 shadow-md'
            }`}
            style={{
              shadowColor: currentIndex === 0 ? 'transparent' : '#06B6D4',
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.2,
              shadowRadius: 8,
              elevation: 5,
            }}
          >
            <Ionicons
              name="arrow-back"
              size={24}
              color={currentIndex === 0 ? '#CBD5E1' : '#0284C7'}
            />
          </TouchableOpacity>

          {/* Progress Text */}
          <View className="items-center">
            <Text className="text-slate-600 text-sm font-medium">
              <Text className="text-cyan-600 font-bold text-base">{currentIndex + 1}</Text>
              <Text className="text-slate-400"> / {slides.length}</Text>
            </Text>
          </View>

          {/* Next/Finish Arrow */}
          <TouchableOpacity
            onPress={handleNext}
            activeOpacity={0.7}
            className="w-14 h-14 rounded-full items-center justify-center border-2 bg-gradient-to-r from-blue-500 to-cyan-500 border-blue-400 shadow-lg"
            style={{
              shadowColor: '#0284C7',
              shadowOffset: { width: 0, height: 6 },
              shadowOpacity: 0.25,
              shadowRadius: 12,
              elevation: 8,
            }}
          >
            <Ionicons
              name={currentIndex === slides.length - 1 ? 'checkmark' : 'arrow-forward'}
              size={24}
              color="white"
            />
          </TouchableOpacity>
        </View>

        {/* CTA Button for Finish */}
        {currentIndex === slides.length - 1 && (
          <TouchableOpacity
            onPress={handleNext}
            activeOpacity={0.82}
            className="w-full bg-gradient-to-r from-blue-500 to-cyan-500 rounded-xl pt-4 pb-4 items-center justify-center shadow-lg"
            style={{
              shadowColor: '#0284C7',
              shadowOffset: { width: 0, height: 8 },
              shadowOpacity: 0.3,
              shadowRadius: 12,
              elevation: 10,
            }}
          >
            <Text className="text-white font-bold text-base">Get Started</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
};

export default Onboarding;
