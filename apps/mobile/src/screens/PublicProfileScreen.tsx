import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Image,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { getUserByUsername, PublicUser, Card } from '../lib/api';

const AVATARS: Record<string, string> = {
  '1': 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/1.png',
  '4': 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/4.png',
  '7': 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/7.png',
  '25': 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/25.png',
  '39': 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/39.png',
  '52': 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/52.png',
  '54': 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/54.png',
  '94': 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/94.png',
  '131': 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/131.png',
  '133': 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/133.png',
  '143': 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/143.png',
  '150': 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/150.png',
};

interface PublicProfileScreenProps {
  navigation: any;
  route: {
    params: {
      username: string;
    };
  };
}

export default function PublicProfileScreen({ navigation, route }: PublicProfileScreenProps) {
  const username = route?.params?.username || '';
  const [user, setUser] = useState<PublicUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadUser = async () => {
    try {
      if (!username) {
        setError('No username provided');
        setLoading(false);
        return;
      }
      setError(null);
      const userData = await getUserByUsername(username);
      if (!userData) {
        setError('User not found');
      } else if (!userData.isPublic) {
        setError('This profile is private');
      } else {
        setUser(userData);
      }
    } catch (err) {
      setError('Failed to load profile');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadUser();
  }, [username]);

  const onRefresh = () => {
    setRefreshing(true);
    loadUser();
  };

  const allCards = user?.portfolios?.flatMap(p => p.items || []) || [];
  const totalValue = allCards.reduce(
    (sum, item) => sum + (item.card?.currentPrice || 0) * item.quantity,
    0
  );

  if (loading) {
    return (
      <View style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#0066cc" />
        </View>
      </View>
    );
  }

  if (error || !user) {
    return (
      <View style={styles.container}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Text style={styles.backButtonText}>← Back</Text>
        </TouchableOpacity>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{error || 'User not found'}</Text>
        </View>
      </View>
    );
  }

  const avatarUrl = user.avatarId ? AVATARS[user.avatarId] : null;

  const renderCard = ({ item }: { item: { id: string; card: Card; quantity: number; condition: string } }) => (
    <TouchableOpacity
      style={styles.cardItem}
      onPress={() => navigation.navigate('CardDetail', { cardId: item.card.id, cardName: item.card.name })}
    >
      {item.card?.imageUrl && (
        <Image source={{ uri: item.card.imageUrl }} style={styles.cardImage} />
      )}
      <View style={styles.cardInfo}>
        <Text style={styles.cardName} numberOfLines={1}>{item.card?.name}</Text>
        <Text style={styles.cardSet}>{item.card?.setName} #{item.card?.cardNumber}</Text>
        <View style={styles.cardMeta}>
          <Text style={styles.condition}>{item.condition.replace('_', ' ')}</Text>
          <Text style={styles.quantity}>x{item.quantity}</Text>
        </View>
      </View>
      <View style={styles.cardPrice}>
        <Text style={styles.price}>${((item.card?.currentPrice || 0) * item.quantity).toFixed(2)}</Text>
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Text style={styles.backButtonText}>← Back</Text>
        </TouchableOpacity>
        
        <View style={styles.profileHeader}>
          <View style={styles.avatar}>
            {avatarUrl ? (
              <Image source={{ uri: avatarUrl }} style={styles.avatarImage} />
            ) : (
              <Text style={styles.avatarText}>
                {user.displayName?.charAt(0).toUpperCase() || '?'}
              </Text>
            )}
          </View>
          <Text style={styles.displayName}>{user.displayName}</Text>
          {user.username && (
            <Text style={styles.username}>@{user.username}</Text>
          )}
          {user.country && (
            <Text style={styles.country}>{user.country}</Text>
          )}
        </View>

        <View style={styles.statsContainer}>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{allCards.length}</Text>
            <Text style={styles.statLabel}>Cards</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>${totalValue.toFixed(2)}</Text>
            <Text style={styles.statLabel}>Value</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{user.portfolios?.length || 0}</Text>
            <Text style={styles.statLabel}>Portfolios</Text>
          </View>
        </View>

        {(user.twitterHandle || user.instagramHandle || user.tiktokHandle) && (
          <View style={styles.socialContainer}>
            {user.twitterHandle && (
              <Text style={styles.socialText}>@{user.twitterHandle}</Text>
            )}
            {user.instagramHandle && (
              <Text style={styles.socialText}>@{user.instagramHandle}</Text>
            )}
            {user.tiktokHandle && (
              <Text style={styles.socialText}>@{user.tiktokHandle}</Text>
            )}
          </View>
        )}
      </View>

      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Public Collection</Text>
      </View>

      <FlatList
        data={allCards}
        keyExtractor={(item) => item.id}
        renderItem={renderCard}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>No public cards</Text>
          </View>
        }
        contentContainerStyle={allCards.length === 0 ? styles.emptyList : undefined}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  errorText: {
    fontSize: 18,
    color: '#666',
    textAlign: 'center',
  },
  backButton: {
    padding: 16,
  },
  backButtonText: {
    color: '#0066cc',
    fontSize: 16,
    fontWeight: '600',
  },
  header: {
    backgroundColor: '#1a1a2e',
    paddingBottom: 20,
  },
  profileHeader: {
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#0066cc',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  avatarImage: {
    width: 100,
    height: 100,
    borderRadius: 50,
  },
  avatarText: {
    fontSize: 40,
    color: '#fff',
    fontWeight: 'bold',
  },
  displayName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 4,
  },
  username: {
    fontSize: 16,
    color: '#999',
    marginBottom: 4,
  },
  country: {
    fontSize: 14,
    color: '#888',
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 20,
    paddingTop: 20,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.1)',
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
  },
  statLabel: {
    fontSize: 12,
    color: '#888',
    marginTop: 4,
  },
  socialContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 16,
    marginTop: 16,
  },
  socialText: {
    color: '#0066cc',
    fontSize: 14,
  },
  sectionHeader: {
    padding: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  cardItem: {
    flexDirection: 'row',
    padding: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  cardImage: {
    width: 60,
    height: 84,
    borderRadius: 8,
    backgroundColor: '#eee',
  },
  cardInfo: {
    flex: 1,
    marginLeft: 12,
    justifyContent: 'center',
  },
  cardName: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  cardSet: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  cardMeta: {
    flexDirection: 'row',
    gap: 12,
  },
  condition: {
    fontSize: 12,
    color: '#0066cc',
    backgroundColor: '#e6f0ff',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  quantity: {
    fontSize: 12,
    color: '#666',
  },
  cardPrice: {
    justifyContent: 'center',
    alignItems: 'flex-end',
  },
  price: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#28a745',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  emptyList: {
    flex: 1,
  },
  emptyText: {
    fontSize: 16,
    color: '#999',
  },
});
