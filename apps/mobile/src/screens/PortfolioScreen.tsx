import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Image,
  TouchableOpacity,
  RefreshControl,
  Alert,
} from 'react-native';
import { getPortfolios, getDefaultPortfolio, removeFromPortfolio, PortfolioItem } from '../lib/api';

interface PortfolioScreenProps {
  navigation: any;
}

export default function PortfolioScreen({ navigation }: PortfolioScreenProps) {
  const [items, setItems] = useState<PortfolioItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [portfolioId, setPortfolioId] = useState<string | null>(null);

  const loadPortfolio = async () => {
    try {
      const portfolios = await getPortfolios();
      if (portfolios.length > 0) {
        const defaultPortfolio = await getDefaultPortfolio();
        setPortfolioId(defaultPortfolio.id);
        const allItems = portfolios.flatMap((p: any) => p.items || []);
        setItems(allItems);
      }
    } catch (error) {
      console.error('Failed to load portfolio:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRemoveItem = async (itemId: string, cardName: string) => {
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
              setItems(items.filter(item => item.id !== itemId));
            } catch (error) {
              Alert.alert('Error', 'Failed to remove card');
            }
          }
        }
      ]
    );
  };

  useEffect(() => {
    loadPortfolio();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    loadPortfolio();
  };

  const totalValue = items.reduce(
    (sum, item) => sum + (item.card?.currentPrice || 0) * item.quantity,
    0
  );

  if (loading) {
    return (
      <View style={styles.container}>
        <Text>Loading...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>My Portfolio</Text>
        <Text style={styles.value}>${totalValue.toFixed(2)}</Text>
      </View>

      <FlatList
        data={items}
        keyExtractor={(item) => item.id}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        renderItem={({ item }: { item: PortfolioItem }) => (
          <View style={styles.cardItem}>
            {item.card?.imageUrl && (
              <Image source={{ uri: item.card.imageUrl }} style={styles.cardImage} />
            )}
            <View style={styles.cardInfo}>
              <Text style={styles.cardName}>{item.card?.name}</Text>
              <Text style={styles.cardSet}>
                {item.card?.setName} #{item.card?.cardNumber}
              </Text>
              <View style={styles.cardMeta}>
                <Text style={styles.condition}>{item.condition.replace('_', ' ')}</Text>
                <Text style={styles.quantity}>x{item.quantity}</Text>
              </View>
            </View>
            <View style={styles.cardPrice}>
              <Text style={styles.price}>
                ${((item.card?.currentPrice || 0) * item.quantity).toFixed(2)}
              </Text>
              <TouchableOpacity 
                style={styles.removeButton}
                onPress={() => handleRemoveItem(item.id, item.card?.name)}
              >
                <Text style={styles.removeButtonText}>Remove</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>No cards in your portfolio</Text>
            <TouchableOpacity
              style={styles.addButton}
              onPress={() => navigation.navigate('ScanTab')}
            >
              <Text style={styles.addButtonText}>Scan a Card</Text>
            </TouchableOpacity>
          </View>
        }
        contentContainerStyle={items.length === 0 ? styles.emptyList : undefined}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  value: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#28a745',
  },
  cardItem: {
    flexDirection: 'row',
    padding: 16,
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
    overflow: 'hidden',
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
  removeButton: {
    marginTop: 8,
    backgroundColor: '#dc3545',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 4,
  },
  removeButtonText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
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
    marginBottom: 20,
  },
  addButton: {
    backgroundColor: '#0066cc',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  addButtonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
});
