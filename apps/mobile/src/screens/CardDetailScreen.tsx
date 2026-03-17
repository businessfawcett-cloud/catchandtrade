import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Dimensions,
  Modal,
  Platform,
  StatusBar,
  SafeAreaView,
} from 'react-native';
import { getCardDetails, addToPortfolio, addToWatchlist, removeFromWatchlist, getPortfolios, getWatchlist, Card } from '../lib/api';
import * as Storage from '../lib/storage';
import SearchModal from '../components/SearchModal';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const GRAPH_WIDTH = SCREEN_WIDTH - 64;
const GRAPH_HEIGHT = 160;

const GRADING_SERVICES = ['PSA', 'BGS', 'CGC', 'SGC'] as const;
type GradingService = typeof GRADING_SERVICES[number];

const GRADE_MULTIPLIERS: Record<GradingService, Record<number, number>> = {
  PSA: { 10: 6.0, 9: 1.8, 8: 1.2, 7: 0.9, 6: 0.7 },
  CGC: { 10: 3.5, 9: 1.5, 8: 1.1, 7: 0.8, 6: 0.6 },
  BGS: { 10: 4.0, 9: 1.6, 8: 1.1, 7: 0.8, 6: 0.6 },
  SGC: { 10: 2.5, 9: 1.4, 8: 1.0, 7: 0.8, 6: 0.6 },
};

const CONDITIONS = [
  { key: 'MINT', label: 'Mint' },
  { key: 'NEAR_MINT', label: 'Near Mint' },
  { key: 'LIGHTLY_PLAYED', label: 'Lightly Played' },
  { key: 'MODERATELY_PLAYED', label: 'Moderately Played' },
  { key: 'HEAVILY_PLAYED', label: 'Heavily Played' },
  { key: 'DAMAGED', label: 'Damaged' },
] as const;

interface CardDetailScreenProps {
  navigation: any;
  route: {
    params: {
      cardId: string;
      cardName?: string;
      fromScan?: boolean;
      scanHint?: string;
    };
  };
}

interface PriceData {
  priceMarket: number | null;
  priceLow: number | null;
  priceMid: number | null;
  priceHigh: number | null;
  date: string;
}

interface CardData {
  id: string;
  name: string;
  setCode: string;
  cardNumber: string;
  rarity: string | null;
  imageUrl: string | null;
  prices?: PriceData[];
}

