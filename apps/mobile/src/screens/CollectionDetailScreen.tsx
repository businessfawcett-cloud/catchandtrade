import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Image,
  ActivityIndicator,
} from 'react-native';
import { getSetDetails, getSetProgress, PokemonSet } from '../lib/api';

interface Card {
  id: string;
  name: string;
  setName: string;
  setCode: string;
  cardNumber: string;
  rarity: string | null;
  imageUrl: string | null;
}

interface SetDetails {
  set: PokemonSet;
  cards: Card[];
}

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
      code: string;
      name: string;
    };
  };
}

export default function CollectionDetailScreen({ navigation, route }: CollectionDetailScreenProps) {
  const { code, name } = route.params;
  const [loading, setLoading] = useState(true);
  const [setData, setSetData] = useState<SetDetails | null>(null);
  const [progress, setProgress] = useState<Progress | null>(null);
  const [showOwned, setShowOwned] = useState(true);

  useEffect(() => {
    loadData();
  }, [code]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [details, progressData] = await Promise.all([
        getSetDetails(code),
        getSetProgress(code)
      ]);
      setSetData(details);
      setProgress(progressData.progress);
    } catch (error) {
      console.error('Failed to load set details:', error);
    } finally {
      setLoading(false);
    }
  };

  const getRarityColor = (rarity: string | null) => {
    switch (rarity) {
      case 'Ultra Rare':
      case 'Special Illustration Rare':
      case 'MEGA ATTACK RARE':
      case 'Mega Hyper Rare':
        return '#FFD700';
      case 'Double Rare':
      case 'Rare':
        return '#ff6b6b';
      case 'Illustration Rare':
        return '#9b59b6';
      case 'Uncommon':
        return '#3498db';
      default:
        return '#95a5a6';
    }
  };

  const ownedCardIds = new Set(progress?.ownedCards || []);

  const renderCard = ({ item }: { item: Card }) => {
    const isOwned = ownedCardIds.has(item.id);
    
    return (
      <TouchableOpacity
        style={[styles.cardItem, !isOwned && styles.cardItemMissing]}
        onPress={() => navigation.navigate('CardDetail', { cardId: item.id, cardName: item.name })}
      >
        <View style={styles.cardImageContainer}>
          {item.imageUrl ? (
            <Image source={{ uri: item.imageUrl }} style={styles.cardImage} />
          ) : (
            <View style={styles.noImage}>
              <Text style={styles.noImageText}>No Image</Text>
            </View>
          )}
        </View>
        <View style={styles.cardInfo}>
          <Text style={styles.cardName} numberOfLines={1}>{item.name}</Text>
          <Text style={styles.cardNumber}>#{item.cardNumber}</Text>
          <View style={[styles.rarityBadge, { backgroundColor: getRarityColor(item.rarity) }]}>
            <Text style={styles.rarityText}>{item.rarity || 'Common'}</Text>
          </View>
        </View>
        <View style={[styles.ownedBadge, isOwned ? styles.ownedBadgeOwned : styles.ownedBadgeMissing]}>
          <Text style={styles.ownedBadgeText}>{isOwned ? '✓' : '✗'}</Text>
        </View>
      </TouchableOpacity>
    );
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#0066cc" />
      </View>
    );
  }

  const cardsToShow = showOwned 
    ? setData?.cards.filter(c => ownedCardIds.has(c.id)) || []
    : setData?.cards.filter(c => !ownedCardIds.has(c.id)) || [];

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Text style={styles.backButtonText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.title}>{name}</Text>
        <Text style={styles.subtitle}>{setData?.set.releaseYear}</Text>
      </View>

      <View style={styles.progressContainer}>
        <View style={styles.progressInfo}>
          <Text style={styles.progressText}>
            {progress?.owned || 0} / {progress?.total || 0} cards
          </Text>
          <Text style={styles.progressPercentage}>
            {progress?.percentage || 0}%
          </Text>
        </View>
        <View style={styles.progressBar}>
          <View 
            style={[
              styles.progressFill, 
              { width: `${progress?.percentage || 0}%` }
            ]} 
          />
        </View>
      </View>

      <View style={styles.tabs}>
        <TouchableOpacity 
          style={[styles.tab, showOwned && styles.tabActive]}
          onPress={() => setShowOwned(true)}
        >
          <Text style={[styles.tabText, showOwned && styles.tabTextActive]}>
            Owned ({progress?.ownedCards?.length || 0})
          </Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.tab, !showOwned && styles.tabActive]}
          onPress={() => setShowOwned(false)}
        >
          <Text style={[styles.tabText, !showOwned && styles.tabTextActive]}>
            Missing ({(progress?.total || 0) - (progress?.ownedCards?.length || 0)})
          </Text>
        </TouchableOpacity>
      </View>

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
              {showOwned ? 'No owned cards yet' : 'Collection complete!'}
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
    backgroundColor: '#f5f5f5',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    backgroundColor: '#1a1a2e',
    paddingTop: 50,
    paddingBottom: 20,
    paddingHorizontal: 16,
  },
  backButton: {
    marginBottom: 10,
  },
  backButtonText: {
    color: '#0066cc',
    fontSize: 16,
    fontWeight: '600',
  },
  title: {
    color: '#fff',
    fontSize: 24,
    fontWeight: 'bold',
  },
  subtitle: {
    color: '#999',
    fontSize: 14,
    marginTop: 4,
  },
  progressContainer: {
    backgroundColor: '#1a1a2e',
    paddingHorizontal: 16,
    paddingBottom: 20,
  },
  progressInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  progressText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  progressPercentage: {
    color: '#28a745',
    fontSize: 16,
    fontWeight: 'bold',
  },
  progressBar: {
    height: 8,
    backgroundColor: '#333',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#28a745',
    borderRadius: 4,
  },
  tabs: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  tab: {
    flex: 1,
    paddingVertical: 14,
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  tabActive: {
    borderBottomColor: '#0066cc',
  },
  tabText: {
    fontSize: 14,
    color: '#666',
    fontWeight: '600',
  },
  tabTextActive: {
    color: '#0066cc',
  },
  listContent: {
    padding: 8,
  },
  columnWrapper: {
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  cardItem: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 12,
    marginHorizontal: 4,
    padding: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  cardItemMissing: {
    opacity: 0.7,
  },
  cardImageContainer: {
    width: '100%',
    height: 120,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  cardImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'contain',
  },
  noImage: {
    width: 80,
    height: 100,
    backgroundColor: '#eee',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 8,
  },
  noImageText: {
    fontSize: 10,
    color: '#999',
  },
  cardInfo: {
    alignItems: 'center',
    width: '100%',
  },
  cardName: {
    fontSize: 12,
    fontWeight: '600',
    color: '#333',
    textAlign: 'center',
  },
  cardNumber: {
    fontSize: 11,
    color: '#666',
    marginTop: 2,
  },
  rarityBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
    marginTop: 4,
  },
  rarityText: {
    fontSize: 9,
    color: '#fff',
    fontWeight: '600',
  },
  ownedBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  ownedBadgeOwned: {
    backgroundColor: '#28a745',
  },
  ownedBadgeMissing: {
    backgroundColor: '#dc3545',
  },
  ownedBadgeText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyText: {
    fontSize: 16,
    color: '#666',
  },
});
