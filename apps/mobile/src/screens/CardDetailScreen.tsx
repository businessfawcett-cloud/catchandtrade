import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { getCardDetails, addToPortfolio, removeFromPortfolio, addToWatchlist, removeFromWatchlist, getDefaultPortfolio, getPortfolios, getWatchlist } from '../lib/api';
import GradingCalculator from '../components/GradingCalculator';

interface CardDetailScreenProps {
  navigation: any;
  route: {
    params: {
      cardId: string;
      cardName?: string;
    };
  };
}

interface CardData {
  id: string;
  name: string;
  setName: string;
  setCode: string;
  cardNumber: string;
  rarity: string | null;
  imageUrl: string | null;
  prices?: Array<{
    priceMarket: number;
    priceLow: number;
    priceMid: number;
    priceHigh: number;
  }>;
}

export default function CardDetailScreen({ navigation, route }: CardDetailScreenProps) {
  const { cardId } = route.params;
  const [loading, setLoading] = useState(true);
  const [card, setCard] = useState<CardData | null>(null);
  const [inPortfolio, setInPortfolio] = useState(false);
  const [inWatchlist, setInWatchlist] = useState(false);
  const [watchlistItemId, setWatchlistItemId] = useState<string | null>(null);
  const [portfolioId, setPortfolioId] = useState<string | null>(null);

  useEffect(() => {
    loadData();
  }, [cardId]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [cardData, watchlistData, portfoliosData] = await Promise.all([
        getCardDetails(cardId),
        getWatchlist().catch(() => []),
        getPortfolios().catch(() => [])
      ]);
      
      setCard(cardData);
      
      // Check if in portfolio
      for (const portfolio of portfoliosData) {
        const items = portfolio.items || [];
        if (items.some((item: any) => item.card?.id === cardId)) {
          setInPortfolio(true);
          setPortfolioId(portfolio.id);
          break;
        }
      }
      
      // Check if in watchlist
      for (const item of watchlistData) {
        if (item.cardId === cardId) {
          setInWatchlist(true);
          setWatchlistItemId(item.id);
          break;
        }
      }
    } catch (error) {
      console.error('Failed to load card:', error);
    } finally {
      setLoading(false);
    }
  };

  const handlePortfolio = async () => {
    if (inPortfolio) {
      // Remove from portfolio
      Alert.alert(
        'Remove from Portfolio',
        `Remove "${card?.name}" from your portfolio?`,
        [
          { text: 'Cancel', style: 'cancel' },
          { 
            text: 'Remove', 
            style: 'destructive',
            onPress: async () => {
              try {
                await removeFromPortfolio(portfolioId!, cardId);
                setInPortfolio(false);
                Alert.alert('Success', 'Card removed from portfolio');
              } catch (error) {
                Alert.alert('Error', 'Failed to remove card');
              }
            }
          }
        ]
      );
    } else {
      // Add to portfolio (simplified - in real app would show modal)
      try {
        if (!portfolioId) {
          const portfolios = await getPortfolios();
          if (portfolios.length > 0) {
            setPortfolioId(portfolios[0].id);
            await addToPortfolio(portfolios[0].id, cardId, 'NEAR_MINT', 1);
          }
        } else {
          await addToPortfolio(portfolioId, cardId, 'NEAR_MINT', 1);
        }
        setInPortfolio(true);
        Alert.alert('Success', 'Card added to portfolio');
      } catch (error) {
        Alert.alert('Error', 'Failed to add card');
      }
    }
  };

  const handleWatchlist = async () => {
    try {
      if (inWatchlist && watchlistItemId) {
        await removeFromWatchlist(watchlistItemId);
        setInWatchlist(false);
        setWatchlistItemId(null);
        Alert.alert('Success', 'Card removed from watchlist');
      } else {
        await addToWatchlist(cardId);
        setInWatchlist(true);
        Alert.alert('Success', 'Card added to watchlist');
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to update watchlist');
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#0066cc" />
      </View>
    );
  }

  const latestPrice = card?.prices?.[0];
  const rarityColor = card?.rarity?.includes('Ultra') || card?.rarity?.includes('Rare') ? '#FFD700' : 
                     card?.rarity?.includes('Uncommon') ? '#3498db' : '#95a5a6';

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Text style={styles.backButtonText}>← Back</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.imageContainer}>
        {card?.imageUrl ? (
          <Image source={{ uri: card.imageUrl }} style={styles.cardImage} />
        ) : (
          <View style={styles.noImage}>
            <Text style={styles.noImageText}>No Image</Text>
          </View>
        )}
      </View>

      <View style={styles.infoContainer}>
        <Text style={styles.cardName}>{card?.name}</Text>
        <Text style={styles.cardSet}>{card?.setName} #{card?.cardNumber}</Text>
        
        {card?.rarity && (
          <View style={[styles.rarityBadge, { backgroundColor: rarityColor }]}>
            <Text style={styles.rarityText}>{card.rarity}</Text>
          </View>
        )}

        {latestPrice && (
          <View style={styles.priceSection}>
            <Text style={styles.priceLabel}>Market Price</Text>
            <Text style={styles.price}>${latestPrice.priceMarket?.toFixed(2) || 'N/A'}</Text>
            <View style={styles.priceRange}>
              <Text style={styles.priceRangeText}>
                Low: ${latestPrice.priceLow?.toFixed(2)} | Mid: ${latestPrice.priceMid?.toFixed(2)} | High: ${latestPrice.priceHigh?.toFixed(2)}
              </Text>
            </View>
          </View>
        )}

        <View style={styles.buttons}>
          <TouchableOpacity 
            style={[styles.button, inPortfolio ? styles.removeButton : styles.portfolioButton]}
            onPress={handlePortfolio}
          >
            <Text style={styles.buttonText}>
              {inPortfolio ? 'Remove from Portfolio' : 'Add to Portfolio'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.button, styles.watchlistButton, inWatchlist && styles.watchlistButtonActive]}
            onPress={handleWatchlist}
          >
            <Text style={[styles.buttonText, inWatchlist && styles.watchlistButtonText]}>
              {inWatchlist ? 'Remove from Watchlist' : 'Add to Watchlist'}
            </Text>
          </TouchableOpacity>
        </View>

        {card && <GradingCalculator cardId={card.id} cardName={card.name} />}
      </View>
    </ScrollView>
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
  imageContainer: {
    backgroundColor: '#fff',
    alignItems: 'center',
    paddingVertical: 20,
  },
  cardImage: {
    width: 250,
    height: 350,
    resizeMode: 'contain',
  },
  noImage: {
    width: 200,
    height: 280,
    backgroundColor: '#eee',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 12,
  },
  noImageText: {
    color: '#999',
    fontSize: 16,
  },
  infoContainer: {
    backgroundColor: '#fff',
    marginTop: 8,
    padding: 20,
  },
  cardName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  cardSet: {
    fontSize: 16,
    color: '#666',
    marginBottom: 12,
  },
  rarityBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    marginBottom: 20,
  },
  rarityText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  priceSection: {
    marginBottom: 20,
  },
  priceLabel: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  price: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#28a745',
  },
  priceRange: {
    marginTop: 8,
  },
  priceRangeText: {
    fontSize: 12,
    color: '#999',
  },
  buttons: {
    gap: 12,
  },
  button: {
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
  },
  portfolioButton: {
    backgroundColor: '#e63946',
  },
  removeButton: {
    backgroundColor: '#dc3545',
  },
  watchlistButton: {
    backgroundColor: 'transparent',
    borderWidth: 2,
    borderColor: '#ffd700',
  },
  watchlistButtonActive: {
    backgroundColor: '#ffd700',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  watchlistButtonText: {
    color: '#000',
  },
});
