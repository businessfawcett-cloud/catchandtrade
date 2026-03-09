import React from 'react';
import { StatusBar } from 'expo-status-bar';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator } from '@react-navigation/stack';
import { Text, View, StyleSheet } from 'react-native';

import HomeScreen from './src/screens/HomeScreen';
import ScanScreen from './src/screens/ScanScreen';
import PortfolioScreen from './src/screens/PortfolioScreen';
import CollectionScreen from './src/screens/CollectionScreen';
import CollectionDetailScreen from './src/screens/CollectionDetailScreen';
import CardDetailScreen from './src/screens/CardDetailScreen';
import ProfileScreen from './src/screens/ProfileScreen';
import WatchlistScreen from './src/screens/WatchlistScreen';
import MarketplaceScreen from './src/screens/MarketplaceScreen';

const Tab = createBottomTabNavigator();
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

function TabIcon({ name, focused }: { name: string; focused: boolean }) {
  const icons: Record<string, string> = {
    Home: '🏠',
    Scan: '📷',
    Marketplace: '🔍',
    Portfolio: '📁',
    Watchlist: '⭐',
    Collection: '🗃️',
    Profile: '👤',
  };

  return (
    <View style={[styles.iconContainer, focused && styles.iconContainerFocused]}>
      <Text style={[styles.icon, focused && styles.iconFocused]}>
        {icons[name] || '●'}
      </Text>
    </View>
  );
}

export default function App() {
  return (
    <NavigationContainer>
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
          component={ProfileScreen}
          options={{ title: 'Profile' }}
        />
      </Tab.Navigator>
      <StatusBar style="light" />
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
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
