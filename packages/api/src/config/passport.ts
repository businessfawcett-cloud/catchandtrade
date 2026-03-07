import passport from 'passport';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import { Strategy as AppleStrategy } from 'passport-apple';
import { prisma } from '@catchandtrade/db';
import bcrypt from 'bcrypt';

interface Profile {
  id: string;
  displayName?: string;
  emails?: Array<{ value: string }>;
  photos?: Array<{ value: string }>;
}

interface AppleProfile {
  id: string;
  email?: string;
  name?: {
    fullName?: string;
  };
}

const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID || '';
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET || '';
const APPLE_CLIENT_ID = process.env.APPLE_CLIENT_ID || '';
const APPLE_TEAM_ID = process.env.APPLE_TEAM_ID || '';
const APPLE_KEY_ID = process.env.APPLE_KEY_ID || '';
const APPLE_PRIVATE_KEY = process.env.APPLE_PRIVATE_KEY || '';

const API_URL = process.env.API_URL || (process.env.NODE_ENV === 'production' ? 'https://api.catchandtrade.com' : 'http://localhost:4000');

passport.serializeUser((user, done) => {
  done(null, user);
});

passport.deserializeUser(async (id: string, done) => {
  try {
    const user = await prisma.user.findUnique({ where: { id } });
    done(null, user);
  } catch (error) {
    done(error);
  }
});

if (GOOGLE_CLIENT_ID && GOOGLE_CLIENT_SECRET) {
  passport.use(
    new GoogleStrategy(
      {
        clientID: GOOGLE_CLIENT_ID,
        clientSecret: GOOGLE_CLIENT_SECRET,
        callbackURL: `${API_URL}/api/auth/google/callback`
      },
      async (accessToken: string, refreshToken: string, profile: Profile, done: (err: Error | null, user?: any) => void) => {
        try {
          let user = await prisma.user.findUnique({
            where: { googleId: profile.id }
          });

          if (!user) {
            const email = profile.emails?.[0]?.value;
            if (email) {
              user = await prisma.user.findUnique({ where: { email } });
              if (user) {
                user = await prisma.user.update({
                  where: { id: user.id },
                  data: { googleId: profile.id }
                });
              }
            }

            if (!user) {
              user = await prisma.user.create({
                data: {
                  googleId: profile.id,
                  email: email || `google_${profile.id}@noemail.local`,
                  displayName: profile.displayName || 'Google User',
                  avatarUrl: profile.photos?.[0]?.value
                }
              });
              await prisma.portfolio.create({
                data: {
                  userId: user.id,
                  name: 'My Portfolio'
                }
              });
            }
          }

          return done(null, user);
        } catch (error) {
          return done(error as Error);
        }
      }
    )
  );
}

if (APPLE_CLIENT_ID) {
  passport.use(
    new AppleStrategy(
      {
        clientID: APPLE_CLIENT_ID,
        teamID: APPLE_TEAM_ID,
        keyID: APPLE_KEY_ID,
        privateKeyLocation: APPLE_PRIVATE_KEY,
        callbackURL: `${API_URL}/api/auth/apple/callback`
      },
      async (accessToken: string, refreshToken: string, idToken: string, profile: AppleProfile, done: (err: Error | null, user?: any) => void) => {
        try {
          let user = await prisma.user.findUnique({
            where: { appleId: profile.id }
          });

          if (!user) {
            const email = profile.email || `apple_${profile.id}@noemail.local`;
            user = await prisma.user.findUnique({ where: { email } });
            
            if (user) {
              user = await prisma.user.update({
                where: { id: user.id },
                data: { appleId: profile.id }
              });
            } else {
              user = await prisma.user.create({
                data: {
                  appleId: profile.id,
                  email,
                  displayName: profile.name?.fullName || 'Apple User'
                }
              });
              await prisma.portfolio.create({
                data: {
                  userId: user.id,
                  name: 'My Portfolio'
                }
              });
            }
          }

          return done(null, user);
        } catch (error) {
          return done(error as Error);
        }
      }
    )
  );
}

export default passport;
