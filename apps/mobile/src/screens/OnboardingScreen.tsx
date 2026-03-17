import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ScrollView,
  Alert,
  ActivityIndicator,
  Switch,
  Image,
} from 'react-native';
import { getUser, updateProfile } from '../lib/api';

const AVATARS = [
  { id: '1', pokemon: 'bulbasaur', img: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/1.png' },
  { id: '4', pokemon: 'charmander', img: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/4.png' },
  { id: '7', pokemon: 'squirtle', img: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/7.png' },
  { id: '25', pokemon: 'pikachu', img: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/25.png' },
  { id: '39', pokemon: 'jigglypuff', img: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/39.png' },
  { id: '52', pokemon: 'meowth', img: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/52.png' },
  { id: '54', pokemon: 'psyduck', img: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/54.png' },
  { id: '94', pokemon: 'gengar', img: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/94.png' },
  { id: '131', pokemon: 'lapras', img: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/131.png' },
  { id: '133', pokemon: 'eevee', img: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/133.png' },
  { id: '143', pokemon: 'snorlax', img: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/143.png' },
  { id: '150', pokemon: 'mewtwo', img: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/150.png' },
];

const COUNTRIES = [
  'United States', 'Canada', 'United Kingdom', 'Australia', 'Germany',
  'France', 'Japan', 'Brazil', 'Mexico', 'Spain', 'Italy', 'Netherlands'
];

interface OnboardingScreenProps {
  navigation: any;
}

export default function OnboardingScreen({ navigation }: OnboardingScreenProps) {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  
  const [displayName, setDisplayName] = useState('');
  const [username, setUsername] = useState('');
  const [usernameAvailable, setUsernameAvailable] = useState<boolean | null>(null);
  const [checkingUsername, setCheckingUsername] = useState(false);
  const [avatarId, setAvatarId] = useState('');
  const [country, setCountry] = useState('');
  const [isPublic, setIsPublic] = useState(true);

  const checkUsername = async (value: string) => {
    if (!value || value.length < 3) {
      setUsernameAvailable(null);
      return;
    }
    setCheckingUsername(true);
    try {
      const response = await fetch(`${process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3003'}/api/users/check-username?u=${encodeURIComponent(value)}`);
      const data = await response.json();
      setUsernameAvailable(data.available);
    } catch (err) {
      setUsernameAvailable(null);
    } finally {
      setCheckingUsername(false);
    }
  };

  const handleUsernameChange = (value: string) => {
    const cleaned = value.toLowerCase().replace(/[^a-z0-9]/g, '').slice(0, 25);
    setUsername(cleaned);
    setUsernameAvailable(null);
    if (cleaned.length >= 3) {
      checkUsername(cleaned);
    }
  };

  const handleContinue = () => {
    setError('');
    
    if (step === 1) {
      if (!username || username.length < 3) {
        setError('Please choose a username (at least 3 characters)');
        return;
      }
      if (!usernameAvailable) {
        setError('Please choose an available username');
        return;
      }
      setStep(2);
    } else if (step === 2) {
      if (!avatarId) {
        setError('Please choose a starter Pokemon');
        return;
      }
      setStep(3);
    }
  };

  const handleComplete = async () => {
    if (!country) {
      setError('Please select your country');
      return;
    }

    setSaving(true);
    setError('');

    try {
      await updateProfile({
        username,
        displayName: displayName || null,
        avatarId,
        isPublic,
        hideCollectionValue: false,
        country,
        twitterHandle: null,
        instagramHandle: null,
        tiktokHandle: null,
      });
      navigation.reset({
        index: 0,
        routes: [{ name: 'Main' }],
      });
    } catch (err: any) {
      setError(err.message || 'Failed to save profile');
    } finally {
      setSaving(false);
    }
  };

  const renderStepIndicator = () => (
    <View style={styles.stepIndicator}>
      {[1, 2, 3].map((s) => (
        <View
          key={s}
          style={[
            styles.stepDot,
            step === s && styles.stepDotActive,
            step > s && styles.stepDotComplete,
          ]}
        />
      ))}
    </View>
  );

  return (
    <View style={styles.container}>
      {renderStepIndicator()}

      {error ? (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      ) : null}

      <ScrollView style={styles.content} contentContainerStyle={styles.contentContainer}>
        {step === 1 && (
          <>
            <Text style={styles.title}>Welcome to Catch & Trade</Text>
            <Text style={styles.subtitle}>Set up your trainer profile</Text>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>
                Display Name <Text style={styles.optional}>(optional)</Text>
              </Text>
              <TextInput
                style={styles.input}
                value={displayName}
                onChangeText={(text) => setDisplayName(text.slice(0, 25))}
                maxLength={25}
                placeholder="How you want to be called"
                placeholderTextColor="#666"
              />
              <Text style={styles.charCount}>{displayName.length}/25</Text>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Username <Text style={styles.required}>*</Text></Text>
              <View style={styles.usernameInputContainer}>
                <TextInput
                  style={styles.usernameInput}
                  value={username}
                  onChangeText={handleUsernameChange}
                  placeholder="your-username"
                  placeholderTextColor="#666"
                  autoCapitalize="none"
                  autoCorrect={false}
                />
                {checkingUsername ? (
                  <ActivityIndicator size="small" color="#666" style={styles.usernameStatus} />
                ) : usernameAvailable === true ? (
                  <Text style={styles.usernameAvailable}>✓</Text>
                ) : usernameAvailable === false ? (
                  <Text style={styles.usernameTaken}>✕</Text>
                ) : null}
              </View>
              <Text style={styles.usernameHint}>At least 3 characters</Text>
            </View>
          </>
        )}

        {step === 2 && (
          <>
            <Text style={styles.title}>Choose Your Starter</Text>
            <Text style={styles.subtitle}>Pick a Pokemon to represent you</Text>

            <View style={styles.avatarGrid}>
              {AVATARS.map((avatar) => (
                <TouchableOpacity
                  key={avatar.id}
                  style={[
                    styles.avatarOption,
                    avatarId === avatar.id && styles.avatarOptionSelected,
                  ]}
                  onPress={() => setAvatarId(avatar.id)}
                >
                  <Image source={{ uri: avatar.img }} style={styles.avatarImage} />
                  <Text style={styles.avatarName}>{avatar.pokemon}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </>
        )}

        {step === 3 && (
          <>
            <Text style={styles.title}>Almost Done</Text>
            <Text style={styles.subtitle}>Tell us a bit about yourself</Text>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Country <Text style={styles.required}>*</Text></Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.countryScroll}>
                <View style={styles.countryOptions}>
                  {COUNTRIES.map((c) => (
                    <TouchableOpacity
                      key={c}
                      style={[
                        styles.countryChip,
                        country === c && styles.countryChipSelected,
                      ]}
                      onPress={() => setCountry(c)}
                    >
                      <Text style={[
                        styles.countryChipText,
                        country === c && styles.countryChipTextSelected,
                      ]}>{c}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </ScrollView>
            </View>

            <View style={styles.switchRow}>
              <View style={styles.switchLabel}>
                <Text style={styles.switchTitle}>Public Profile</Text>
                <Text style={styles.switchDescription}>Allow others to view your collection</Text>
              </View>
              <Switch
                value={isPublic}
                onValueChange={setIsPublic}
                trackColor={{ false: '#767577', true: '#81b0ff' }}
                thumbColor={isPublic ? '#0066cc' : '#f4f3f4'}
              />
            </View>
          </>
        )}
      </ScrollView>

      <View style={styles.footer}>
        {step > 1 && (
          <TouchableOpacity style={styles.backButton} onPress={() => setStep(step - 1)}>
            <Text style={styles.backButtonText}>Back</Text>
          </TouchableOpacity>
        )}
        
        <TouchableOpacity
          style={styles.continueButton}
          onPress={step === 3 ? handleComplete : handleContinue}
          disabled={saving}
        >
          {saving ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.continueButtonText}>
              {step === 3 ? 'Complete Setup' : 'Continue'}
            </Text>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0a0f1e',
  },
  stepIndicator: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 12,
    paddingTop: 60,
    paddingBottom: 20,
  },
  stepDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#374151',
  },
  stepDotActive: {
    backgroundColor: '#e63946',
    width: 24,
  },
  stepDotComplete: {
    backgroundColor: '#22c55e',
  },
  errorContainer: {
    marginHorizontal: 20,
    marginBottom: 10,
    padding: 12,
    backgroundColor: 'rgba(239,68,68,0.1)',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(239,68,68,0.3)',
  },
  errorText: {
    color: '#ef4444',
    fontSize: 14,
    textAlign: 'center',
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: 20,
    paddingBottom: 100,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.5)',
    textAlign: 'center',
    marginBottom: 32,
  },
  inputGroup: {
    marginBottom: 24,
  },
  label: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
  },
  optional: {
    color: 'rgba(255,255,255,0.5)',
    fontWeight: 'normal',
  },
  required: {
    color: '#ef4444',
  },
  input: {
    backgroundColor: '#1a2332',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    borderRadius: 8,
    padding: 14,
    fontSize: 16,
    color: '#fff',
  },
  charCount: {
    color: 'rgba(255,255,255,0.5)',
    fontSize: 12,
    textAlign: 'right',
    marginTop: 4,
  },
  usernameInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  usernameInput: {
    flex: 1,
    backgroundColor: '#1a2332',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    borderRadius: 8,
    padding: 14,
    fontSize: 16,
    color: '#fff',
  },
  usernameStatus: {
    position: 'absolute',
    right: 14,
  },
  usernameAvailable: {
    position: 'absolute',
    right: 14,
    color: '#22c55e',
    fontSize: 16,
    fontWeight: 'bold',
  },
  usernameTaken: {
    position: 'absolute',
    right: 14,
    color: '#ef4444',
    fontSize: 16,
    fontWeight: 'bold',
  },
  usernameHint: {
    color: 'rgba(255,255,255,0.5)',
    fontSize: 12,
    marginTop: 4,
  },
  avatarGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 12,
  },
  avatarOption: {
    width: 90,
    height: 110,
    backgroundColor: '#1a2332',
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  avatarOptionSelected: {
    borderColor: '#e63946',
    backgroundColor: 'rgba(230,57,70,0.1)',
  },
  avatarImage: {
    width: 64,
    height: 64,
  },
  avatarName: {
    color: '#fff',
    fontSize: 11,
    marginTop: 4,
    textTransform: 'capitalize',
  },
  countryScroll: {
    marginHorizontal: -20,
    paddingHorizontal: 20,
  },
  countryOptions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  countryChip: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: '#1a2332',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  countryChipSelected: {
    backgroundColor: '#0066cc',
    borderColor: '#0066cc',
  },
  countryChipText: {
    color: '#fff',
    fontSize: 14,
  },
  countryChipTextSelected: {
    fontWeight: 'bold',
  },
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#1a2332',
    borderRadius: 12,
    padding: 16,
    marginTop: 16,
  },
  switchLabel: {
    flex: 1,
    marginRight: 16,
  },
  switchTitle: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  switchDescription: {
    color: 'rgba(255,255,255,0.5)',
    fontSize: 14,
    marginTop: 2,
  },
  footer: {
    flexDirection: 'row',
    padding: 20,
    paddingBottom: 40,
    gap: 12,
    backgroundColor: '#0a0f1e',
  },
  backButton: {
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  backButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  continueButton: {
    flex: 1,
    backgroundColor: '#e63946',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  continueButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});
