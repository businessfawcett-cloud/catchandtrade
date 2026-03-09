import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  FlatList,
  TouchableOpacity,
  Image,
  StyleSheet,
  Modal,
  ActivityIndicator,
} from 'react-native';
import { searchCards, Card } from '../lib/api';

interface SearchModalProps {
  visible: boolean;
  onClose: () => void;
  onSelectCard: (card: Card) => void;
}

export default function SearchModal({ visible, onClose, onSelectCard }: SearchModalProps) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Card[]>([]);
  const [loading, setLoading] = useState(false);

  const doSearch = useCallback(async (searchQuery: string) => {
    if (searchQuery.length < 2) {
      setResults([]);
      return;
    }

    setLoading(true);
    try {
      const cards = await searchCards(searchQuery);
      setResults(cards);
    } catch (error) {
      console.error('Search failed:', error);
      setResults([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      doSearch(query);
    }, 300);

    return () => clearTimeout(timer);
  }, [query, doSearch]);

  const handleSelect = (card: Card) => {
    onSelectCard(card);
    setQuery('');
    setResults([]);
    onClose();
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet">
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={onClose} style={styles.backButton}>
            <Text style={styles.backButtonText}>← Back</Text>
          </TouchableOpacity>
          <Text style={styles.title}>Search Cards</Text>
        </View>

        <View style={styles.searchContainer}>
          <TextInput
            style={styles.searchInput}
            placeholder="Search for a card..."
            placeholderTextColor="#999"
            value={query}
            onChangeText={setQuery}
            autoFocus
            autoCapitalize="none"
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
            contentContainerStyle={styles.list}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={styles.resultItem}
                onPress={() => handleSelect(item)}
              >
                <View style={styles.resultImageContainer}>
                  {item.imageUrl ? (
                    <Image
                      source={{ uri: item.imageUrl }}
                      style={styles.resultImage}
                      resizeMode="cover"
                    />
                  ) : (
                    <View style={[styles.resultImage, styles.resultImagePlaceholder]}>
                      <Text style={{ fontSize: 24 }}>🃏</Text>
                    </View>
                  )}
                </View>
                <View style={styles.resultInfo}>
                  <Text style={styles.resultName}>{item.name}</Text>
                  <Text style={styles.resultSet}>
                    {item.setName} #{item.cardNumber}
                  </Text>
                  {item.currentPrice && (
                    <Text style={styles.resultPrice}>${item.currentPrice.toFixed(2)}</Text>
                  )}
                </View>
              </TouchableOpacity>
            )}
            ListEmptyComponent={
              query.length >= 2 ? (
                <Text style={styles.emptyText}>No cards found</Text>
              ) : (
                <Text style={styles.emptyText}>Enter at least 2 characters to search</Text>
              )
            }
          />
        )}
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  backButton: {
    padding: 8,
  },
  backButtonText: {
    fontSize: 16,
    color: '#0066cc',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    marginLeft: 16,
  },
  searchContainer: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  searchInput: {
    backgroundColor: '#f5f5f5',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    fontSize: 16,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  list: {
    padding: 16,
  },
  resultItem: {
    flexDirection: 'row',
    padding: 12,
    backgroundColor: '#f9f9f9',
    borderRadius: 12,
    marginBottom: 12,
  },
  resultImageContainer: {
    width: 60,
    height: 84,
  },
  resultImage: {
    width: 60,
    height: 84,
    borderRadius: 8,
    backgroundColor: '#eee',
  },
  resultImagePlaceholder: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  resultInfo: {
    flex: 1,
    marginLeft: 12,
    justifyContent: 'center',
  },
  resultName: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  resultSet: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  resultPrice: {
    fontSize: 16,
    fontWeight: '600',
    color: '#28a745',
  },
  emptyText: {
    textAlign: 'center',
    color: '#999',
    marginTop: 40,
  },
});
