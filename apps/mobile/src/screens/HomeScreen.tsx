import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  Image,
  RefreshControl,
} from 'react-native';
import { getUser, logout, getDefaultPortfolio, PortfolioItem } from '../lib/api';

interface HomeScreenProps {
  navigation: any;
}

export default function HomeScreen({ navigation }: HomeScreenProps) {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [portfolio, setPortfolio] = useState<any>(null);

  const loadData = async () => {
    try {
      const userData = await getUser();
      setUser(userData);
      
      if (userData) {
        const portfolioData = await getDefaultPortfolio();
        setPortfolio(portfolioData);
      }
    } catch (error) {
      console.error('Failed to load data:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    loadData();
  };

  const handleLogout = async () => {
    await logout();
    setUser(null);
    setPortfolio(null);
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <Text>Loading...</Text>
      </View>
    );
  }

  if (!user) {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>Welcome to Catch and Trade</Text>
        <Text style={styles.subtitle}>Track your Pokemon card collection</Text>
        
        <TouchableOpacity
          style={styles.loginButton}
          onPress={() => navigation.navigate('Login')}
        >
          <Text style={styles.loginButtonText}>Login</Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={styles.registerButton}
          onPress={() => navigation.navigate('Register')}
        >
          <Text style={styles.registerButtonText}>Register</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const stats = {
    cards: portfolio?.items?.length || 0,
    sets: new Set(portfolio?.items?.map((i: any) => i.card?.setCode)).size || 0,
    value: portfolio?.items?.reduce((sum: number, i: any) => sum + (i.card?.currentPrice || 0), 0) || 0,
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.welcome}>Welcome back, {user.displayName}!</Text>
      </View>

      <View style={styles.statsRow}>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>{stats.cards}</Text>
          <Text style={styles.statLabel}>Cards</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>{stats.sets}</Text>
          <Text style={styles.statLabel}>Sets</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>${stats.value.toFixed(0)}</Text>
          <Text style={styles.statLabel}>Value</Text>
        </View>
      </View>

      <TouchableOpacity
        style={styles.scanButton}
        onPress={() => navigation.navigate('ScanTab')}
      >
        <Text style={styles.scanButtonText}>Scan a Card</Text>
      </TouchableOpacity>

      <Text style={styles.sectionTitle}>Recent Cards</Text>
      
      <FlatList
        data={portfolio?.items?.slice(0, 5) || []}
        keyExtractor={(item) => item.id}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        renderItem={({ item }: { item: PortfolioItem }) => (
          <View style={styles.recentItem}>
            {item.card?.imageUrl && (
              <Image source={{ uri: item.card.imageUrl }} style={styles.recentImage} />
            )}
            <View style={styles.recentInfo}>
              <Text style={styles.recentName}>{item.card?.name}</Text>
              <Text style={styles.recentSet}>
                {item.card?.setName} #{item.card?.cardNumber}
              </Text>
            </View>
          </View>
        )}
        ListEmptyComponent={
          <Text style={styles.emptyText}>No cards in your portfolio yet</Text>
        }
      />

      <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
        <Text style={styles.logoutButtonText}>Logout</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    padding: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    textAlign: 'center',
    marginTop: 60,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 40,
  },
  loginButton: {
    backgroundColor: '#0066cc',
    paddingVertical: 16,
    borderRadius: 12,
    marginBottom: 16,
  },
  loginButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  registerButton: {
    borderWidth: 2,
    borderColor: '#0066cc',
    paddingVertical: 16,
    borderRadius: 12,
  },
  registerButtonText: {
    color: '#0066cc',
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  header: {
    marginTop: 20,
    marginBottom: 24,
  },
  welcome: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    padding: 16,
    borderRadius: 12,
    marginHorizontal: 4,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#0066cc',
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
  },
  scanButton: {
    backgroundColor: '#ff4444',
    paddingVertical: 20,
    borderRadius: 16,
    alignItems: 'center',
    marginBottom: 24,
  },
  scanButtonText: {
    color: '#fff',
    fontSize: 20,
    fontWeight: 'bold',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  recentItem: {
    flexDirection: 'row',
    padding: 12,
    backgroundColor: '#f9f9f9',
    borderRadius: 12,
    marginBottom: 8,
  },
  recentImage: {
    width: 50,
    height: 70,
    borderRadius: 8,
  },
  recentInfo: {
    flex: 1,
    marginLeft: 12,
    justifyContent: 'center',
  },
  recentName: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  recentSet: {
    fontSize: 14,
    color: '#666',
  },
  emptyText: {
    textAlign: 'center',
    color: '#999',
    padding: 20,
  },
  logoutButton: {
    marginTop: 20,
    paddingVertical: 16,
  },
  logoutButtonText: {
    color: '#ff4444',
    fontSize: 16,
    textAlign: 'center',
  },
});
