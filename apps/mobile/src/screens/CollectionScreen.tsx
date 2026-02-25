import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
} from 'react-native';
import { getSets, getSetProgress, PokemonSet } from '../lib/api';

interface CollectionScreenProps {
  navigation: any;
}

export default function CollectionScreen({ navigation }: CollectionScreenProps) {
  const [sets, setSets] = useState<PokemonSet[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [progressMap, setProgressMap] = useState<Record<string, any>>({});

  const loadSets = async () => {
    try {
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

  const getProgressColor = (percentage: number) => {
    if (percentage >= 75) return '#28a745';
    if (percentage >= 25) return '#ffc107';
    return '#6c757d';
  };

  const renderSet = ({ item }: { item: PokemonSet }) => {
    const progress = progressMap[item.code];
    const percentage = progress?.percentage || 0;

    return (
      <TouchableOpacity
        style={styles.setCard}
        onPress={() => navigation.navigate('CollectionDetail', { code: item.code, name: item.name })}
      >
        <View style={styles.setHeader}>
          <View style={styles.setInfo}>
            <Text style={styles.setName}>{item.name}</Text>
            <Text style={styles.setYear}>{item.releaseYear}</Text>
          </View>
          <View style={styles.setCode}>
            <Text style={styles.setCodeText}>{item.code}</Text>
          </View>
        </View>

        <View style={styles.progressContainer}>
          <View style={styles.progressBar}>
            <View
              style={[
                styles.progressFill,
                { width: `${percentage}%`, backgroundColor: getProgressColor(percentage) },
              ]}
            />
          </View>
          <Text style={styles.progressText}>
            {progress ? `${progress.owned}/${progress.total}` : `0/${item.totalCards}`} ({percentage}%)
          </Text>
        </View>
      </TouchableOpacity>
    );
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <Text>Loading...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>My Collection</Text>

      <FlatList
        data={sets}
        keyExtractor={(item) => item.id}
        renderItem={renderSet}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        contentContainerStyle={styles.list}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    padding: 20,
    backgroundColor: '#fff',
  },
  list: {
    padding: 16,
  },
  setCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  setHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  setInfo: {
    flex: 1,
  },
  setName: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  setYear: {
    fontSize: 14,
    color: '#666',
  },
  setCode: {
    backgroundColor: '#f0f0f0',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  setCodeText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#666',
  },
  progressContainer: {
    gap: 8,
  },
  progressBar: {
    height: 8,
    backgroundColor: '#e9ecef',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 4,
  },
  progressText: {
    fontSize: 14,
    color: '#666',
  },
});
