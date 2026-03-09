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
} from 'react-native';
import * as WebBrowser from 'expo-web-browser';
import * as Google from 'expo-auth-session/providers/google';
import { getUser, logout, login, register, loginWithGoogle } from '../lib/api';

WebBrowser.maybeCompleteAuthSession();

const COLORS = {
  background: '#0d1117',
  card: '#161b22',
  inputBg: '#1a2332',
  textPrimary: '#ffffff',
  textSecondary: '#8b949e',
  red: '#e63946',
  gold: '#ffd700',
  border: 'rgba(255,255,255,0.1)',
};

const GOOGLE_CLIENT_ID = process.env.EXPO_PUBLIC_GOOGLE_CLIENT_ID || '';

export default function ProfileScreen() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [emailFocused, setEmailFocused] = useState(false);
  const [passwordFocused, setPasswordFocused] = useState(false);
  const [nameFocused, setNameFocused] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  const [request, response, promptAsync] = Google.useAuthRequest({
    expoClientId: GOOGLE_CLIENT_ID,
    androidClientId: GOOGLE_CLIENT_ID,
    iosClientId: GOOGLE_CLIENT_ID,
    webClientId: GOOGLE_CLIENT_ID,
  });

  useEffect(() => {
    checkUser();
  }, []);

  useEffect(() => {
    if (response?.type === 'success') {
      const { authentication } = response;
      if (authentication?.accessToken) {
        handleGoogleLogin(authentication.accessToken);
      }
    }
  }, [response]);

  const handleGoogleLogin = async (accessToken: string) => {
    setGoogleLoading(true);
    try {
      await loginWithGoogle(accessToken);
      await checkUser();
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Google sign-in failed');
    } finally {
      setGoogleLoading(false);
    }
  };

  const checkUser = async () => {
    try {
      const userData = await getUser();
      setUser(userData);
    } catch (error) {
      // Not logged in
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    if (!email || !password) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    if (!isLogin && !displayName) {
      Alert.alert('Error', 'Please enter your name');
      return;
    }

    setSubmitting(true);
    try {
      if (isLogin) {
        await login(email, password);
      } else {
        await register(email, password, displayName);
      }
      await checkUser();
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Authentication failed');
    } finally {
      setSubmitting(false);
    }
  };

  const handleLogout = async () => {
    await logout();
    setUser(null);
    setEmail('');
    setPassword('');
    setDisplayName('');
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS.red} />
      </View>
    );
  }

  // --- Logged In View ---
  if (user) {
    const initial = user.displayName?.charAt(0).toUpperCase() || '?';
    const memberSince = user.createdAt
      ? new Date(user.createdAt).toLocaleDateString('en-US', {
          year: 'numeric',
          month: 'long',
          day: 'numeric',
        })
      : null;

    return (
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Profile Header */}
        <View style={styles.profileHeader}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{initial}</Text>
          </View>
          <Text style={styles.displayName}>{user.displayName}</Text>
          {user.username ? (
            <Text style={styles.username}>@{user.username}</Text>
          ) : (
            <TouchableOpacity>
              <Text style={styles.setupUsername}>Set up username</Text>
            </TouchableOpacity>
          )}
          <Text style={styles.email}>{user.email}</Text>
          {memberSince && (
            <Text style={styles.memberSince}>Member since {memberSince}</Text>
          )}
        </View>

        {/* Stats Section */}
        {user.stats && (
          <View style={styles.statsCard}>
            <Text style={styles.statsTitle}>Collection Stats</Text>
            <View style={styles.statsRow}>
              {user.stats.totalCards != null && (
                <View style={styles.statItem}>
                  <Text style={styles.statValue}>{user.stats.totalCards}</Text>
                  <Text style={styles.statLabel}>Cards</Text>
                </View>
              )}
              {user.stats.totalValue != null && (
                <View style={styles.statItem}>
                  <Text style={styles.statValue}>
                    ${user.stats.totalValue.toLocaleString()}
                  </Text>
                  <Text style={styles.statLabel}>Value</Text>
                </View>
              )}
              {user.stats.trades != null && (
                <View style={styles.statItem}>
                  <Text style={styles.statValue}>{user.stats.trades}</Text>
                  <Text style={styles.statLabel}>Trades</Text>
                </View>
              )}
            </View>
          </View>
        )}

        {/* Action Buttons */}
        <View style={styles.actionButtons}>
          <TouchableOpacity style={styles.editProfileButton}>
            <Text style={styles.editProfileButtonText}>Edit Profile</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
            <Text style={styles.logoutButtonText}>Logout</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    );
  }

  // --- Logged Out View ---
  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.scrollContent}
      keyboardShouldPersistTaps="handled"
    >
      {/* Logo / Title Area */}
      <View style={styles.logoArea}>
        <Text style={styles.logoTitle}>Catch & Trade</Text>
        <Text style={styles.logoSubtitle}>
          Your ultimate card collection manager
        </Text>
      </View>

      {/* Auth Card */}
      <View style={styles.authCard}>
        {/* Toggle Tabs */}
        <View style={styles.tabRow}>
          <TouchableOpacity
            style={styles.tab}
            onPress={() => setIsLogin(true)}
          >
            <Text
              style={[styles.tabText, isLogin && styles.tabTextActive]}
            >
              Login
            </Text>
            {isLogin && <View style={styles.tabUnderline} />}
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.tab}
            onPress={() => setIsLogin(false)}
          >
            <Text
              style={[styles.tabText, !isLogin && styles.tabTextActive]}
            >
              Register
            </Text>
            {!isLogin && <View style={styles.tabUnderline} />}
          </TouchableOpacity>
        </View>

        {/* Form */}
        <View style={styles.form}>
          <TextInput
            style={[
              styles.input,
              emailFocused && styles.inputFocused,
            ]}
            value={email}
            onChangeText={setEmail}
            placeholder="Email"
            placeholderTextColor={COLORS.textSecondary}
            keyboardType="email-address"
            autoCapitalize="none"
            onFocus={() => setEmailFocused(true)}
            onBlur={() => setEmailFocused(false)}
          />

          <TextInput
            style={[
              styles.input,
              passwordFocused && styles.inputFocused,
            ]}
            value={password}
            onChangeText={setPassword}
            placeholder="Password"
            placeholderTextColor={COLORS.textSecondary}
            secureTextEntry
            onFocus={() => setPasswordFocused(true)}
            onBlur={() => setPasswordFocused(false)}
          />

          {!isLogin && (
            <TextInput
              style={[
                styles.input,
                nameFocused && styles.inputFocused,
              ]}
              value={displayName}
              onChangeText={setDisplayName}
              placeholder="Display Name"
              placeholderTextColor={COLORS.textSecondary}
              autoCapitalize="words"
              onFocus={() => setNameFocused(true)}
              onBlur={() => setNameFocused(false)}
            />
          )}

          <TouchableOpacity
            style={[
              styles.submitButton,
              submitting && styles.submitButtonDisabled,
            ]}
            onPress={handleSubmit}
            disabled={submitting}
            activeOpacity={0.8}
          >
            {submitting ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.submitButtonText}>
                {isLogin ? 'Login' : 'Register'}
              </Text>
            )}
          </TouchableOpacity>

          {/* Divider */}
          <View style={styles.dividerRow}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>or</Text>
            <View style={styles.dividerLine} />
          </View>

          {/* Google Sign-In */}
          <TouchableOpacity
            style={styles.googleButton}
            onPress={() => promptAsync()}
            disabled={!request || googleLoading}
            activeOpacity={0.8}
          >
            {googleLoading ? (
              <ActivityIndicator color="#000" />
            ) : (
              <>
                <Text style={styles.googleIcon}>G</Text>
                <Text style={styles.googleButtonText}>
                  Sign in with Google
                </Text>
              </>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.switchButton}
            onPress={() => setIsLogin(!isLogin)}
          >
            <Text style={styles.switchButtonText}>
              {isLogin
                ? "Don't have an account? "
                : 'Already have an account? '}
              <Text style={styles.switchButtonHighlight}>
                {isLogin ? 'Register' : 'Login'}
              </Text>
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  // --- Layout ---
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: 40,
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: COLORS.background,
    justifyContent: 'center',
    alignItems: 'center',
  },

  // --- Logged Out: Logo ---
  logoArea: {
    alignItems: 'center',
    paddingTop: 60,
    paddingBottom: 30,
  },
  logoTitle: {
    fontSize: 32,
    fontWeight: 'bold',
    color: COLORS.textPrimary,
    letterSpacing: 1,
  },
  logoSubtitle: {
    fontSize: 14,
    color: COLORS.textSecondary,
    marginTop: 8,
  },

  // --- Logged Out: Auth Card ---
  authCard: {
    backgroundColor: COLORS.card,
    marginHorizontal: 20,
    borderRadius: 16,
    overflow: 'hidden',
  },
  tabRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 16,
    position: 'relative',
  },
  tabText: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.textSecondary,
  },
  tabTextActive: {
    color: COLORS.textPrimary,
  },
  tabUnderline: {
    position: 'absolute',
    bottom: 0,
    left: '25%',
    right: '25%',
    height: 3,
    backgroundColor: COLORS.red,
    borderTopLeftRadius: 2,
    borderTopRightRadius: 2,
  },

  // --- Logged Out: Form ---
  form: {
    padding: 24,
  },
  input: {
    backgroundColor: COLORS.inputBg,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 10,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    color: COLORS.textPrimary,
    marginBottom: 16,
  },
  inputFocused: {
    borderColor: COLORS.red,
  },
  submitButton: {
    backgroundColor: COLORS.red,
    paddingVertical: 16,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 4,
  },
  submitButtonDisabled: {
    opacity: 0.6,
  },
  submitButtonText: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 20,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: COLORS.border,
  },
  dividerText: {
    color: COLORS.textSecondary,
    fontSize: 13,
    marginHorizontal: 12,
  },
  googleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#ffffff',
    paddingVertical: 14,
    borderRadius: 10,
    gap: 10,
  },
  googleIcon: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#4285F4',
  },
  googleButtonText: {
    color: '#1f1f1f',
    fontSize: 16,
    fontWeight: '600',
  },
  switchButton: {
    paddingVertical: 18,
    alignItems: 'center',
  },
  switchButtonText: {
    color: COLORS.textSecondary,
    fontSize: 14,
  },
  switchButtonHighlight: {
    color: COLORS.red,
    fontWeight: '600',
  },

  // --- Logged In: Profile Header ---
  profileHeader: {
    alignItems: 'center',
    paddingTop: 50,
    paddingBottom: 24,
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
    backgroundColor: '#1a73e8',
    // Simulated gradient via layered background -- RN doesn't support CSS gradients
    // For a true gradient, use expo-linear-gradient or react-native-linear-gradient
  },
  avatarText: {
    fontSize: 42,
    color: '#ffffff',
    fontWeight: 'bold',
  },
  displayName: {
    fontSize: 26,
    fontWeight: 'bold',
    color: COLORS.textPrimary,
    marginBottom: 4,
  },
  username: {
    fontSize: 16,
    color: COLORS.gold,
    marginBottom: 4,
  },
  setupUsername: {
    fontSize: 16,
    color: COLORS.gold,
    textDecorationLine: 'underline',
    marginBottom: 4,
  },
  email: {
    fontSize: 14,
    color: COLORS.textSecondary,
    marginBottom: 4,
  },
  memberSince: {
    fontSize: 13,
    color: COLORS.textSecondary,
    marginTop: 4,
  },

  // --- Logged In: Stats ---
  statsCard: {
    backgroundColor: COLORS.card,
    marginHorizontal: 20,
    borderRadius: 14,
    padding: 20,
    marginTop: 16,
  },
  statsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.textPrimary,
    marginBottom: 16,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: 22,
    fontWeight: 'bold',
    color: COLORS.textPrimary,
  },
  statLabel: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginTop: 4,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },

  // --- Logged In: Actions ---
  actionButtons: {
    paddingHorizontal: 20,
    marginTop: 28,
    gap: 12,
  },
  editProfileButton: {
    borderWidth: 1,
    borderColor: COLORS.textSecondary,
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: 'center',
  },
  editProfileButtonText: {
    color: COLORS.textPrimary,
    fontSize: 16,
    fontWeight: '600',
  },
  logoutButton: {
    borderWidth: 1,
    borderColor: COLORS.red,
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: 'center',
  },
  logoutButtonText: {
    color: COLORS.red,
    fontSize: 16,
    fontWeight: '600',
  },
});
