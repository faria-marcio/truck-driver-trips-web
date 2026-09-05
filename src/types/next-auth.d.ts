import type { DefaultSession, DefaultUser } from 'next-auth';
import type { UserRole } from '@/types';

declare module 'next-auth' {
  interface Session {
    user: DefaultSession['user'] & {
      id: string;
      role: UserRole;
    };
    accessToken: string;
  }

  interface User extends DefaultUser {
    id: string;
    role: UserRole;
    accessToken: string;
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    id?: string;
    role?: UserRole;
    accessToken?: string;
  }
}
