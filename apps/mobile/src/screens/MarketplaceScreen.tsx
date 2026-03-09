import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Image,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Dimensions,
} from 'react-native';
import { searchCards, getSets } from '../lib/api';

interface Card {
  id: string;
  name: string;
  setName: string;
  setCode: string;
  cardNumber: string;
  rarity: string;
  imageUrl: string;
  currentPrice: number;
}

interface PokemonSet {
  id: string;
  name: string;
  code: string;
  totalCards: number;
  releaseYear: number;
  imageUrl: string;
  cardCount: number;
}

interface MarketplaceScreenProps {
  navigation: any;
}

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CARD_GAP = 12;
const CARD_HORIZONTAL_PADDING = 16;
const CARD_WIDTH = (SCREEN_WIDTH - CARD_HORIZONTAL_PADDING * 2 - CARD_GAP) / 2;

const COLORS = {
  bg: '#0d1117',
  card: '#161b22',
  border: 'rgba(255,255,255,0.05)',
  textPrimary: '#ffffff',
  textSecondary: '#8b949e',
  red: '#e63946',
  gold: '#ffd700',
  green: '#28a745',
};

function getRarityStyle(rarity: string | null): { bg: string; text: string } {
  switch (rarity) {
    case 'Ultra Rare':
    case 'Special Illustration Rare':
    case 'MEGA ATTACK RARE':
    case 'Mega Hyper Rare':
      return { bg: COLORS.gold, text: '#000' };
    case 'Double Rare':
    case 'Rare':
      return { bg: COLORS.red, text: '#fff' };
    case 'Illustration Rare':
      return { bg: '#9b59b6', text: '#fff' };
    case 'Uncommon':
      return { bg: '#3498db', text: '#fff' };
    default:
      return { bg: 'rgba(255,255,255,0.1)', text: COLORS.textSecondary };
  }
}

function SkeletonCard() {
  return (
    <View style={styles.skeletonCard}>
      <View style={styles.skeletonImage} />
      <View style={styles.skeletonLine} />
      <View style={styles.skeletonLineShort} />
    </View>
  );
}

