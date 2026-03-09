import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Image,
  TouchableOpacity,
  RefreshControl,
  Alert,
  ActivityIndicator,
  Dimensions,
} from 'react-native';
import { getPortfolios, getDefaultPortfolio, removeFromPortfolio } from '../lib/api';
import * as Storage from '../lib/storage';

interface Card {
  id: string;
  name: string;
  setName: string;
  setCode: string;
  cardNumber: string;
  rarity: string | null;
  imageUrl: string | null;
  currentPrice: number | null;
}

interface PortfolioItemData {
  id: string;
  quantity: number;
  condition: string;
  isGraded?: boolean;
  gradingService?: string;
  gradeValue?: number;
  card: Card;
}

interface PortfolioScreenProps {
  navigation: any;
}

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CARD_GAP = 10;
const CARD_PADDING = 16;
const CARD_WIDTH = (SCREEN_WIDTH - CARD_PADDING * 2 - CARD_GAP) / 2;
const CARD_IMAGE_HEIGHT = CARD_WIDTH * 1.4;

const CONDITION_COLORS: Record<string, string> = {
  mint: '#28a745',
  near_mint: '#28a745',
  lightly_played: '#ffd700',
  moderately_played: '#ff8c00',
  heavily_played: '#e63946',
  damaged: '#8b949e',
};

function getConditionColor(condition: string): string {
  const key = condition.toLowerCase().replace(/\s+/g, '_');
  return CONDITION_COLORS[key] || '#8b949e';
}

