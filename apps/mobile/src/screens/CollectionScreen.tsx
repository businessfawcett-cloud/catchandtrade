import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SectionList,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { getSets, getSetProgress, PokemonSet } from '../lib/api';
import * as Storage from '../lib/storage';

interface CollectionScreenProps {
  navigation: any;
}

interface YearSection {
  title: string;
  data: PokemonSet[];
}

export default function CollectionScreen({ navigation }: CollectionScreenProps) {
  const [sets, setSets] = useState<PokemonSet[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [progressMap, setProgressMap] = useState<Record<string, any>>({});
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  const loadSets = async () => {
    try {
      const token = await Storage.getToken();
      setIsLoggedIn(!!token);
      const data = await getSets();
      setSets(data);
    } catch (error) {
      console.error('Failed to load sets:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const loadProgress = async () => {
    const token = await Storage.getToken();
    if (!token) return;

    const progress: Record<string, any> = {};
    for (const set of sets) {
      try {
        const data = await getSetProgress(set.code);
        progress[set.code] = data.progress;
      } catch (error) {
        // Skip sets that fail
      }
    }
    setProgressMap(progress);
  };

  useEffect(() => {
    loadSets();
  }, []);

  useEffect(() => {
    if (sets.length > 0) {
      loadProgress();
    }
  }, [sets]);

  const onRefresh = () => {
    setRefreshing(true);
    loadSets();
  };

  const sections: YearSection[] = useMemo(() => {
    const grouped: Record<number, PokemonSet[]> = {};
    for (const set of sets) {
      const year = set.releaseYear;
      if (!grouped[year]) grouped[year] = [];
      grouped[year].push(set);
    }
    return Object.keys(grouped)
      .map(Number)
      .sort((a, b) => b - a)
      .map((year) => ({
        title: String(year),
        data: grouped[year],
      }));
  }, [sets]);

  const getEraColor = (year: number): string => {
    if (year >= 2020) return '#e63946';
    if (year >= 2010) return '#ffd700';
    return '#9b59b6';
  };

  const getProgressColor = (percentage: number): string => {
    if (percentage === 0) return '#e63946';
    if (percentage >= 100) return '#28a745';
    return '#ffd700';
  };

  const renderSectionHeader = ({ section }: { section: YearSection }) => (
    <View style={styles.sectionHeader}>
      <Text style={styles.sectionTitle}>{section.title}</Text>
      <View style={styles.sectionLine} />
    </View>
  );

  const renderSet = ({ item }: { item: PokemonSet }) => {
    const progress = progressMap[item.code];
    const percentage = progress?.percentage || 0;
    const year = item.releaseYear;

    return (
      <TouchableOpacity
        style={styles.setCard}
        activeOpacity={0.7}
        onPress={() =>
          navigation.navigate('CollectionDetail', {
            setCode: item.code,
            setName: item.name,
          })
        }
      >
        <View style={[styles.accentBar, { backgroundColor: getEraColor(year) }]} />
        <View style={styles.setContent}>
          <View style={styles.setHeader}>
            <Text style={styles.setName} numberOfLines={2}>
              {item.name}
            </Text>
            <Text style={styles.cardCount}>
              {item.cardCount ?? item.totalCards} cards
            </Text>
          </View>

          {isLoggedIn && (
            <View style={styles.progressContainer}>
              <View style={styles.progressBar}>
                <View
                  style={[
                    styles.progressFill,
                    {
                      width: `${percentage}%`,
                      backgroundColor: getProgressColor(percentage),
                    },
                  ]}
                />
              </View>
              <Text style={styles.progressText}>
                {progress
                  ? `${progress.owned}/${progress.total}`
                  : `0/${item.totalCards}`}{' '}
                ({percentage}%)
              </Text>
            </View>
          )}
        </View>
      </TouchableOpacity>
    );
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#e63946" />
        <Text style={styles.loadingText}>Loading sets...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.headerContainer}>
        <Text style={styles.title}>Pokemon Card Sets</Text>
      </View>

      <SectionList
        sections={sections}
        keyExtractor={(item) => item.id}
        renderItem={renderSet}
        renderSectionHeader={renderSectionHeader}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor="#e63946"
            colors={['#e63946']}
          />
        }
        contentContainerStyle={styles.list}
        stickySectionHeadersEnabled={false}
      />
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
    backgroundColor: '#0d1117',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: '#8b949e',
    fontSize: 16,
    marginTop: 12,
  },
  headerContainer: {
    backgroundColor: '#161b22',
    paddingTop: 56,
    paddingBottom: 20,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#21262d',
  },
  title: {
    fontSize: 26,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  list: {
    paddingHorizontal: 16,
    paddingBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 24,
    marginBottom: 12,
    paddingHorizontal: 4,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#ffd700',
    marginRight: 12,
  },
  sectionLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#30363d',
  },
  setCard: {
    backgroundColor: '#161b22',
    borderRadius: 12,
    marginBottom: 10,
    flexDirection: 'row',
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#21262d',
  },
  accentBar: {
    width: 4,
  },
  setContent: {
    flex: 1,
    padding: 16,
  },
  setHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  setName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#ffffff',
    flex: 1,
    marginRight: 12,
  },
  cardCount: {
    fontSize: 13,
    color: '#8b949e',
    fontWeight: '600',
  },
  progressContainer: {
    gap: 6,
  },
  progressBar: {
    height: 6,
    backgroundColor: '#21262d',
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 3,
  },
  progressText: {
    fontSize: 12,
    color: '#8b949e',
  },
});
