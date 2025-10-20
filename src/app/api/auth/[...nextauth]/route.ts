import { supabase } from '@/lib/supabase'
import NextAuth, { NextAuthOptions } from 'next-auth'
import CredentialsProvider from 'next-auth/providers/credentials'

/**
 * NextAuth configuration with Supabase integration
 * Handles authentication and role management with caching
 */
export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null
        }

        try {
          // Authenticate with Supabase
          const { data, error } = await supabase.auth.signInWithPassword({
            email: credentials.email,
            password: credentials.password,
          })

          if (error || !data.user) {
            return null
          }

          // Fetch user role from database
          const { data: userData } = await supabase
            .from('users')
            .select('role, username, bio, avatar_url, reputation_points, created_at')
            .eq('id', data.user.id)
            .single()

          console.log('NextAuth - User data from DB:', userData);
          console.log('NextAuth - User role:', userData?.role);

          return {
            id: data.user.id,
            email: data.user.email,
            name: userData?.username || data.user.email,
            username: userData?.username,
            role: userData?.role || 'newcomer',
            bio: userData?.bio,
            avatar_url: userData?.avatar_url,
            reputation_points: userData?.reputation_points,
            created_at: userData?.created_at,
            image: data.user.user_metadata?.avatar_url,
          }
        } catch (error) {
          console.error('Auth error:', error)
          return null
        }
      }
    })
  ],
  callbacks: {
    async jwt({ token, user, trigger }) {
      // Store role and username in JWT token for caching
      if (user) {
        token.role = user.role
        token.username = user.username
        token.id = user.id
        token.lastRoleCheck = Date.now()
      }
      
      // Refresh role from database if token is older than 1 hour
      // or if this is a session update trigger
      const shouldRefreshRole = trigger === 'update' || 
        !token.lastRoleCheck || 
        (Date.now() - token.lastRoleCheck) > 60 * 60 * 1000 // 1 hour
      
      if (shouldRefreshRole && token.id) {
        try {
          const { data: userData } = await supabase
            .from('users')
            .select('role, username')
            .eq('id', token.id)
            .single()
          
          if (userData) {
            console.log('NextAuth JWT - Refreshing role:', userData.role);
            token.role = userData.role
            token.username = userData.username
            token.lastRoleCheck = Date.now()
          }
        } catch (error) {
          console.error('Error refreshing role:', error)
        }
      }
      
      return token
    },
    async session({ session, token }) {
      // Add role and username to session object
      if (token) {
        console.log('NextAuth Session - Token role:', token.role);
        session.user.id = token.id as string
        session.user.role = token.role as string
        session.user.username = token.username as string
        console.log('NextAuth Session - Final session role:', session.user.role);
      }
      return session
    }
  },
  pages: {
    signIn: '/login',
  },
  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  secret: process.env.NEXTAUTH_SECRET,
}

const handler = NextAuth(authOptions)
export { handler as GET, handler as POST }
