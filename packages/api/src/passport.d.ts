declare module 'passport-google-oauth20' {
  import passport from 'passport';

  export interface Profile {
    id: string;
    displayName?: string;
    emails?: Array<{ value: string }>;
    photos?: Array<{ value: string }>;
  }

  export interface StrategyOptions {
    clientID: string;
    clientSecret: string;
    callbackURL: string;
  }

  export class Strategy implements passport.Strategy {
    name: string = 'google';
    constructor(options: StrategyOptions, verify: (
      accessToken: string,
      refreshToken: string,
      profile: Profile,
      done: (error: Error | null, user?: any) => void
    ) => void);
    authenticate(req: any): void;
  }
}

declare module 'passport-apple' {
  import passport from 'passport';

  export interface Profile {
    id: string;
    email?: string;
    name?: {
      fullName?: string;
    };
  }

  export interface StrategyOptions {
    clientID: string;
    teamID: string;
    keyID: string;
    privateKeyLocation?: string;
    privateKeyString?: string;
    callbackURL: string;
  }

  export class Strategy implements passport.Strategy {
    name: string = 'apple';
    constructor(options: StrategyOptions, verify: (
      accessToken: string,
      refreshToken: string,
      idToken: string,
      profile: Profile,
      done: (error: Error | null, user?: any) => void
    ) => void);
    authenticate(req: any): void;
  }
}