export default function MarketplaceScreen({ navigation }: MarketplaceScreenProps) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Card[]>([]);
  const [sets, setSets] = useState<PokemonSet[]>([]);
  const [loading, setLoading] = useState(false);
  const [setsLoading, setSetsLoading] = useState(true);
  const [hasSearched, setHasSearched] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Load sets on mount
  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const data = await getSets();
        if (mounted) setSets(data || []);
      } catch (err) {
        console.error('Failed to load sets:', err);
      } finally {
        if (mounted) setSetsLoading(false);
      }
    })();
    return () => { mounted = false; };
  }, []);

  // Debounced search
  const handleSearchInput = useCallback((text: string) => {
    setQuery(text);

    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    if (text.trim().length < 2) {
      setResults([]);
      setHasSearched(false);
      setLoading(false);
      return;
    }

    setLoading(true);
    debounceRef.current = setTimeout(async () => {
      try {
        const cards = await searchCards(text);
        setResults(cards || []);
        setHasSearched(true);
      } catch (error) {
        console.error('Search failed:', error);
        setResults([]);
      } finally {
        setLoading(false);
      }
    }, 300);
  }, []);

  const isSearchActive = query.trim().length >= 2;

  // --- Render helpers ---

  const renderCardItem = ({ item }: { item: Card }) => {
    const rarityStyle = getRarityStyle(item.rarity);
    return (
      <TouchableOpacity
        style={styles.cardItem}
        activeOpacity={0.7}
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
          <Text style={styles.cardSet} numberOfLines={1}>{item.setName}</Text>
          <View style={styles.cardMeta}>
            <View style={[styles.rarityBadge, { backgroundColor: rarityStyle.bg }]}>
              <Text style={[styles.rarityText, { color: rarityStyle.text }]}>
                {item.rarity || 'Common'}
              </Text>
            </View>
            {item.currentPrice != null && (
              <Text style={styles.cardPrice}>${item.currentPrice.toFixed(2)}</Text>
            )}
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  const renderSetItem = ({ item }: { item: PokemonSet }) => (
    <TouchableOpacity
      style={styles.setCard}
      activeOpacity={0.7}
      onPress={() => {
        setQuery(item.name);
        handleSearchInput(item.name);
      }}
    >
      {item.imageUrl ? (
        <Image source={{ uri: item.imageUrl }} style={styles.setImage} />
      ) : (
        <View style={styles.setImagePlaceholder}>
          <Text style={styles.setImagePlaceholderText}>{item.name.charAt(0)}</Text>
        </View>
      )}
      <Text style={styles.setName} numberOfLines={2}>{item.name}</Text>
      <Text style={styles.setCardCount}>{item.cardCount ?? item.totalCards} cards</Text>
    </TouchableOpacity>
  );

  const renderSkeletons = () => (
    <View style={styles.skeletonContainer}>
      {[1, 2, 3, 4].map((i) => (
        <SkeletonCard key={i} />
      ))}
    </View>
  );

  // --- Main render ---

  return (
    <View style={styles.container}>
      {/* Search bar */}
      <View style={styles.searchBarContainer}>
        <View style={styles.searchInputWrapper}>
          <Text style={styles.searchIcon}>&#x1F50D;</Text>
          <TextInput
            style={styles.searchInput}
            placeholder="Search cards..."
            placeholderTextColor={COLORS.textSecondary}
            value={query}
            onChangeText={handleSearchInput}
            autoCapitalize="none"
            autoCorrect={false}
            returnKeyType="search"
          />
          {query.length > 0 && (
            <TouchableOpacity
              onPress={() => {
                setQuery('');
                setResults([]);
                setHasSearched(false);
                setLoading(false);
              }}
              style={styles.clearButton}
            >
              <Text style={styles.clearButtonText}>X</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Content */}
      {loading ? (
        renderSkeletons()
      ) : isSearchActive ? (
        <FlatList
          data={results}
          keyExtractor={(item) => item.id}
          renderItem={renderCardItem}
          numColumns={2}
          contentContainerStyle={styles.listContent}
          columnWrapperStyle={styles.columnWrapper}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            hasSearched ? (
              <View style={styles.emptyContainer}>
                <Text style={styles.emptyTitle}>No cards found</Text>
                <Text style={styles.emptySubtext}>
                  Try a different search term
                </Text>
              </View>
            ) : null
          }
        />
      ) : (
        /* Browse by sets */
        <View style={styles.setsSection}>
          <Text style={styles.sectionTitle}>Browse by Set</Text>
          {setsLoading ? (
            renderSkeletons()
          ) : sets.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyTitle}>No sets available</Text>
            </View>
          ) : (
            <FlatList
              data={sets}
              keyExtractor={(item) => item.id}
              renderItem={renderSetItem}
              numColumns={2}
              contentContainerStyle={styles.listContent}
              columnWrapperStyle={styles.columnWrapper}
              showsVerticalScrollIndicator={false}
            />
          )}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.bg,
  },

  // Search bar
  searchBarContainer: {
    paddingHorizontal: CARD_HORIZONTAL_PADDING,
    paddingTop: 56,
    paddingBottom: 12,
    backgroundColor: COLORS.bg,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  searchInputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.card,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingHorizontal: 12,
  },
  searchIcon: {
    fontSize: 16,
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    paddingVertical: 12,
    color: COLORS.textPrimary,
    fontSize: 16,
  },
  clearButton: {
    padding: 6,
  },
  clearButtonText: {
    color: COLORS.textSecondary,
    fontSize: 14,
    fontWeight: '600',
  },

  // Lists
  listContent: {
    paddingHorizontal: CARD_HORIZONTAL_PADDING,
    paddingTop: 12,
    paddingBottom: 24,
  },
  columnWrapper: {
    justifyContent: 'space-between',
    marginBottom: CARD_GAP,
  },

  // Card items (search results)
  cardItem: {
    width: CARD_WIDTH,
    backgroundColor: COLORS.card,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
    overflow: 'hidden',
  },
  cardImageContainer: {
    width: '100%',
    height: 160,
    backgroundColor: 'rgba(255,255,255,0.02)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  cardImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'contain',
  },
  noImage: {
    width: 80,
    height: 110,
    backgroundColor: 'rgba(255,255,255,0.05)',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 8,
  },
  noImageText: {
    fontSize: 10,
    color: COLORS.textSecondary,
  },
  cardInfo: {
    padding: 10,
  },
  cardName: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.textPrimary,
    marginBottom: 2,
  },
  cardSet: {
    fontSize: 11,
    color: COLORS.textSecondary,
    marginBottom: 8,
  },
  cardMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  rarityBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    flexShrink: 1,
  },
  rarityText: {
    fontSize: 9,
    fontWeight: '700',
  },
  cardPrice: {
    fontSize: 14,
    fontWeight: 'bold',
    color: COLORS.green,
  },

  // Set cards (browse mode)
  setsSection: {
    flex: 1,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.textPrimary,
    paddingHorizontal: CARD_HORIZONTAL_PADDING,
    paddingTop: 16,
    paddingBottom: 4,
  },
  setCard: {
    width: CARD_WIDTH,
    backgroundColor: COLORS.card,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  setImage: {
    width: 64,
    height: 64,
    resizeMode: 'contain',
    marginBottom: 8,
  },
  setImagePlaceholder: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: 'rgba(255,255,255,0.05)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  setImagePlaceholderText: {
    fontSize: 24,
    fontWeight: '700',
    color: COLORS.textSecondary,
  },
  setName: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.textPrimary,
    textAlign: 'center',
    marginBottom: 4,
  },
  setCardCount: {
    fontSize: 11,
    color: COLORS.textSecondary,
  },

  // Skeleton loading
  skeletonContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    paddingHorizontal: CARD_HORIZONTAL_PADDING,
    paddingTop: 12,
  },
  skeletonCard: {
    width: CARD_WIDTH,
    backgroundColor: COLORS.card,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: 12,
    marginBottom: CARD_GAP,
  },
  skeletonImage: {
    width: '100%',
    height: 120,
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderRadius: 8,
    marginBottom: 10,
  },
  skeletonLine: {
    width: '80%',
    height: 12,
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderRadius: 4,
    marginBottom: 6,
  },
  skeletonLineShort: {
    width: '50%',
    height: 10,
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderRadius: 4,
  },

  // Empty state
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.textPrimary,
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: COLORS.textSecondary,
    textAlign: 'center',
    paddingHorizontal: 40,
  },
});
