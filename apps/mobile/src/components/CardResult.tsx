import React from 'react';
import { View, Text, Image, TouchableOpacity, StyleSheet } from 'react-native';
import { Card } from '../lib/api';

interface CardResultProps {
  card: Card;
  condition: string;
  quantity: number;
  onConditionChange: (condition: string) => void;
  onQuantityChange: (quantity: number) => void;
  onAddToPortfolio: () => void;
  onScanAnother: () => void;
  adding?: boolean;
  added?: boolean;
}

const CONDITIONS = [
  'MINT',
  'NEAR_MINT',
  'LIGHTLY_PLAYED',
  'MODERATELY_PLAYED',
  'HEAVILY_PLAYED',
  'DAMAGED',
];

const CONDITION_LABELS: Record<string, string> = {
  MINT: 'Mint',
  NEAR_MINT: 'Near Mint',
  LIGHTLY_PLAYED: 'Lightly Played',
  MODERATELY_PLAYED: 'Moderately Played',
  HEAVILY_PLAYED: 'Heavily Played',
  DAMAGED: 'Damaged',
};

const getRarityColor = (rarity: string | null): string => {
  if (!rarity) return '#888';
  if (rarity.includes('Holo') || rarity.includes('Rare')) return '#FF6B6B';
  if (rarity.includes('Uncommon')) return '#4ECDC4';
  return '#95A5A6';
};

export default function CardResult({
  card,
  condition,
  quantity,
  onConditionChange,
  onQuantityChange,
  onAddToPortfolio,
  onScanAnother,
  adding = false,
  added = false,
}: CardResultProps) {
  return (
    <View style={styles.container}>
      {added ? (
        <View style={styles.successContainer}>
          <View style={styles.successIcon}>
            <Text style={styles.successCheck}>✓</Text>
          </View>
          <Text style={styles.successText}>Added to Portfolio!</Text>
        </View>
      ) : (
        <>
          <View style={styles.cardInfo}>
            {card.imageUrl && (
              <Image source={{ uri: card.imageUrl }} style={styles.cardImage} />
            )}
            <Text style={styles.cardName}>{card.name}</Text>
            <Text style={styles.cardSet}>
              {card.setName} #{card.cardNumber}
            </Text>
            {card.rarity && (
              <View style={[styles.rarityBadge, { backgroundColor: getRarityColor(card.rarity) }]}>
                <Text style={styles.rarityText}>{card.rarity}</Text>
              </View>
            )}
            {card.currentPrice && (
              <Text style={styles.price}>${card.currentPrice.toFixed(2)}</Text>
            )}
          </View>

          <View style={styles.divider} />

          <View style={styles.conditionSection}>
            <Text style={styles.sectionLabel}>Condition</Text>
            <View style={styles.conditionScroll}>
              {CONDITIONS.map((c) => (
                <TouchableOpacity
                  key={c}
                  style={[
                    styles.conditionPill,
                    condition === c && styles.conditionPillSelected,
                  ]}
                  onPress={() => onConditionChange(c)}
                >
                  <Text
                    style={[
                      styles.conditionPillText,
                      condition === c && styles.conditionPillTextSelected,
                    ]}
                  >
                    {CONDITION_LABELS[c]}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <View style={styles.quantitySection}>
            <Text style={styles.sectionLabel}>Quantity</Text>
            <View style={styles.quantityControl}>
              <TouchableOpacity
                style={styles.quantityButton}
                onPress={() => onQuantityChange(Math.max(1, quantity - 1))}
              >
                <Text style={styles.quantityButtonText}>-</Text>
              </TouchableOpacity>
              <Text style={styles.quantityValue}>{quantity}</Text>
              <TouchableOpacity
                style={styles.quantityButton}
                onPress={() => onQuantityChange(quantity + 1)}
              >
                <Text style={styles.quantityButtonText}>+</Text>
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.buttons}>
            <TouchableOpacity
              style={[styles.addButton, adding && styles.addButtonDisabled]}
              onPress={onAddToPortfolio}
              disabled={adding}
            >
              <Text style={styles.addButtonText}>
                {adding ? 'Adding...' : 'Add to Portfolio'}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.scanAnotherButton} onPress={onScanAnother}>
              <Text style={styles.scanAnotherButtonText}>Scan Another</Text>
            </TouchableOpacity>
          </View>
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
  },
  successContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  successIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#28a745',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  successCheck: {
    fontSize: 40,
    color: '#fff',
  },
  successText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#28a745',
  },
  cardInfo: {
    alignItems: 'center',
    marginBottom: 16,
  },
  cardImage: {
    width: 200,
    height: 280,
    resizeMode: 'contain',
    marginBottom: 12,
  },
  cardName: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 4,
  },
  cardSet: {
    fontSize: 16,
    color: '#666',
    marginBottom: 8,
  },
  rarityBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    marginBottom: 8,
  },
  rarityText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  price: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#28a745',
  },
  divider: {
    height: 1,
    backgroundColor: '#eee',
    marginVertical: 16,
  },
  conditionSection: {
    marginBottom: 16,
  },
  sectionLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  conditionScroll: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  conditionPill: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 16,
    backgroundColor: '#f0f0f0',
    borderWidth: 1,
    borderColor: '#ddd',
  },
  conditionPillSelected: {
    backgroundColor: '#0066cc',
    borderColor: '#0066cc',
  },
  conditionPillText: {
    fontSize: 12,
    color: '#333',
  },
  conditionPillTextSelected: {
    color: '#fff',
  },
  quantitySection: {
    marginBottom: 24,
  },
  quantityControl: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  quantityButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  quantityButtonText: {
    fontSize: 24,
    color: '#333',
  },
  quantityValue: {
    fontSize: 20,
    fontWeight: 'bold',
    minWidth: 40,
    textAlign: 'center',
  },
  buttons: {
    gap: 12,
  },
  addButton: {
    backgroundColor: '#28a745',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  addButtonDisabled: {
    opacity: 0.6,
  },
  addButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  scanAnotherButton: {
    paddingVertical: 16,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#0066cc',
    alignItems: 'center',
  },
  scanAnotherButtonText: {
    color: '#0066cc',
    fontSize: 16,
    fontWeight: '600',
  },
});