function formatCondition(condition: string): string {
  return condition
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

export default function PortfolioScreen({ navigation }: PortfolioScreenProps) {
  const [items, setItems] = useState<PortfolioItemData[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [portfolioId, setPortfolioId] = useState<string | null>(null);
  const [authenticated, setAuthenticated] = useState(true);

  const loadPortfolio = useCallback(async () => {
    try {
      const token = await Storage.getToken();
      if (!token) {
        setAuthenticated(false);
        setLoading(false);
        setRefreshing(false);
        return;
      }
      setAuthenticated(true);

      const portfolios: any = await getPortfolios();
      if (portfolios.length > 0) {
        const defaultPortfolio: any = await getDefaultPortfolio();
        setPortfolioId(defaultPortfolio.id);
        const allItems = portfolios.flatMap((p: any) => p.items || []);
        setItems(allItems);
      } else {
        setItems([]);
      }
    } catch (error) {
      console.error('Failed to load portfolio:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  const handleRemoveItem = useCallback(
    (itemId: string, cardName: string) => {
      if (!portfolioId) return;

      Alert.alert(
        'Remove Card',
        `Remove "${cardName}" from your portfolio?`,
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Remove',
            style: 'destructive',
            onPress: async () => {
              try {
                await removeFromPortfolio(portfolioId, itemId);
                setItems((prev) => prev.filter((item) => item.id !== itemId));
              } catch (error) {
                Alert.alert('Error', 'Failed to remove card');
              }
            },
          },
        ]
      );
    },
    [portfolioId]
  );

  useEffect(() => {
    loadPortfolio();
  }, [loadPortfolio]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    loadPortfolio();
  }, [loadPortfolio]);

  const totalValue = items.reduce(
    (sum, item) => sum + (item.card?.currentPrice || 0) * item.quantity,
    0
  );

  // Loading state
  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#ffd700" />
        <Text style={styles.loadingText}>Loading portfolio...</Text>
      </View>
    );
  }

  // Unauthenticated state
  if (!authenticated) {
    return (
      <View style={styles.centered}>
        <Text style={styles.emptyIcon}>🔒</Text>
        <Text style={styles.emptyTitle}>Sign In Required</Text>
        <Text style={styles.emptySubtitle}>
          Sign in to view and manage your card portfolio.
        </Text>
      </View>
    );
  }

  const renderItem = ({ item }: { item: PortfolioItemData }) => {
    const conditionColor = getConditionColor(item.condition);
    const price = (item.card?.currentPrice || 0) * item.quantity;

    return (
      <View style={styles.cardWrapper}>
        <TouchableOpacity style={styles.card} activeOpacity={0.8} onPress={() => item.card && navigation.navigate('CardDetail', { cardId: item.card.id, cardName: item.card.name })}>
          {/* Remove button */}
          <TouchableOpacity
            style={styles.removeBtn}
            onPress={() => handleRemoveItem(item.id, item.card?.name || 'Unknown')}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Text style={styles.removeBtnText}>✕</Text>
          </TouchableOpacity>

          {/* Quantity badge */}
          {item.quantity > 1 && (
            <View style={styles.quantityBadge}>
              <Text style={styles.quantityBadgeText}>x{item.quantity}</Text>
            </View>
          )}

          {/* Card image */}
          <View style={styles.imageContainer}>
            {item.card?.imageUrl ? (
              <Image
                source={{ uri: item.card.imageUrl }}
                style={styles.cardImage}
                resizeMode="contain"
              />
            ) : (
              <View style={styles.imagePlaceholder}>
                <Text style={styles.imagePlaceholderText}>No Image</Text>
              </View>
            )}

            {/* Grading badge */}
            {item.isGraded && item.gradingService && item.gradeValue != null && (
              <View style={styles.gradingBadge}>
                <Text style={styles.gradingBadgeText}>
                  {item.gradingService} {item.gradeValue}
                </Text>
              </View>
            )}
          </View>

          {/* Card info */}
          <View style={styles.cardInfo}>
            <Text style={styles.cardName} numberOfLines={1}>
              {item.card?.name || 'Unknown Card'}
            </Text>
            <Text style={styles.cardSet} numberOfLines={1}>
              {item.card?.setName || 'Unknown Set'}
              {item.card?.cardNumber ? ` #${item.card.cardNumber}` : ''}
            </Text>

            {/* Bottom row: condition + price */}
            <View style={styles.cardBottom}>
              <View
                style={[
                  styles.conditionBadge,
                  { backgroundColor: conditionColor + '20', borderColor: conditionColor },
                ]}
              >
                <Text
                  style={[styles.conditionText, { color: conditionColor }]}
                  numberOfLines={1}
                >
                  {formatCondition(item.condition)}
                </Text>
              </View>
              <Text style={styles.price}>${price.toFixed(2)}</Text>
            </View>
          </View>
        </TouchableOpacity>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <FlatList
        data={items}
        keyExtractor={(item) => item.id}
        numColumns={2}
        columnWrapperStyle={styles.row}
        contentContainerStyle={[
          styles.listContent,
          items.length === 0 && styles.emptyList,
        ]}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor="#ffd700"
            colors={['#ffd700']}
          />
        }
        renderItem={renderItem}
        ListHeaderComponent={
          <View style={styles.headerCard}>
            <Text style={styles.headerLabel}>Portfolio Value</Text>
            <Text style={styles.headerValue}>${totalValue.toFixed(2)}</Text>
            <Text style={styles.headerCount}>
              {items.length} {items.length === 1 ? 'card' : 'cards'}
            </Text>
          </View>
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyIcon}>📦</Text>
            <Text style={styles.emptyTitle}>Your portfolio is empty</Text>
            <Text style={styles.emptySubtitle}>
              Scan or search for cards to start building your collection.
            </Text>
            <TouchableOpacity
              style={styles.scanButton}
              onPress={() => navigation.navigate('ScanTab')}
              activeOpacity={0.8}
            >
              <Text style={styles.scanButtonText}>Scan a Card</Text>
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
  centered: {
    flex: 1,
    backgroundColor: '#0d1117',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  loadingText: {
    color: '#8b949e',
    fontSize: 14,
    marginTop: 12,
  },
  listContent: {
    paddingHorizontal: CARD_PADDING,
    paddingBottom: 24,
  },
  row: {
    justifyContent: 'space-between',
  },

  // Header card
  headerCard: {
    backgroundColor: '#161b22',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
    padding: 24,
    marginTop: 12,
    marginBottom: 16,
    alignItems: 'center',
  },
  headerLabel: {
    color: '#8b949e',
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 4,
  },
  headerValue: {
    color: '#ffd700',
    fontSize: 36,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  headerCount: {
    color: '#8b949e',
    fontSize: 13,
    marginTop: 4,
  },

  // Card grid
  cardWrapper: {
    width: CARD_WIDTH,
    marginBottom: CARD_GAP,
  },
  card: {
    backgroundColor: '#161b22',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
    overflow: 'hidden',
    position: 'relative',
  },
  imageContainer: {
    width: '100%',
    height: CARD_IMAGE_HEIGHT,
    backgroundColor: '#0d1117',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  cardImage: {
    width: '100%',
    height: '100%',
  },
  imagePlaceholder: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  imagePlaceholderText: {
    color: '#8b949e',
    fontSize: 12,
  },

  // Badges
  removeBtn: {
    position: 'absolute',
    top: 6,
    left: 6,
    zIndex: 10,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: 'rgba(230,57,70,0.9)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  removeBtnText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '700',
    lineHeight: 14,
  },
  quantityBadge: {
    position: 'absolute',
    top: 6,
    right: 6,
    zIndex: 10,
    backgroundColor: '#e63946',
    borderRadius: 10,
    paddingHorizontal: 7,
    paddingVertical: 2,
    minWidth: 24,
    alignItems: 'center',
  },
  quantityBadgeText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '700',
  },
  gradingBadge: {
    position: 'absolute',
    bottom: 6,
    left: 6,
    backgroundColor: 'rgba(255,215,0,0.9)',
    borderRadius: 6,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  gradingBadgeText: {
    color: '#0d1117',
    fontSize: 10,
    fontWeight: '700',
  },

  // Card info section
  cardInfo: {
    padding: 10,
  },
  cardName: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 2,
  },
  cardSet: {
    color: '#8b949e',
    fontSize: 11,
    marginBottom: 8,
  },
  cardBottom: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  conditionBadge: {
    borderRadius: 6,
    borderWidth: 1,
    paddingHorizontal: 6,
    paddingVertical: 2,
    flexShrink: 1,
    maxWidth: '60%',
  },
  conditionText: {
    fontSize: 9,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  price: {
    color: '#28a745',
    fontSize: 14,
    fontWeight: '700',
  },

  // Empty state
  emptyList: {
    flex: 1,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
    paddingTop: 60,
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: 16,
  },
  emptyTitle: {
    color: '#fff',
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 8,
    textAlign: 'center',
  },
  emptySubtitle: {
    color: '#8b949e',
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 24,
  },
  scanButton: {
    backgroundColor: '#e63946',
    paddingHorizontal: 28,
    paddingVertical: 14,
    borderRadius: 12,
  },
  scanButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});
