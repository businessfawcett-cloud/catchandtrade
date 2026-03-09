import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Image,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
  Dimensions,
} from 'react-native';
import { getWatchlist, removeFromWatchlist } from '../lib/api';
import * as Storage from '../lib/storage';

interface WatchlistItem {
  id: string;
  cardId: string;
  addedAt: string;
  card: {
    id: string;
    name: string;
    setName?: string;
    cardNumber?: string;
    imageUrl?: string;
  };
  currentPrice: number | null;
}

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CARD_GAP = 10;
const HORIZONTAL_PADDING = 16;
const CARD_WIDTH = (SCREEN_WIDTH - HORIZONTAL_PADDING * 2 - CARD_GAP) / 2;

export default function WatchlistScreen({ navigation }: { navigation: any }) {
  const [items, setItems] = useState<WatchlistItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);

  const checkAuth = useCallback(async () => {
    try {
      const token = await Storage.getToken();
      setIsAuthenticated(!!token);
      return !!token;
    } catch {
      setIsAuthenticated(false);
      return false;
    }
  }, []);

  const loadWatchlist = useCallback(async () => {
    try {
      const authed = await checkAuth();
      if (!authed) {
        setLoading(false);
        setRefreshing(false);
        return;
      }
      const data = await getWatchlist();
      setItems(data || []);
    } catch (error) {
      console.error('Failed to load watchlist:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [checkAuth]);

  useEffect(() => {
    loadWatchlist();
  }, [loadWatchlist]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    loadWatchlist();
  }, [loadWatchlist]);

  const handleRemove = useCallback(async (itemId: string) => {
    try {
      await removeFromWatchlist(itemId);
      setItems((prev) => prev.filter((item) => item.id !== itemId));
    } catch (error) {
      console.error('Failed to remove from watchlist:', error);
    }
  }, []);

  const renderItem = ({ item }: { item: WatchlistItem }) => (
    <TouchableOpacity style={styles.card} activeOpacity={0.8} onPress={() => item.card && navigation.navigate('CardDetail', { cardId: item.card.id, cardName: item.card.name })}>
      <TouchableOpacity
        style={styles.removeButton}
        onPress={() => handleRemove(item.id)}
        activeOpacity={0.7}
      >
        <Text style={styles.removeButtonText}>✕</Text>
      </TouchableOpacity>

      <View style={styles.cardImageContainer}>
        {item.card?.imageUrl ? (
          <Image source={{ uri: item.card.imageUrl }} style={styles.cardImage} />
        ) : (
          <View style={styles.noImage}>
            <Text style={styles.noImageText}>No Image</Text>
          </View>
        )}
      </View>

      <View style={styles.cardInfo}>
        <Text style={styles.cardName} numberOfLines={2}>
          {item.card?.name}
        </Text>
        {item.card?.setName ? (
          <Text style={styles.cardSet} numberOfLines={1}>
            {item.card.setName}
          </Text>
        ) : null}
        {item.currentPrice != null && (
          <Text style={styles.cardPrice}>
            ${item.currentPrice.toFixed(2)}
          </Text>
        )}
      </View>
    </TouchableOpacity>
  );

  // Loading state
  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#ffd700" />
        <Text style={styles.loadingText}>Loading watchlist...</Text>
      </View>
    );
  }

  // Not authenticated state
  if (isAuthenticated === false) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loginIcon}>🔒</Text>
        <Text style={styles.loginTitle}>Login Required</Text>
        <Text style={styles.loginSubtext}>
          Sign in to view and manage your watchlist.
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>My Watchlist</Text>
        <Text style={styles.subtitle}>
          {items.length} {items.length === 1 ? 'item' : 'items'}
        </Text>
      </View>

      <FlatList
        data={items}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        numColumns={2}
        columnWrapperStyle={styles.row}
        contentContainerStyle={
          items.length === 0 ? styles.emptyList : styles.listContent
        }
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor="#ffd700"
            colors={['#ffd700']}
            progressBackgroundColor="#161b22"
          />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyIcon}>📋</Text>
            <Text style={styles.emptyText}>Your watchlist is empty</Text>
            <Text style={styles.emptySubtext}>
              Browse Marketplace to find cards to track.
            </Text>
            <TouchableOpacity style={styles.browseButton} activeOpacity={0.8}>
              <Text style={styles.browseButtonText}>Browse Marketplace</Text>
            </TouchableOpacity>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0d1117',
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: '#0d1117',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: '#8b949e',
    fontSize: 14,
    marginTop: 12,
  },

  // Header
  header: {
    backgroundColor: '#161b22',
    paddingTop: 56,
    paddingBottom: 20,
    paddingHorizontal: HORIZONTAL_PADDING,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.05)',
  },
  title: {
    color: '#ffffff',
    fontSize: 26,
    fontWeight: 'bold',
  },
  subtitle: {
    color: '#8b949e',
    fontSize: 14,
    marginTop: 4,
  },

  // Grid
  listContent: {
    paddingHorizontal: HORIZONTAL_PADDING,
    paddingTop: 12,
    paddingBottom: 24,
  },
  row: {
    justifyContent: 'space-between',
    marginBottom: CARD_GAP,
  },

  // Card
  card: {
    width: CARD_WIDTH,
    backgroundColor: '#161b22',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
    overflow: 'hidden',
  },
  cardImageContainer: {
    width: '100%',
    height: CARD_WIDTH * 1.2,
    backgroundColor: '#0d1117',
  },
  cardImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  noImage: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  noImageText: {
    fontSize: 11,
    color: '#8b949e',
  },
  cardInfo: {
    padding: 10,
  },
  cardName: {
    fontSize: 13,
    fontWeight: '700',
    color: '#ffffff',
    marginBottom: 3,
  },
  cardSet: {
    fontSize: 11,
    color: '#8b949e',
    marginBottom: 6,
  },
  cardPrice: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#28a745',
  },

  // Remove button
  removeButton: {
    position: 'absolute',
    top: 6,
    right: 6,
    zIndex: 10,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#e63946',
    justifyContent: 'center',
    alignItems: 'center',
  },
  removeButtonText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: 'bold',
    lineHeight: 14,
  },

  // Empty state
  emptyList: {
    flexGrow: 1,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 80,
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: 16,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#ffffff',
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#8b949e',
    textAlign: 'center',
    paddingHorizontal: 40,
    marginBottom: 24,
  },
  browseButton: {
    backgroundColor: '#ffd700',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  browseButtonText: {
    color: '#0d1117',
    fontSize: 14,
    fontWeight: '700',
  },

  // Login required state
  loginIcon: {
    fontSize: 48,
    marginBottom: 16,
  },
  loginTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#ffffff',
    marginBottom: 8,
  },
  loginSubtext: {
    fontSize: 14,
    color: '#8b949e',
    textAlign: 'center',
    paddingHorizontal: 40,
  },
});
