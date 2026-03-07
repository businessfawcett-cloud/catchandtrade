import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
} from 'react-native';

const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:4000';

interface GradingResult {
  cardName: string;
  rawPrice: number;
  expectedGrade: number;
  service: string;
  tier: string;
  gradedValue: number;
  gradingFee: number;
  netProfit: number;
  roi: number;
  turnaround: string;
  verdict: 'strong' | 'marginal' | 'skip';
  verdictText: string;
  verdictColor: 'green' | 'yellow' | 'red';
}

interface GradingCalculatorProps {
  cardId: string;
  cardName: string;
}

const GRADING_FEES = {
  PSA: { economy: 40, standard: 75, express: 150 },
  CGC: { economy: 14, standard: 25, express: 75 },
  BGS: { economy: 35, standard: 75, express: 150 },
  SGC: { economy: 19, standard: 39, express: 79 },
};

const services = ['PSA', 'CGC', 'BGS', 'SGC'] as const;
const tiers = ['economy', 'standard', 'express'] as const;
const grades = [10, 9, 8, 7, 6] as const;

type GradingService = typeof services[number];
type GradingTier = typeof tiers[number];
type Grade = typeof grades[number];

const tierLabels: Record<GradingTier, string> = {
  economy: 'Economy',
  standard: 'Standard',
  express: 'Express',
};

const serviceColors: Record<GradingService, string> = {
  PSA: '#e63946',
  CGC: '#3b82f6',
  BGS: '#eab308',
  SGC: '#22c55e',
};

export default function GradingCalculator({ cardId, cardName }: GradingCalculatorProps) {
  const [selectedService, setSelectedService] = useState<GradingService>('PSA');
  const [selectedTier, setSelectedTier] = useState<GradingTier>('economy');
  const [selectedGrade, setSelectedGrade] = useState<Grade>(9);
  const [result, setResult] = useState<GradingResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const calculateROI = async () => {
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const response = await fetch(`${API_URL}/api/grading/calculate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          cardId,
          expectedGrade: selectedGrade,
          service: selectedService,
          tier: selectedTier,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || 'Failed to calculate');
        return;
      }

      setResult(data);
    } catch (err) {
      setError('Failed to connect to server');
    } finally {
      setLoading(false);
    }
  };

  const getVerdictBgColor = (color: string) => {
    switch (color) {
      case 'green':
        return '#22c55e20';
      case 'yellow':
        return '#eab30820';
      case 'red':
        return '#ef444420';
      default:
        return '#6b728020';
    }
  };

  const getVerdictTextColor = (color: string) => {
    switch (color) {
      case 'green':
        return '#22c55e';
      case 'yellow':
        return '#eab308';
      case 'red':
        return '#ef4444';
      default:
        return '#9ca3af';
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Is This Worth Grading?</Text>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.row}>
        {services.map((service) => (
          <TouchableOpacity
            key={service}
            onPress={() => setSelectedService(service)}
            style={[
              styles.pill,
              selectedService === service && { backgroundColor: serviceColors[service] },
            ]}
          >
            <Text
              style={[
                styles.pillText,
                selectedService === service && { color: '#fff' },
              ]}
            >
              {service}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.row}>
        {tiers.map((tier) => (
          <TouchableOpacity
            key={tier}
            onPress={() => setSelectedTier(tier)}
            style={[
              styles.pill,
              selectedTier === tier && styles.pillSelected,
            ]}
          >
            <Text
              style={[
                styles.pillText,
                selectedTier === tier && { color: '#000' },
              ]}
            >
              {tierLabels[tier]} (${GRADING_FEES[selectedService][tier]})
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.row}>
        {grades.map((grade) => (
          <TouchableOpacity
            key={grade}
            onPress={() => setSelectedGrade(grade)}
            style={[
              styles.pill,
              selectedGrade === grade && styles.pillSelected,
            ]}
          >
            <Text
              style={[
                styles.pillText,
                selectedGrade === grade && { color: '#000' },
              ]}
            >
              {grade}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <TouchableOpacity
        onPress={calculateROI}
        disabled={loading}
        style={[styles.button, loading && styles.buttonDisabled]}
      >
        {loading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.buttonText}>Calculate ROI</Text>
        )}
      </TouchableOpacity>

      {error && (
        <Text style={styles.error}>{error}</Text>
      )}

      {result && (
        <View style={styles.result}>
          <View style={styles.resultRow}>
            <Text style={styles.resultLabel}>Raw value:</Text>
            <Text style={styles.resultValue}>${result.rawPrice.toFixed(2)}</Text>
          </View>
          <View style={styles.resultRow}>
            <Text style={styles.resultLabel}>Grading fee:</Text>
            <Text style={styles.resultValueNegative}>-${result.gradingFee.toFixed(2)}</Text>
          </View>
          <View style={styles.resultRow}>
            <Text style={styles.resultLabel}>Est. graded value:</Text>
            <Text style={styles.resultValue}>${result.gradedValue.toFixed(2)}</Text>
          </View>
          <View style={styles.divider} />
          <View style={styles.resultRow}>
            <Text style={styles.resultLabel}>Net profit:</Text>
            <Text style={result.netProfit >= 0 ? styles.resultValuePositive : styles.resultValueNegative}>
              {result.netProfit >= 0 ? '+' : ''}${result.netProfit.toFixed(2)}
            </Text>
          </View>
          <View style={styles.resultRow}>
            <Text style={styles.resultLabel}>ROI:</Text>
            <Text style={result.roi >= 0 ? styles.resultValuePositive : styles.resultValueNegative}>
              {result.roi.toFixed(1)}%
            </Text>
          </View>
          <View style={styles.resultRow}>
            <Text style={styles.resultLabel}>Est. turnaround:</Text>
            <Text style={styles.resultValue}>{result.turnaround}</Text>
          </View>

          <View style={[styles.verdict, { backgroundColor: getVerdictBgColor(result.verdictColor) }]}>
            <Text style={[styles.verdictText, { color: getVerdictTextColor(result.verdictColor) }]}>
              {result.verdictText}
            </Text>
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginTop: 20,
    padding: 16,
    backgroundColor: '#1a1a2e',
    borderRadius: 12,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 16,
  },
  row: {
    marginBottom: 12,
  },
  pill: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#2d2d44',
    marginRight: 8,
  },
  pillSelected: {
    backgroundColor: '#ffd700',
  },
  pillText: {
    color: '#9ca3af',
    fontSize: 14,
    fontWeight: '600',
  },
  button: {
    backgroundColor: '#e63946',
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 8,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  error: {
    color: '#ef4444',
    fontSize: 14,
    marginTop: 8,
    textAlign: 'center',
  },
  result: {
    marginTop: 16,
    padding: 12,
    backgroundColor: '#0f0f1a',
    borderRadius: 8,
  },
  resultRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  resultLabel: {
    color: '#9ca3af',
    fontSize: 14,
  },
  resultValue: {
    color: '#fff',
    fontSize: 14,
  },
  resultValuePositive: {
    color: '#22c55e',
    fontSize: 14,
    fontWeight: '600',
  },
  resultValueNegative: {
    color: '#ef4444',
    fontSize: 14,
    fontWeight: '600',
  },
  divider: {
    height: 1,
    backgroundColor: '#374151',
    marginVertical: 8,
  },
  verdict: {
    marginTop: 12,
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  verdictText: {
    fontSize: 14,
    fontWeight: 'bold',
  },
});