export default function CardDetailScreen({ navigation, route }: CardDetailScreenProps) {
  const { cardId, fromScan, scanHint } = route.params;
  const [loading, setLoading] = useState(true);
  const [searchVisible, setSearchVisible] = useState(false);
  const [card, setCard] = useState<CardData | null>(null);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [inWatchlist, setInWatchlist] = useState(false);
  const [watchlistItemId, setWatchlistItemId] = useState<string | null>(null);
  const [addingWatchlist, setAddingWatchlist] = useState(false);
  const [gradingService, setGradingService] = useState<GradingService>('PSA');
  const [gradeValue, setGradeValue] = useState(10);
  // Add-to-portfolio modal state
  const [portfolioModalVisible, setPortfolioModalVisible] = useState(false);
  const [cardFormat, setCardFormat] = useState<'RAW' | 'GRADED'>('RAW');
  const [modalCondition, setModalCondition] = useState('NEAR_MINT');
  const [modalGradingService, setModalGradingService] = useState<GradingService>('PSA');
  const [modalGradeValue, setModalGradeValue] = useState(10);
  const [submittingPortfolio, setSubmittingPortfolio] = useState(false);

  useEffect(() => {
    loadData();
  }, [cardId]);

  const loadData = async () => {
    try {
      setLoading(true);
      const token = await Storage.getToken();
      setIsLoggedIn(!!token);

      const cardData = await getCardDetails(cardId);
      setCard(cardData);

      if (token) {
        try {
          const watchlistData = await getWatchlist();
          if (Array.isArray(watchlistData)) {
            for (const item of watchlistData) {
              if (item.cardId === cardId) {
                setInWatchlist(true);
                setWatchlistItemId(item.id);
                break;
              }
            }
          }
        } catch {}
      }
    } catch (error) {
      console.error('Failed to load card:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenPortfolioModal = async () => {
    const token = await Storage.getToken();
    if (!token) {
      Alert.alert('Login Required', 'Log in from the Profile tab to add cards to your portfolio.');
      return;
    }
    setCardFormat('RAW');
    setModalCondition('NEAR_MINT');
    setModalGradingService('PSA');
    setModalGradeValue(10);
    setPortfolioModalVisible(true);
  };

  const handleConfirmAdd = async () => {
    setSubmittingPortfolio(true);
    try {
      const portfolios = await getPortfolios();
      const portfolio = Array.isArray(portfolios) && portfolios.length > 0 ? portfolios[0] : null;
      if (!portfolio) {
        Alert.alert('Error', 'No portfolio found. Create one first.');
        return;
      }

      const isGraded = cardFormat === 'GRADED';
      const valuation = isGraded ? modalGradedValue : null;

      await addToPortfolio(portfolio.id, cardId, modalCondition, 1, isGraded ? {
        isGraded: true,
        gradingService: modalGradingService,
        gradeValue: modalGradeValue,
        valuationOverride: valuation ?? undefined,
      } : undefined);

      setPortfolioModalVisible(false);
      const priceLabel = isGraded && valuation != null
        ? `$${valuation.toFixed(2)} (${modalGradingService} ${modalGradeValue})`
        : marketPrice != null ? `$${marketPrice.toFixed(2)}` : '';
      Alert.alert('Added!', `${card?.name} added to portfolio${priceLabel ? `\n${priceLabel}` : ''}`);
    } catch (error: any) {
      if (error.message === 'UNAUTHORIZED') {
        Alert.alert('Login Required', 'Your session expired. Log in again from the Profile tab.');
        setPortfolioModalVisible(false);
      } else {
        Alert.alert('Error', 'Failed to add card to portfolio');
      }
    } finally {
      setSubmittingPortfolio(false);
    }
  };

  const handleWatchlist = async () => {
    const token = await Storage.getToken();
    if (!token) {
      Alert.alert('Login Required', 'Log in from the Profile tab to use the watchlist.');
      return;
    }
    setAddingWatchlist(true);
    try {
      if (inWatchlist && watchlistItemId) {
        await removeFromWatchlist(watchlistItemId);
        setInWatchlist(false);
        setWatchlistItemId(null);
      } else {
        await addToWatchlist(cardId);
        setInWatchlist(true);
      }
    } catch (error: any) {
      if (error.message === 'UNAUTHORIZED') {
        Alert.alert('Login Required', 'Your session expired. Log in again from the Profile tab.');
      } else {
        Alert.alert('Error', 'Failed to update watchlist');
      }
    } finally {
      setAddingWatchlist(false);
    }
  };

  const latestPrice = card?.prices?.[0];
  const marketPrice = latestPrice?.priceMarket ?? null;

  const gradedValue = useMemo(() => {
    if (marketPrice == null) return null;
    return Math.round(marketPrice * GRADE_MULTIPLIERS[gradingService][gradeValue] * 100) / 100;
  }, [marketPrice, gradingService, gradeValue]);

  const modalGradedValue = useMemo(() => {
    if (marketPrice == null) return null;
    return Math.round(marketPrice * GRADE_MULTIPLIERS[modalGradingService][modalGradeValue] * 100) / 100;
  }, [marketPrice, modalGradingService, modalGradeValue]);

  const priceHistory = useMemo(() => {
    if (!card?.prices || card.prices.length < 2) return null;
    return [...card.prices].reverse().filter(p => p.priceMarket != null);
  }, [card?.prices]);

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#e63946" />
      </View>
    );
  }

  if (!card) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={{ color: '#999', fontSize: 16 }}>Card not found</Text>
        <TouchableOpacity onPress={() => navigation.goBack()} style={{ marginTop: 16 }}>
          <Text style={{ color: '#58a6ff', fontSize: 16 }}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <>
    <ScrollView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Text style={styles.backButtonText}>← Back</Text>
        </TouchableOpacity>
        {fromScan && (
          <TouchableOpacity onPress={() => setSearchVisible(true)} style={styles.notRightButton}>
            <Text style={styles.notRightText}>Not right? Search</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Card Image */}
      <View style={styles.imageContainer}>
        {card.imageUrl ? (
          <Image source={{ uri: card.imageUrl }} style={styles.cardImage} />
        ) : (
          <View style={styles.noImage}>
            <Text style={styles.noImageText}>No Image</Text>
          </View>
        )}
      </View>

      {/* Card Info */}
      <View style={styles.section}>
        <Text style={styles.cardName}>{card.name}</Text>
        <Text style={styles.cardSet}>{card.setCode} #{card.cardNumber}</Text>
        {card.rarity && (
          <View style={styles.rarityBadge}>
            <Text style={styles.rarityText}>{card.rarity}</Text>
          </View>
        )}
      </View>

      {/* Price Section */}
      {latestPrice && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Market Price</Text>
          <Text style={styles.price}>
            ${marketPrice?.toFixed(2) ?? 'N/A'}
          </Text>
          <View style={styles.priceRow}>
            <PricePill label="Low" value={latestPrice.priceLow} />
            <PricePill label="Mid" value={latestPrice.priceMid} />
            <PricePill label="High" value={latestPrice.priceHigh} />
          </View>
        </View>
      )}

      {/* Price Graph */}
      {priceHistory && priceHistory.length >= 2 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Price History</Text>
          <MiniPriceGraph data={priceHistory} />
        </View>
      )}

      {/* Graded Value Calculator */}
      {marketPrice != null && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Graded Value Calculator</Text>

          <View style={styles.toggleRow}>
            {GRADING_SERVICES.map(svc => (
              <TouchableOpacity
                key={svc}
                style={[styles.toggleButton, gradingService === svc && styles.toggleButtonActive]}
                onPress={() => setGradingService(svc)}
              >
                <Text style={[styles.toggleText, gradingService === svc && styles.toggleTextActive]}>
                  {svc}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <View style={styles.toggleRow}>
            {[10, 9, 8, 7, 6].map(grade => (
              <TouchableOpacity
                key={grade}
                style={[styles.toggleButton, gradeValue === grade && styles.toggleButtonActive]}
                onPress={() => setGradeValue(grade)}
              >
                <Text style={[styles.toggleText, gradeValue === grade && styles.toggleTextActive]}>
                  {grade}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {gradedValue != null && (
            <View style={styles.gradedResult}>
              <Text style={styles.gradedLabel}>
                {gradingService} {gradeValue} Estimated Value
              </Text>
              <Text style={styles.gradedPrice}>${gradedValue.toFixed(2)}</Text>
              <Text style={styles.gradedMultiplier}>
                {GRADE_MULTIPLIERS[gradingService][gradeValue]}x raw market price
              </Text>
            </View>
          )}
        </View>
      )}

      {/* Action Buttons */}
      <View style={styles.section}>
        <TouchableOpacity
          style={styles.portfolioButton}
          onPress={handleOpenPortfolioModal}
        >
          <Text style={styles.portfolioButtonText}>Add to Portfolio</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.watchlistButton, inWatchlist && styles.watchlistButtonActive]}
          onPress={handleWatchlist}
          disabled={addingWatchlist}
        >
          {addingWatchlist ? (
            <ActivityIndicator color={inWatchlist ? '#000' : '#ffd700'} />
          ) : (
            <Text style={[styles.watchlistButtonText, inWatchlist && styles.watchlistButtonTextActive]}>
              {inWatchlist ? '★ In Watchlist' : '☆ Add to Watchlist'}
            </Text>
          )}
        </TouchableOpacity>
      </View>

      <View style={{ height: 40 }} />

      {/* Add to Portfolio Modal */}
      <Modal visible={portfolioModalVisible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Add to Portfolio</Text>
              <TouchableOpacity onPress={() => setPortfolioModalVisible(false)}>
                <Text style={styles.modalClose}>X</Text>
              </TouchableOpacity>
            </View>

            <Text style={styles.modalCardName}>{card?.name}</Text>
            {marketPrice != null && (
              <Text style={styles.modalMarketPrice}>Market: ${marketPrice.toFixed(2)}</Text>
            )}

            {/* RAW / GRADED toggle */}
            <View style={styles.formatRow}>
              <TouchableOpacity
                style={[styles.formatButton, cardFormat === 'RAW' && styles.formatButtonActive]}
                onPress={() => setCardFormat('RAW')}
              >
                <Text style={[styles.formatText, cardFormat === 'RAW' && styles.formatTextActive]}>Raw</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.formatButton, cardFormat === 'GRADED' && styles.formatButtonActive]}
                onPress={() => setCardFormat('GRADED')}
              >
                <Text style={[styles.formatText, cardFormat === 'GRADED' && styles.formatTextActive]}>Graded</Text>
              </TouchableOpacity>
            </View>

            {/* RAW: condition picker */}
            {cardFormat === 'RAW' && (
              <View style={styles.modalSection}>
                <Text style={styles.modalSectionTitle}>Condition</Text>
                <View style={styles.conditionGrid}>
                  {CONDITIONS.map(c => (
                    <TouchableOpacity
                      key={c.key}
                      style={[styles.conditionPill, modalCondition === c.key && styles.conditionPillActive]}
                      onPress={() => setModalCondition(c.key)}
                    >
                      <Text style={[styles.conditionPillText, modalCondition === c.key && styles.conditionPillTextActive]}>
                        {c.label}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
                {marketPrice != null && (
                  <Text style={styles.modalPricePreview}>Value: ${marketPrice.toFixed(2)}</Text>
                )}
              </View>
            )}

            {/* GRADED: service + grade picker */}
            {cardFormat === 'GRADED' && (
              <View style={styles.modalSection}>
                <Text style={styles.modalSectionTitle}>Grading Service</Text>
                <View style={styles.toggleRow}>
                  {GRADING_SERVICES.map(svc => (
                    <TouchableOpacity
                      key={svc}
                      style={[styles.toggleButton, modalGradingService === svc && styles.toggleButtonActive]}
                      onPress={() => setModalGradingService(svc)}
                    >
                      <Text style={[styles.toggleText, modalGradingService === svc && styles.toggleTextActive]}>
                        {svc}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>

                <Text style={styles.modalSectionTitle}>Grade</Text>
                <View style={styles.toggleRow}>
                  {[10, 9, 8, 7, 6].map(grade => (
                    <TouchableOpacity
                      key={grade}
                      style={[styles.toggleButton, modalGradeValue === grade && styles.toggleButtonActive]}
                      onPress={() => setModalGradeValue(grade)}
                    >
                      <Text style={[styles.toggleText, modalGradeValue === grade && styles.toggleTextActive]}>
                        {grade}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>

                {modalGradedValue != null && (
                  <View style={styles.modalGradedPreview}>
                    <Text style={styles.modalGradedLabel}>
                      {modalGradingService} {modalGradeValue} Value
                    </Text>
                    <Text style={styles.modalGradedPrice}>${modalGradedValue.toFixed(2)}</Text>
                    <Text style={styles.modalGradedMult}>
                      {GRADE_MULTIPLIERS[modalGradingService][modalGradeValue]}x market price
                    </Text>
                  </View>
                )}
              </View>
            )}

            {/* Confirm button */}
            <TouchableOpacity
              style={styles.confirmButton}
              onPress={handleConfirmAdd}
              disabled={submittingPortfolio}
            >
              {submittingPortfolio ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.confirmButtonText}>
                  Add {cardFormat === 'GRADED' && modalGradedValue != null
                    ? `- $${modalGradedValue.toFixed(2)}`
                    : marketPrice != null ? `- $${marketPrice.toFixed(2)}` : ''}
                </Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </ScrollView>
    {fromScan && (
      <SearchModal
        visible={searchVisible}
        onClose={() => setSearchVisible(false)}
        onSelectCard={(selectedCard: Card) => {
          setSearchVisible(false);
          navigation.replace('CardDetail', { cardId: selectedCard.id, cardName: selectedCard.name });
        }}
        initialQuery={scanHint || undefined}
      />
    )}
    </>
  );
}

function PricePill({ label, value }: { label: string; value: number | null }) {
  return (
    <View style={styles.pricePill}>
      <Text style={styles.pricePillLabel}>{label}</Text>
      <Text style={styles.pricePillValue}>
        {value != null ? `$${value.toFixed(2)}` : '—'}
      </Text>
    </View>
  );
}

function MiniPriceGraph({ data }: { data: PriceData[] }) {
  const prices = data.map(d => d.priceMarket!);
  const min = Math.min(...prices);
  const max = Math.max(...prices);
  const range = max - min || 1;

  const points = prices.map((price, i) => {
    const x = (i / (prices.length - 1)) * GRAPH_WIDTH;
    const y = GRAPH_HEIGHT - ((price - min) / range) * (GRAPH_HEIGHT - 20) - 10;
    return { x, y };
  });

  const firstPrice = prices[0];
  const lastPrice = prices[prices.length - 1];
  const change = lastPrice - firstPrice;
  const changePercent = firstPrice > 0 ? (change / firstPrice) * 100 : 0;
  const isUp = change >= 0;

  return (
    <View>
      <View style={styles.graphContainer}>
        {points.map((point, i) => {
          if (i === 0) return null;
          const prev = points[i - 1];
          const dx = point.x - prev.x;
          const dy = point.y - prev.y;
          const length = Math.sqrt(dx * dx + dy * dy);
          const angle = Math.atan2(dy, dx) * (180 / Math.PI);
          return (
            <View
              key={i}
              style={{
                position: 'absolute',
                left: prev.x,
                top: prev.y,
                width: length,
                height: 2,
                backgroundColor: isUp ? '#28a745' : '#dc3545',
                transform: [{ rotate: `${angle}deg` }],
                transformOrigin: 'left center',
              }}
            />
          );
        })}
        {points.filter((_, i) => i === 0 || i === points.length - 1 || i % Math.ceil(points.length / 5) === 0).map((point, i) => (
          <View
            key={`dot-${i}`}
            style={{
              position: 'absolute',
              left: point.x - 3,
              top: point.y - 3,
              width: 6,
              height: 6,
              borderRadius: 3,
              backgroundColor: isUp ? '#28a745' : '#dc3545',
            }}
          />
        ))}
      </View>
      <View style={styles.graphLabels}>
        <Text style={styles.graphLabel}>${firstPrice.toFixed(2)}</Text>
        <Text style={[styles.graphChange, { color: isUp ? '#28a745' : '#dc3545' }]}>
          {isUp ? '▲' : '▼'} ${Math.abs(change).toFixed(2)} ({changePercent.toFixed(1)}%)
        </Text>
        <Text style={styles.graphLabel}>${lastPrice.toFixed(2)}</Text>
      </View>
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
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#0d1117',
  },
  header: {
    paddingTop: 50,
    paddingBottom: 12,
    paddingHorizontal: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  backButton: {
    padding: 4,
  },
  backButtonText: {
    color: '#58a6ff',
    fontSize: 16,
    fontWeight: '600',
  },
  notRightButton: {
    backgroundColor: 'rgba(255,255,255,0.12)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  notRightText: {
    color: '#ff6b6b',
    fontSize: 13,
    fontWeight: '600',
  },
  imageContainer: {
    alignItems: 'center',
    paddingVertical: 16,
  },
  cardImage: {
    width: 220,
    height: 308,
    resizeMode: 'contain',
  },
  noImage: {
    width: 200,
    height: 280,
    backgroundColor: '#1a2332',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 12,
  },
  noImageText: {
    color: '#666',
    fontSize: 16,
  },
  section: {
    backgroundColor: '#161b22',
    marginHorizontal: 16,
    marginBottom: 12,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
  },
  sectionTitle: {
    color: '#8b949e',
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 12,
  },
  cardName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 4,
  },
  cardSet: {
    fontSize: 15,
    color: '#8b949e',
    marginBottom: 10,
  },
  rarityBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    backgroundColor: 'rgba(255,215,0,0.15)',
    borderWidth: 1,
    borderColor: 'rgba(255,215,0,0.3)',
  },
  rarityText: {
    color: '#ffd700',
    fontSize: 13,
    fontWeight: '600',
  },
  price: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#28a745',
    marginBottom: 12,
  },
  priceRow: {
    flexDirection: 'row',
    gap: 8,
  },
  pricePill: {
    flex: 1,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 8,
    padding: 8,
    alignItems: 'center',
  },
  pricePillLabel: {
    color: '#8b949e',
    fontSize: 11,
    marginBottom: 2,
  },
  pricePillValue: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  graphContainer: {
    width: GRAPH_WIDTH,
    height: GRAPH_HEIGHT,
    backgroundColor: 'rgba(255,255,255,0.02)',
    borderRadius: 8,
    overflow: 'hidden',
  },
  graphLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
  },
  graphLabel: {
    color: '#8b949e',
    fontSize: 12,
  },
  graphChange: {
    fontSize: 13,
    fontWeight: '600',
  },
  toggleRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 12,
  },
  toggleButton: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 8,
    backgroundColor: 'rgba(255,255,255,0.05)',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  toggleButtonActive: {
    backgroundColor: '#e63946',
    borderColor: '#e63946',
  },
  toggleText: {
    color: '#8b949e',
    fontSize: 14,
    fontWeight: '600',
  },
  toggleTextActive: {
    color: '#fff',
  },
  gradedResult: {
    backgroundColor: 'rgba(255,215,0,0.08)',
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,215,0,0.2)',
  },
  gradedLabel: {
    color: '#ffd700',
    fontSize: 12,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  gradedPrice: {
    color: '#fff',
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  gradedMultiplier: {
    color: '#8b949e',
    fontSize: 12,
  },
  portfolioButton: {
    backgroundColor: '#e63946',
    paddingVertical: 16,
    borderRadius: 10,
    alignItems: 'center',
    marginBottom: 10,
  },
  portfolioButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
  watchlistButton: {
    borderWidth: 2,
    borderColor: '#ffd700',
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center',
  },
  watchlistButtonActive: {
    backgroundColor: '#ffd700',
  },
  watchlistButtonText: {
    color: '#ffd700',
    fontSize: 16,
    fontWeight: '600',
  },
  watchlistButtonTextActive: {
    color: '#000',
  },
  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#161b22',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    paddingBottom: Platform.OS === 'ios' ? 40 : 20,
    maxHeight: '85%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  modalTitle: {
    color: '#fff',
    fontSize: 20,
    fontWeight: 'bold',
  },
  modalClose: {
    color: '#8b949e',
    fontSize: 18,
    fontWeight: 'bold',
    padding: 8,
  },
  modalCardName: {
    color: '#c9d1d9',
    fontSize: 16,
    marginBottom: 4,
  },
  modalMarketPrice: {
    color: '#28a745',
    fontSize: 14,
    marginBottom: 16,
  },
  formatRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 16,
  },
  formatButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 10,
    backgroundColor: 'rgba(255,255,255,0.05)',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  formatButtonActive: {
    backgroundColor: '#e63946',
    borderColor: '#e63946',
  },
  formatText: {
    color: '#8b949e',
    fontSize: 16,
    fontWeight: '700',
  },
  formatTextActive: {
    color: '#fff',
  },
  modalSection: {
    marginBottom: 16,
  },
  modalSectionTitle: {
    color: '#8b949e',
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 8,
  },
  conditionGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  conditionPill: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  conditionPillActive: {
    backgroundColor: '#e63946',
    borderColor: '#e63946',
  },
  conditionPillText: {
    color: '#8b949e',
    fontSize: 13,
    fontWeight: '600',
  },
  conditionPillTextActive: {
    color: '#fff',
  },
  modalPricePreview: {
    color: '#28a745',
    fontSize: 16,
    fontWeight: '600',
    marginTop: 12,
    textAlign: 'center',
  },
  modalGradedPreview: {
    backgroundColor: 'rgba(255,215,0,0.08)',
    borderRadius: 8,
    padding: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,215,0,0.2)',
    marginTop: 8,
  },
  modalGradedLabel: {
    color: '#ffd700',
    fontSize: 12,
    textTransform: 'uppercase',
    marginBottom: 2,
  },
  modalGradedPrice: {
    color: '#fff',
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 2,
  },
  modalGradedMult: {
    color: '#8b949e',
    fontSize: 12,
  },
  confirmButton: {
    backgroundColor: '#e63946',
    paddingVertical: 16,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 8,
  },
  confirmButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
});
