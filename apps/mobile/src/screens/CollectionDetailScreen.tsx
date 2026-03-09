import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  Dimensions,
} from 'react-native';
import { getSetDetails, getSetProgress, PokemonSet, Card } from '../lib/api';

interface Progress {
  owned: number;
  total: number;
  percentage: number;
  ownedCards?: string[];
  missingCards?: string[];
}

interface CollectionDetailScreenProps {
  navigation: any;
  route: {
    params: {
      setCode: string;
      setName: string;
    };
  };
}

const SCREEN_WIDTH = Dimensions.get('window').width;
const CARD_GAP = 10;
const CARD_PADDING = 16;
const CARD_WIDTH = (SCREEN_WIDTH - CARD_PADDING * 2 - CARD_GAP) / 2;

export default function CollectionDetailScreen({
  navigation,
  route,
}: CollectionDetailScreenProps) {
  const { setCode, setName } = route.params;
  const [loading, setLoading] = useState(true);
  const [setData, setSetData] = useState<{ set: PokemonSet; cards: Card[] } | null>(null);
  const [progress, setProgress] = useState<Progress | null>(null);
  const [activeTab, setActiveTab] = useState<'missing' | 'owned'>('missing');

  useEffect(() => {
    loadData();
  }, [setCode]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [details, progressData] = await Promise.all([
        getSetDetails(setCode),
        getSetProgress(setCode).catch(() => ({ progress: null })),
      ]);
      setSetData(details);
      setProgress(progressData.progress);
    } catch (error) {
      console.error('Failed to load set details:', error);
    } finally {
      setLoading(false);
    }
  };

  const ownedCardIds = useMemo(
    () => new Set(progress?.ownedCards || []),
    [progress]
  );

  const cardsToShow = useMemo(() => {
    if (!setData?.cards) return [];
    if (activeTab === 'owned') {
      return setData.cards.filter((c) => ownedCardIds.has(c.id));
    }
    return setData.cards.filter((c) => !ownedCardIds.has(c.id));
  }, [setData, activeTab, ownedCardIds]);

  const missingCount = useMemo(() => {
    if (!setData?.cards) return 0;
    return setData.cards.filter((c) => !ownedCardIds.has(c.id)).length;
  }, [setData, ownedCardIds]);

  const ownedCount = progress?.ownedCards?.length || 0;

  const getRarityColor = (rarity: string | null): string => {
    switch (rarity) {
      case 'Ultra Rare':
      case 'Special Illustration Rare':
      case 'MEGA ATTACK RARE':
      case 'Mega Hyper Rare':
        return '#ffd700';
      case 'Double Rare':
      case 'Rare':
        return '#e63946';
      case 'Illustration Rare':
        return '#9b59b6';
      case 'Uncommon':
        return '#3498db';
      default:
        return '#8b949e';
    }
  };

  const getProgressColor = (pct: number): string => {
    if (pct === 0) return '#e63946';
    if (pct >= 100) return '#28a745';
    return '#ffd700';
  };

  const percentage = progress?.percentage || 0;

  const renderCard = ({ item }: { item: Card }) => {
    const isOwned = ownedCardIds.has(item.id);

    return (
      <TouchableOpacity
        style={[styles.cardItem, !isOwned && styles.cardItemMissing]}
        activeOpacity={0.7}
        onPress={() =>
          navigation.navigate('CardDetail', {
            cardId: item.id,
            cardName: item.name,
          })
        }
      >
        {/* Ownership badge */}
        <View
          style={[
            styles.ownershipBadge,
            isOwned ? styles.ownedBadge : styles.missingBadge,
          ]}
        >
          <Text style={styles.ownershipBadgeText}>
            {isOwned ? '\u2713' : '\u2717'}
          </Text>
        </View>

        {/* Card image */}
        <View style={styles.cardImageContainer}>
          {item.imageUrl ? (
            <Image source={{ uri: item.imageUrl }} style={styles.cardImage} />
          ) : (
            <View style={styles.noImage}>
              <Text style={styles.noImageText}>No Image</Text>
            </View>
          )}
        </View>

        {/* Card info */}
        <View style={styles.cardInfo}>
          <Text style={styles.cardName} numberOfLines={1}>
            {item.name}
          </Text>
          <Text style={styles.cardNumber}>#{item.cardNumber}</Text>
          <View
            style={[
              styles.rarityBadge,
              { backgroundColor: getRarityColor(item.rarity) + '22' },
            ]}
          >
            <Text
              style={[
                styles.rarityText,
                { color: getRarityColor(item.rarity) },
              ]}
            >
              {item.rarity || 'Common'}
            </Text>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#e63946" />
        <Text style={styles.loadingText}>Loading cards...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle} numberOfLines={2}>
          {setName}
        </Text>
        <Text style={styles.headerYear}>{setData?.set.releaseYear}</Text>

        {/* Progress section */}
        <View style={styles.progressSection}>
          <View style={styles.progressStats}>
            <Text style={styles.progressLabel}>
              {progress?.owned || 0} / {progress?.total || setData?.set.totalCards || 0} owned
            </Text>
            <Text
              style={[
                styles.progressPercent,
                { color: getProgressColor(percentage) },
              ]}
            >
              {percentage}%
            </Text>
          </View>
          <View style={styles.progressBar}>
            <View
              style={[
                styles.progressFill,
                {
                  width: `${percentage}%`,
                  backgroundColor: getProgressColor(percentage),
                },
              ]}
            />
          </View>
        </View>
      </View>

      {/* Tab toggle */}
      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'missing' && styles.tabActive]}
          onPress={() => setActiveTab('missing')}
        >
          <Text
            style={[
              styles.tabText,
              activeTab === 'missing' && styles.tabTextActive,
            ]}
          >
            Missing ({missingCount})
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'owned' && styles.tabActive]}
          onPress={() => setActiveTab('owned')}
        >
          <Text
            style={[
              styles.tabText,
              activeTab === 'owned' && styles.tabTextActive,
            ]}
          >
            Owned ({ownedCount})
          </Text>
        </TouchableOpacity>
      </View>

      {/* Card grid */}
      <FlatList
        data={cardsToShow}
        keyExtractor={(item) => item.id}
        renderItem={renderCard}
        numColumns={2}
        contentContainerStyle={styles.listContent}
        columnWrapperStyle={styles.columnWrapper}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>
              {activeTab === 'owned'
                ? 'No owned cards yet'
                : 'Collection complete!'}
            </Text>
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
    fontSize: 16,
    marginTop: 12,
  },
  header: {
    backgroundColor: '#161b22',
    paddingTop: 56,
    paddingBottom: 20,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#21262d',
  },
  headerTitle: {
    color: '#ffffff',
    fontSize: 24,
    fontWeight: 'bold',
  },
  headerYear: {
    color: '#ffd700',
    fontSize: 15,
    fontWeight: '600',
    marginTop: 4,
  },
  progressSection: {
    marginTop: 16,
  },
  progressStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  progressLabel: {
    color: '#8b949e',
    fontSize: 14,
    fontWeight: '600',
  },
  progressPercent: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  progressBar: {
    height: 8,
    backgroundColor: '#21262d',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 4,
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: '#161b22',
    borderBottomWidth: 1,
    borderBottomColor: '#21262d',
  },
  tab: {
    flex: 1,
    paddingVertical: 14,
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  tabActive: {
    borderBottomColor: '#e63946',
  },
  tabText: {
    fontSize: 14,
    color: '#8b949e',
    fontWeight: '600',
  },
  tabTextActive: {
    color: '#ffffff',
  },
  listContent: {
    padding: CARD_PADDING,
    paddingBottom: 24,
  },
  columnWrapper: {
    justifyContent: 'space-between',
    marginBottom: CARD_GAP,
  },
  cardItem: {
    width: CARD_WIDTH,
    backgroundColor: '#161b22',
    borderRadius: 12,
    padding: 10,
    borderWidth: 1,
    borderColor: '#21262d',
  },
  cardItemMissing: {
    opacity: 0.7,
  },
  ownershipBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1,
  },
  ownedBadge: {
    backgroundColor: '#28a745',
  },
  missingBadge: {
    backgroundColor: '#e63946',
  },
  ownershipBadgeText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: 'bold',
  },
  cardImageContainer: {
    width: '100%',
    height: 140,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  cardImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'contain',
    borderRadius: 8,
  },
  noImage: {
    width: 90,
    height: 120,
    backgroundColor: '#21262d',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 8,
  },
  noImageText: {
    fontSize: 11,
    color: '#8b949e',
  },
  cardInfo: {
    alignItems: 'center',
    width: '100%',
  },
  cardName: {
    fontSize: 13,
    fontWeight: '600',
    color: '#ffffff',
    textAlign: 'center',
  },
  cardNumber: {
    fontSize: 11,
    color: '#8b949e',
    marginTop: 2,
  },
  rarityBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
    marginTop: 6,
  },
  rarityText: {
    fontSize: 10,
    fontWeight: '700',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 16,
    color: '#8b949e',
  },
});
