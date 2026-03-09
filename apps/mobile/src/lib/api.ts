import * as Storage from './storage';

const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3003';

export interface Card {
  id: string;
  name: string;
  setName: string;
  setCode: string;
  cardNumber: string;
  rarity: string | null;
  imageUrl: string | null;
  currentPrice: number | null;
}

export interface PortfolioItem {
  id: string;
  quantity: number;
  condition: string;
  card: Card;
}

export interface PokemonSet {
  id: string;
  name: string;
  code: string;
  totalCards: number;
  releaseYear: number;
  imageUrl: string | null;
  cardCount?: number;
}

async function getHeaders(): Promise<HeadersInit> {
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
  };
  
  const token = await Storage.getToken();
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  
  return headers;
}

async function handleResponse<T>(response: Response): Promise<T> {
  if (response.status === 401) {
    await Storage.clearToken();
    throw new Error('UNAUTHORIZED');
  }
  
  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Unknown error' }));
    throw new Error(error.error || 'Request failed');
  }
  
  return response.json();
}

export async function login(email: string, password: string) {
  const response = await fetch(`${API_URL}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });
  
  const data = await handleResponse<{ token: string; user: any }>(response);
  await Storage.saveToken(data.token);
  return data;
}

export async function register(email: string, password: string, displayName: string) {
  const response = await fetch(`${API_URL}/api/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password, displayName }),
  });
  
  const data = await handleResponse<{ token: string; user: any }>(response);
  await Storage.saveToken(data.token);
  return data;
}

export async function loginWithGoogle(googleAccessToken: string) {
  const response = await fetch(`${API_URL}/api/auth/google/mobile`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ accessToken: googleAccessToken }),
  });

  const data = await handleResponse<{ token: string; user: any }>(response);
  await Storage.saveToken(data.token);
  return data;
}

export async function logout() {
  await Storage.clearToken();
}

export async function getUser() {
  const token = await Storage.getToken();
  if (!token) return null;
  
  try {
    const response = await fetch(`${API_URL}/api/users/me`, {
      headers: await getHeaders(),
    });
    
    if (response.status === 401) {
      await Storage.clearToken();
      return null;
    }
    
    return handleResponse(response);
  } catch (error) {
    return null;
  }
}

export async function searchCards(query: string): Promise<Card[]> {
  const response = await fetch(
    `${API_URL}/api/cards/search?q=${encodeURIComponent(query)}`,
    { headers: await getHeaders() }
  );
  
  const data = await handleResponse<{ results: Card[] }>(response);
  return data.results || [];
}

export async function scanCard(imageBase64: string): Promise<{ card: Card }> {
  const response = await fetch(`${API_URL}/api/scan`, {
    method: 'POST',
    headers: await getHeaders(),
    body: JSON.stringify({ imageBase64 }),
  });
  
  return handleResponse(response);
}

export async function getPortfolios() {
  const response = await fetch(`${API_URL}/api/portfolios`, {
    headers: await getHeaders(),
  });
  
  return handleResponse(response);
}

export async function getDefaultPortfolio() {
  const response = await fetch(`${API_URL}/api/portfolios/default`, {
    headers: await getHeaders(),
  });
  
  return handleResponse(response);
}

export async function addToPortfolio(
  portfolioId: string,
  cardId: string,
  condition: string,
  quantity: number,
  options?: {
    isGraded?: boolean;
    gradingService?: string;
    gradeValue?: number;
    valuationOverride?: number;
  }
) {
  const body: any = { cardId, condition, quantity };
  if (options?.isGraded) {
    body.isGraded = true;
    body.gradingService = options.gradingService;
    body.gradeValue = options.gradeValue;
    if (options.valuationOverride != null) {
      body.valuationOverride = options.valuationOverride;
    }
  }
  const response = await fetch(`${API_URL}/api/portfolios/${portfolioId}/items`, {
    method: 'POST',
    headers: await getHeaders(),
    body: JSON.stringify(body),
  });

  return handleResponse(response);
}

export async function removeFromPortfolio(portfolioId: string, itemId: string) {
  const response = await fetch(`${API_URL}/api/portfolios/${portfolioId}/items/${itemId}`, {
    method: 'DELETE',
    headers: await getHeaders(),
  });
  
  return handleResponse(response);
}

export async function getSets(): Promise<PokemonSet[]> {
  const response = await fetch(`${API_URL}/api/sets`, {
    headers: await getHeaders(),
  });
  
  const data = await handleResponse<{ sets: PokemonSet[] }>(response);
  return data.sets || [];
}

export async function getSetProgress(setCode: string) {
  const response = await fetch(`${API_URL}/api/sets/${setCode}/progress`, {
    headers: await getHeaders(),
  });
  
  return handleResponse(response);
}

export async function getSetDetails(setCode: string): Promise<SetDetails> {
  const response = await fetch(`${API_URL}/api/sets/${setCode}`, {
    headers: await getHeaders(),
  });
  
  return handleResponse(response);
}

export async function getCardDetails(cardId: string) {
  const response = await fetch(`${API_URL}/api/cards/${cardId}`, {
    headers: await getHeaders(),
  });
  
  return handleResponse(response);
}

export async function getWatchlist() {
  const response = await fetch(`${API_URL}/api/watchlist`, {
    headers: await getHeaders(),
  });
  
  return handleResponse(response);
}

export async function addToWatchlist(cardId: string) {
  const response = await fetch(`${API_URL}/api/watchlist`, {
    method: 'POST',
    headers: await getHeaders(),
    body: JSON.stringify({ cardId }),
  });
  
  return handleResponse(response);
}

export async function removeFromWatchlist(itemId: string) {
  const response = await fetch(`${API_URL}/api/watchlist/${itemId}`, {
    method: 'DELETE',
    headers: await getHeaders(),
  });
  
  return handleResponse(response);
}

interface SetDetails {
  set: PokemonSet;
  cards: Card[];
}
