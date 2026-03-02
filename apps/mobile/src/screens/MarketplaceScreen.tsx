import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Image,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
} from 'react-native';
import { searchCards, Card } from '../lib/api';

interface MarketplaceScreenProps {
  navigation: any;
}

export default function MarketplaceScreen({ navigation }: MarketplaceScreenProps) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Card[]>([]);
  const [loading, setLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);

  const handleSearch = useCallback(async (text: string) => {
    setQuery(text);
    
    if (text.trim().length < 2) {
      setResults([]);
      setHasSearched(false);
      return;
    }

    try {
      setLoading(true);
      const cards = await searchCards(text);
      setResults(cards || []);
      setHasSearched(true);
    } catch (error) {
      console.error('Search failed:', error);
      setResults([]);
    } finally {
      setLoading(false);
    }
  }, []);

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

  const renderCard = ({ item }: { item: Card }) => (
    <TouchableOpacity
      style={styles.cardItem}
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
        <Text style={styles.cardName} numberOfLines={2}>{item.name}</Text>
        <Text style={styles.cardSet} numberOfLines={1}>
          {item.setName}
        </Text>
        <View style={styles.cardMeta}>
          <View style={[styles.rarityBadge, { backgroundColor: getRarityColor(item.rarity) }]}>
            <Text style={styles.rarityText}>{item.rarity || 'Common'}</Text>
          </View>
          {item.currentPrice && (
            <Text style={styles.cardPrice}>${item.currentPrice.toFixed(2)}</Text>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Marketplace</Text>
        <TextInput
          style={styles.searchInput}
          placeholder="Search cards..."
          placeholderTextColor="#999"
          value={query}
          onChangeText={handleSearch}
          autoCapitalize="none"
          autoCorrect={false}
        />
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#0066cc" />
        </View>
      ) : (
        <FlatList
          data={results}
          keyExtractor={(item) => item.id}
          renderItem={renderCard}
          numColumns={2}
          contentContainerStyle={styles.listContent}
          columnWrapperStyle={styles.columnWrapper}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              {hasSearched ? (
                <Text style={styles.emptyText}>No cards found</Text>
              ) : (
                <>
                  <Text style={styles.emptyTitle}>Search for Cards</Text>
                  <Text style={styles.emptySubtext}>
                    Search by card name, set, or number
                  </Text>
                </>
              )}
            </View>
          }
        />
      )}
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
    paddingBottom: 16,
    paddingHorizontal: 16,
  },
  title: {
    color: '#fff',
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  searchInput: {
    backgroundColor: '#2a2a4e',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    color: '#fff',
    fontSize: 16,
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
    maxWidth: '48%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
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
    marginBottom: 2,
  },
  cardSet: {
    fontSize: 10,
    color: '#666',
    marginBottom: 4,
    textAlign: 'center',
  },
  cardMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
  },
  rarityBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
  },
  rarityText: {
    fontSize: 8,
    color: '#fff',
    fontWeight: '600',
  },
  cardPrice: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#28a745',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    paddingHorizontal: 40,
  },
  emptyText: {
    fontSize: 16,
    color: '#666',
  },
});
