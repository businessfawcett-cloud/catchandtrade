import React, { useState, useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator } from '@react-navigation/stack';
import { View, StyleSheet, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import HomeScreen from './src/screens/HomeScreen';
import ScanScreen from './src/screens/ScanScreen';
import PortfolioScreen from './src/screens/PortfolioScreen';
import CollectionScreen from './src/screens/CollectionScreen';
import CollectionDetailScreen from './src/screens/CollectionDetailScreen';
import CardDetailScreen from './src/screens/CardDetailScreen';
import ProfileScreen from './src/screens/ProfileScreen';
import WatchlistScreen from './src/screens/WatchlistScreen';
import MarketplaceScreen from './src/screens/MarketplaceScreen';
import OnboardingScreen from './src/screens/OnboardingScreen';
import PublicProfileScreen from './src/screens/PublicProfileScreen';
import { getUser } from './src/lib/api';
import * as Storage from './src/lib/storage';

const Tab = createBottomTabNavigator();
const RootStack = createStackNavigator();
const Stack = createStackNavigator();

function CollectionStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="CollectionList" component={CollectionScreen} />
      <Stack.Screen name="CollectionDetail" component={CollectionDetailScreen} />
      <Stack.Screen name="CardDetail" component={CardDetailScreen} />
    </Stack.Navigator>
  );
}

function ScanStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="ScanCamera" component={ScanScreen} />
      <Stack.Screen name="CardDetail" component={CardDetailScreen} />
    </Stack.Navigator>
  );
}

function CardDetailStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="CardList" component={MarketplaceScreen} />
      <Stack.Screen name="CardDetail" component={CardDetailScreen} />
    </Stack.Navigator>
  );
}

function PortfolioStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="PortfolioMain" component={PortfolioScreen} />
      <Stack.Screen name="CardDetail" component={CardDetailScreen} />
    </Stack.Navigator>
  );
}

function WatchlistStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="WatchlistMain" component={WatchlistScreen} />
      <Stack.Screen name="CardDetail" component={CardDetailScreen} />
    </Stack.Navigator>
  );
}

function ProfileStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="ProfileMain" component={ProfileScreen} />
      <Stack.Screen name="PublicProfile" component={PublicProfileScreen} />
      <Stack.Screen name="CardDetail" component={CardDetailScreen} />
    </Stack.Navigator>
  );
}

function TabIcon({ name, focused }: { name: string; focused: boolean }) {
  const icons: Record<string, keyof typeof Ionicons.glyphMap> = {
    Home: 'home',
    Scan: 'camera',
    Marketplace: 'search',
    Portfolio: 'folder',
    Watchlist: 'star',
    Collection: 'albums',
    Profile: 'person',
  };

  return (
    <View style={[styles.iconContainer, focused && styles.iconContainerFocused]}>
      <Ionicons
        name={icons[name] || 'ellipse'}
        size={22}
        color={focused ? '#e63946' : '#8b949e'}
      />
    </View>
  );
}

function MainTabs() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarIcon: ({ focused }) => (
          <TabIcon name={route.name.replace('Tab', '')} focused={focused} />
        ),
        tabBarActiveTintColor: '#e63946',
        tabBarInactiveTintColor: '#8b949e',
        tabBarStyle: styles.tabBar,
        tabBarLabelStyle: styles.tabLabel,
      })}
    >
      <Tab.Screen 
        name="HomeTab" 
        component={HomeScreen}
        options={{ title: 'Home' }}
      />
      <Tab.Screen
        name="ScanTab"
        component={ScanStack}
        options={{ title: 'Scan' }}
      />
      <Tab.Screen 
        name="MarketplaceTab" 
        component={CardDetailStack}
        options={{ title: 'Market' }}
      />
      <Tab.Screen
        name="PortfolioTab"
        component={PortfolioStack}
        options={{ title: 'Portfolio' }}
      />
      <Tab.Screen
        name="WatchlistTab"
        component={WatchlistStack}
        options={{ title: 'Watchlist' }}
      />
      <Tab.Screen 
        name="CollectionTab" 
        component={CollectionStack}
        options={{ title: 'Collection' }}
      />
      <Tab.Screen 
        name="ProfileTab" 
        component={ProfileStack}
        options={{ title: 'Profile' }}
      />
    </Tab.Navigator>
  );
}

export default function App() {
  const [isLoading, setIsLoading] = useState(true);
  const [needsOnboarding, setNeedsOnboarding] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    checkOnboarding();
  }, []);

  const checkOnboarding = async () => {
    try {
      const token = await Storage.getToken();
      if (!token) {
        // Not logged in — skip onboarding, go straight to main (ProfileScreen has login)
        setIsLoggedIn(false);
        setNeedsOnboarding(false);
        setIsLoading(false);
        return;
      }
      setIsLoggedIn(true);
      const user = await getUser() as { username?: string } | null;
      if (!user || !user.username) {
        setNeedsOnboarding(true);
      }
    } catch (error) {
      // Token expired or invalid
      setIsLoggedIn(false);
      setNeedsOnboarding(false);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#e63946" />
      </View>
    );
  }

  return (
    <NavigationContainer>
      <RootStack.Navigator screenOptions={{ headerShown: false }}>
        {needsOnboarding ? (
          <RootStack.Screen name="Onboarding">
            {() => <OnboardingScreen navigation={{ reset: () => setNeedsOnboarding(false) }} />}
          </RootStack.Screen>
        ) : (
          <RootStack.Screen name="Main" component={MainTabs} />
        )}
      </RootStack.Navigator>
      <StatusBar style="light" />
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#0d1117',
  },
  tabBar: {
    height: 85,
    paddingBottom: 20,
    paddingTop: 10,
    backgroundColor: '#0d1117',
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.08)',
  },
  tabLabel: {
    fontSize: 11,
    fontWeight: '600',
  },
  iconContainer: {
    width: 36,
    height: 36,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 18,
  },
  iconContainerFocused: {
    backgroundColor: 'rgba(230,57,70,0.15)',
  },
  icon: {
    fontSize: 20,
  },
  iconFocused: {
    transform: [{ scale: 1.15 }],
  },
});
