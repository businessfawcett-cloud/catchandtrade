jest.mock('expo-secure-store', () => ({
  getAsync: jest.fn(() => Promise.resolve(null)),
  setAsync: jest.fn(() => Promise.resolve()),
  deleteAsync: jest.fn(() => Promise.resolve()),
}));

jest.mock('expo-auth-session', () => ({
  startAsync: jest.fn(() => Promise.resolve({ type: 'success' })),
  makeRedirectUri: jest.fn(() => 'myapp://oauth'),
}));

jest.mock('@react-navigation/native', () => {
  const actualNav = jest.requireActual('@react-navigation/native');
  return {
    ...actualNav,
    useNavigation: () => ({
      navigate: jest.fn(),
      goBack: jest.fn(),
    }),
    useRoute: () => ({
      params: {},
    }),
  };
});
