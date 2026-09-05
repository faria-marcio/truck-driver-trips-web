import type { NextAuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import { api, getApiErrorMessage } from '@/lib/api';
import type { ApiResponse, AuthResponse } from '@/types';

function extractAuthPayload(data: AuthResponse | ApiResponse<AuthResponse>): AuthResponse {
  if ('token' in data && 'user' in data) {
    return data;
  }

  if (data.data) {
    return data.data;
  }

  throw new Error(data.error ?? data.message ?? 'Authentication failed');
}

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        email: { label: 'Email', type: 'email', placeholder: 'driver@example.com' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error('Email and password are required');
        }

        try {
          const response = await api.post<AuthResponse | ApiResponse<AuthResponse>>('/api/auth/login', {
            email: credentials.email,
            password: credentials.password,
          });

          const { token, user } = extractAuthPayload(response.data);

          return {
            id: user.id,
            email: user.email,
            name: user.name,
            role: user.role,
            accessToken: token,
          };
        } catch (error: unknown) {
          throw new Error(getApiErrorMessage(error, 'Authentication failed'));
        }
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = user.role;
        token.accessToken = user.accessToken;
      }

      return token;
    },
    async session({ session, token }) {
      if (session.user && token.id && token.role && token.accessToken) {
        session.user.id = token.id;
        session.user.role = token.role;
        session.accessToken = token.accessToken;
      }

      return session;
    },
  },
  pages: {
    signIn: '/auth/login',
    error: '/auth/error',
  },
  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60,
  },
  secret: process.env.NEXTAUTH_SECRET,
};
