import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Image,
  RefreshControl,
  ActivityIndicator,
  Dimensions,
} from 'react-native';
import { getUser, getPortfolios, getSets } from '../lib/api';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CARD_WIDTH = (SCREEN_WIDTH - 56) / 2;

interface HomeScreenProps {
  navigation: any;
}

export default function HomeScreen({ navigation }: HomeScreenProps) {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [portfolios, setPortfolios] = useState<any[]>([]);
  const [sets, setSets] = useState<any[]>([]);

  const loadData = useCallback(async () => {
    try {
      const userData = await getUser();
      setUser(userData);

      if (userData) {
        const [portfolioData, setsData] = await Promise.all([
          getPortfolios(),
          getSets(),
        ]);
        setPortfolios(portfolioData || []);
        setSets(setsData || []);
      }
    } catch (error) {
      console.error('Failed to load data:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    loadData();
  }, [loadData]);

  // Compute stats from all portfolios
  const allItems = portfolios.flatMap((p: any) => p.items || []);
  const uniqueCardIds = new Set(allItems.map((i: any) => i.card?.id).filter(Boolean));
  const totalCards = allItems.length;
  const portfolioValue = allItems.reduce(
    (sum: number, i: any) => sum + (i.card?.currentPrice || 0),
    0
  );
  const setsCollected = sets.length;

  const recentCards = allItems.slice(-6).reverse();

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#e63946" />
        <Text style={styles.loadingText}>Loading...</Text>
      </View>
    );
  }

  // ---- LOGGED OUT VIEW ----
  if (!user) {
    return (
      <ScrollView style={styles.container} contentContainerStyle={styles.loggedOutContent}>
        {/* Hero Section */}
        <View style={styles.heroSection}>
          <Text style={styles.heroTitle}>Catch & Trade</Text>
          <Text style={styles.heroTagline}>Catch. Trade. Collect.</Text>
          <Text style={styles.heroDescription}>
            The ultimate platform for Pokemon card collectors. Track your
            collection, discover market values, and trade with confidence.
          </Text>
        </View>

        {/* CTA Buttons */}
        <View style={styles.ctaContainer}>
          <TouchableOpacity
            style={styles.ctaPrimary}
            onPress={() => navigation.navigate('ProfileTab')}
          >
            <Text style={styles.ctaPrimaryText}>Start Collecting</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.ctaSecondary}
            onPress={() => navigation.navigate('MarketplaceTab')}
          >
            <Text style={styles.ctaSecondaryText}>Browse Marketplace</Text>
          </TouchableOpacity>
        </View>

        {/* How It Works */}
        <View style={styles.howItWorks}>
          <Text style={styles.sectionTitle}>How It Works</Text>

          <View style={styles.stepCard}>
            <View style={styles.stepNumber}>
              <Text style={styles.stepNumberText}>1</Text>
            </View>
            <View style={styles.stepContent}>
              <Text style={styles.stepTitle}>Scan Your Cards</Text>
              <Text style={styles.stepDescription}>
                Use your camera to instantly identify and catalog your Pokemon cards.
              </Text>
            </View>
          </View>

          <View style={styles.stepCard}>
            <View style={[styles.stepNumber, { backgroundColor: '#ffd700' }]}>
              <Text style={[styles.stepNumberText, { color: '#0d1117' }]}>2</Text>
            </View>
            <View style={styles.stepContent}>
              <Text style={styles.stepTitle}>Track Your Collection</Text>
              <Text style={styles.stepDescription}>
                Monitor real-time market prices and see your portfolio value grow.
              </Text>
            </View>
          </View>

          <View style={styles.stepCard}>
            <View style={[styles.stepNumber, { backgroundColor: '#28a745' }]}>
              <Text style={styles.stepNumberText}>3</Text>
            </View>
            <View style={styles.stepContent}>
              <Text style={styles.stepTitle}>Trade & Collect</Text>
              <Text style={styles.stepDescription}>
                Browse the marketplace and connect with other trainers to trade.
              </Text>
            </View>
          </View>
        </View>
      </ScrollView>
    );
  }

  // ---- LOGGED IN VIEW ----
  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.loggedInContent}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={onRefresh}
          tintColor="#e63946"
          colors={['#e63946']}
        />
      }
    >
      {/* Trainer Card Header */}
      <View style={styles.trainerCard}>
        <View style={styles.avatarCircle}>
          <Text style={styles.avatarText}>
            {(user.displayName || user.username || '?')[0].toUpperCase()}
          </Text>
        </View>
        <View style={styles.trainerInfo}>
          <Text style={styles.displayName}>{user.displayName || user.username}</Text>
          <Text style={styles.username}>@{user.username}</Text>
        </View>
      </View>

      {/* 4-Stat Grid */}
      <View style={styles.statsGrid}>
        <View style={styles.statCard}>
          <View style={[styles.statAccent, { backgroundColor: '#e63946' }]} />
          <Text style={styles.statValue}>{uniqueCardIds.size}</Text>
          <Text style={styles.statLabel}>Unique Cards</Text>
        </View>
        <View style={styles.statCard}>
          <View style={[styles.statAccent, { backgroundColor: '#3b82f6' }]} />
          <Text style={styles.statValue}>{totalCards}</Text>
          <Text style={styles.statLabel}>Total Cards</Text>
        </View>
        <View style={styles.statCard}>
          <View style={[styles.statAccent, { backgroundColor: '#ffd700' }]} />
          <Text style={[styles.statValue, { color: '#ffd700' }]}>
            ${portfolioValue.toFixed(2)}
          </Text>
          <Text style={styles.statLabel}>Portfolio Value</Text>
        </View>
        <View style={styles.statCard}>
          <View style={[styles.statAccent, { backgroundColor: '#28a745' }]} />
          <Text style={styles.statValue}>{setsCollected}</Text>
          <Text style={styles.statLabel}>Sets Collected</Text>
        </View>
      </View>

      {/* Recent Cards */}
      <Text style={styles.sectionTitle}>Recent Cards</Text>
      {recentCards.length > 0 ? (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.recentScroll}
          contentContainerStyle={styles.recentScrollContent}
        >
          {recentCards.map((item: any, index: number) => (
            <View key={item.id || index} style={styles.recentCard}>
              {item.card?.imageUrl ? (
                <Image
                  source={{ uri: item.card.imageUrl }}
                  style={styles.recentImage}
                  resizeMode="cover"
                />
              ) : (
                <View style={styles.recentImagePlaceholder}>
                  <Text style={styles.placeholderText}>No Image</Text>
                </View>
              )}
              <Text style={styles.recentName} numberOfLines={1}>
                {item.card?.name || 'Unknown'}
              </Text>
              <Text style={styles.recentPrice}>
                ${(item.card?.currentPrice || 0).toFixed(2)}
              </Text>
            </View>
          ))}
        </ScrollView>
      ) : (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>No cards in your collection yet.</Text>
          <Text style={styles.emptySubtext}>Scan a card to get started!</Text>
        </View>
      )}

      {/* Quick Actions */}
      <Text style={styles.sectionTitle}>Quick Actions</Text>
      <View style={styles.quickActions}>
        <TouchableOpacity
          style={styles.actionButtonMarketplace}
          onPress={() => navigation.navigate('MarketplaceTab')}
        >
          <Text style={styles.actionButtonMarketplaceText}>Browse Marketplace</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.actionButtonScan}
          onPress={() => navigation.navigate('ScanTab')}
        >
          <Text style={styles.actionButtonScanText}>Scan a Card</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  // ---- Layout ----
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
    marginTop: 12,
    fontSize: 16,
  },
  loggedOutContent: {
    padding: 20,
    paddingBottom: 40,
  },
  loggedInContent: {
    padding: 16,
    paddingBottom: 40,
  },

  // ---- Hero (Logged Out) ----
  heroSection: {
    alignItems: 'center',
    marginTop: 48,
    marginBottom: 36,
  },
  heroTitle: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 8,
  },
  heroTagline: {
    fontSize: 20,
    color: '#ffd700',
    fontWeight: '600',
    marginBottom: 16,
  },
  heroDescription: {
    fontSize: 15,
    color: '#8b949e',
    textAlign: 'center',
    lineHeight: 22,
    paddingHorizontal: 12,
  },

  // ---- CTA Buttons (Logged Out) ----
  ctaContainer: {
    gap: 12,
    marginBottom: 40,
  },
  ctaPrimary: {
    backgroundColor: '#e63946',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  ctaPrimaryText: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  ctaSecondary: {
    borderWidth: 2,
    borderColor: '#ffd700',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  ctaSecondaryText: {
    color: '#ffd700',
    fontSize: 18,
    fontWeight: 'bold',
  },

  // ---- How It Works (Logged Out) ----
  howItWorks: {
    marginBottom: 20,
  },
  stepCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#161b22',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  stepNumber: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#e63946',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  stepNumberText: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  stepContent: {
    flex: 1,
  },
  stepTitle: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  stepDescription: {
    color: '#8b949e',
    fontSize: 14,
    lineHeight: 20,
  },

  // ---- Trainer Card (Logged In) ----
  trainerCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#161b22',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
    borderRadius: 16,
    padding: 16,
    marginBottom: 20,
  },
  avatarCircle: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: '#3b82f6',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  avatarText: {
    color: '#ffffff',
    fontSize: 22,
    fontWeight: 'bold',
  },
  trainerInfo: {
    flex: 1,
  },
  displayName: {
    color: '#ffffff',
    fontSize: 20,
    fontWeight: 'bold',
  },
  username: {
    color: '#8b949e',
    fontSize: 14,
    marginTop: 2,
  },

  // ---- Stats Grid (Logged In) ----
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 24,
  },
  statCard: {
    width: CARD_WIDTH,
    backgroundColor: '#161b22',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
    borderRadius: 12,
    padding: 14,
    overflow: 'hidden',
  },
  statAccent: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 3,
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
  },
  statValue: {
    color: '#ffffff',
    fontSize: 22,
    fontWeight: 'bold',
    marginTop: 4,
  },
  statLabel: {
    color: '#8b949e',
    fontSize: 12,
    marginTop: 4,
  },

  // ---- Section Title ----
  sectionTitle: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 14,
  },

  // ---- Recent Cards (Logged In) ----
  recentScroll: {
    marginBottom: 24,
  },
  recentScrollContent: {
    gap: 12,
  },
  recentCard: {
    width: 130,
    backgroundColor: '#161b22',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
    borderRadius: 12,
    overflow: 'hidden',
  },
  recentImage: {
    width: '100%',
    height: 160,
  },
  recentImagePlaceholder: {
    width: '100%',
    height: 160,
    backgroundColor: '#21262d',
    justifyContent: 'center',
    alignItems: 'center',
  },
  placeholderText: {
    color: '#8b949e',
    fontSize: 12,
  },
  recentName: {
    color: '#c9d1d9',
    fontSize: 13,
    fontWeight: '600',
    paddingHorizontal: 8,
    paddingTop: 8,
  },
  recentPrice: {
    color: '#ffd700',
    fontSize: 13,
    fontWeight: 'bold',
    paddingHorizontal: 8,
    paddingBottom: 10,
    paddingTop: 2,
  },
  emptyContainer: {
    backgroundColor: '#161b22',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
    borderRadius: 12,
    padding: 28,
    alignItems: 'center',
    marginBottom: 24,
  },
  emptyText: {
    color: '#8b949e',
    fontSize: 15,
    textAlign: 'center',
  },
  emptySubtext: {
    color: '#c9d1d9',
    fontSize: 13,
    marginTop: 6,
  },

  // ---- Quick Actions (Logged In) ----
  quickActions: {
    gap: 12,
    marginBottom: 20,
  },
  actionButtonMarketplace: {
    backgroundColor: '#161b22',
    borderWidth: 2,
    borderColor: '#ffd700',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  actionButtonMarketplaceText: {
    color: '#ffd700',
    fontSize: 16,
    fontWeight: 'bold',
  },
  actionButtonScan: {
    backgroundColor: '#e63946',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  actionButtonScanText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});
