import { create } from 'zustand';
import * as FileSystem from 'expo-file-system';
import { decode } from 'base64-arraybuffer';
import { supabase } from '../services/supabase';
import { triggerInstantNotification } from '../services/notifications';
import { useAuthStore } from './authStore';
import { useLeagueStore } from './leagueStore';

/** Shared uploader: posts/ or chat_media/ in the 'social' bucket. */
async function uploadToSocialStorage(
  uri: string,
  folder: 'posts' | 'chat_media',
  mimeType: string,
): Promise<string | null> {
  try {
    // Validate MIME type to prevent malicious file uploads
    const ALLOWED_MIME_TYPES = [
      'image/jpeg', 'image/png', 'image/webp', 'image/gif',
      'video/mp4', 'video/quicktime',
      'audio/mpeg', 'audio/mp3', 'audio/wav', 'audio/m4a', 'audio/x-m4a',
    ];
    
    const normalizedMime = mimeType.toLowerCase().split(';')[0].trim();
    if (!ALLOWED_MIME_TYPES.includes(normalizedMime)) {
      console.warn(`[SocialStore] Rejected upload with disallowed MIME type: ${normalizedMime}`);
      return null;
    }
    
    // Map MIME to safe extension
    const mimeToExt: Record<string, string> = {
      'image/jpeg': 'jpg', 'image/png': 'png', 'image/webp': 'webp', 'image/gif': 'gif',
      'video/mp4': 'mp4', 'video/quicktime': 'mov',
      'audio/mpeg': 'mp3', 'audio/mp3': 'mp3', 'audio/wav': 'wav',
      'audio/m4a': 'm4a', 'audio/x-m4a': 'm4a',
    };
    const extension = mimeToExt[normalizedMime] || 'jpg';
    
    const fileName = `${Date.now()}_${Math.random().toString(36).substring(7)}.${extension}`;
    const filePath = `${folder}/${fileName}`;

    const formData = new FormData();
    formData.append('file', { uri, name: fileName, type: mimeType } as any);

    const { error } = await supabase.storage.from('social').upload(filePath, formData, { upsert: false });
    if (error) throw error;

    const { data: urlData } = supabase.storage.from('social').getPublicUrl(filePath);
    return urlData.publicUrl;
  } catch (err) {
    console.warn(`[SocialStore] Error uploading to ${folder}:`, err);
    return null;
  }
}

let activeUnreadChannel: any = null;
let activeSocialChannel: any = null;

export interface Friend {
  id: string;
  user_id_1: string;
  user_id_2: string;
  status: 'pending' | 'accepted' | 'rejected';
  created_at: string;
  friend_profile?: {
    id: string;
    name: string;
    email: string;
    avatar_url: string;
    name_color?: string;
    is_pro?: boolean;
  };
}

export interface Challenge {
  id: string;
  creator_id: string;
  title: string;
  description: string;
  type: string;
  target_value: number;
  start_date: string;
  end_date: string;
  status: 'active' | 'completed' | 'cancelled';
  my_status?: 'pending' | 'completed' | 'surrendered';
}

export interface Post {
  id: string;
  user_id: string;
  content: string;
  image_url?: string;
  audio_url?: string;
  created_at: string;
  user_profile?: {
    name: string;
    avatar_url: string;
    name_color?: string;
    is_pro?: boolean;
  };
}

export interface RankedUser {
  id: string;
  name: string;
  avatar_url: string;
  name_color?: string;
  is_pro?: boolean;
  points: number;
  current_streak?: number;
}

export interface PostComment {
  id: string;
  post_id: string;
  user_id: string;
  content: string;
  created_at: string;
  is_edited?: boolean;
  user_profile?: {
    name: string;
    avatar_url: string;
    name_color?: string;
    is_pro?: boolean;
  };
}

export interface DirectMessage {
  id: string;
  sender_id: string;
  receiver_id: string;
  content: string;
  image_url?: string;
  audio_url?: string;
  created_at: string;
  is_read: boolean;
}

// ── Debounce helper ────────────────────────────────────────────────────────────
const debounceMap = new Map<string, ReturnType<typeof setTimeout>>();
function debounce(key: string, fn: () => void, ms = 300) {
  const prev = debounceMap.get(key);
  if (prev) clearTimeout(prev);
  debounceMap.set(key, setTimeout(() => {
    debounceMap.delete(key);
    fn();
  }, ms));
}

// ── Global ranking cache (5-minute TTL) ────────────────────────────────────────
let _rankingCacheTs = 0;
const RANKING_CACHE_TTL = 5 * 60 * 1000; // 5 min

interface SocialState {
  friends: Friend[];
  challenges: Challenge[];
  globalRanking: RankedUser[];
  posts: (Post & { likes_count: number; comments_count: number; is_liked: boolean })[];
  unreadCounts: Record<string, number>; // friendId -> count
  totalUnreadCount: number;
  isLoading: boolean;
  isPostsLoading: boolean;
  isRankingLoading: boolean;
  isFriendsLoading: boolean;
  isChallengesLoading: boolean;
  searchUsers: (query: string) => Promise<any[]>;
  fetchFriends: (userId: string) => Promise<void>;
  addFriend: (userId1: string, userId2: string) => Promise<void>;
  acceptFriend: (friendshipId: string) => Promise<void>;
  rejectFriend: (friendshipId: string) => Promise<void>;
  fetchChallenges: (userId: string) => Promise<void>;
  createChallenge: (challenge: Partial<Challenge>, participantIds: string[]) => Promise<void>;
  fetchChallengeParticipants: (challengeId: string) => Promise<any[]>;
  surrenderChallenge: (challengeId: string, userId: string) => Promise<void>;
  completeChallengeAndAwardPoints: (challengeId: string, userId: string) => Promise<void>;
  fetchGlobalRanking: (forceRefresh?: boolean) => Promise<void>;
  fetchPosts: () => Promise<void>;
  createPost: (post: Partial<Post>) => Promise<void>;
  deletePost: (postId: string) => Promise<void>;
  likePost: (postId: string, userId: string) => Promise<void>;
  unlikePost: (postId: string, userId: string) => Promise<void>;
  addComment: (postId: string, userId: string, content: string) => Promise<void>;
  deleteComment: (commentId: string) => Promise<void>;
  editComment: (commentId: string, content: string) => Promise<void>;
  fetchComments: (postId: string) => Promise<PostComment[]>;
  uploadPostImage: (uri: string) => Promise<string | null>;
  uploadPostVideo: (uri: string) => Promise<string | null>;
  uploadPostAudio: (uri: string) => Promise<string | null>;
  uploadChatImage: (uri: string) => Promise<string | null>;
  uploadChatVideo: (uri: string) => Promise<string | null>;
  uploadChatAudio: (uri: string) => Promise<string | null>;

  
  // Direct Messages
  fetchDirectMessages: (userId: string, friendId: string) => Promise<DirectMessage[]>;
  sendDirectMessage: (senderId: string, receiverId: string, content: string, image_url?: string, audio_url?: string) => Promise<void>;
  fetchUnreadCounts: (userId: string) => Promise<void>;
  markAsRead: (userId: string, friendId: string) => Promise<void>;
  subscribeToUnreadMessages: (userId: string) => () => void;
  subscribeToSocialEvents: (userId: string) => () => void;
  fetchSquadInvitations: (userId: string) => Promise<any[]>;
  
  reset: () => void;
}

export const useSocialStore = create<SocialState>((set, get) => ({
  friends: [],
  challenges: [],
  globalRanking: [],
  posts: [],
  isChallengesLoading: false,
  unreadCounts: {},
  totalUnreadCount: 0,
  isLoading: false,
  isPostsLoading: false,
  isRankingLoading: false,
  isFriendsLoading: false,

  fetchUnreadCounts: async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('direct_messages')
        .select('sender_id')
        .eq('receiver_id', userId)
        .eq('is_read', false);
        
      if (error) throw error;
      
      const counts: Record<string, number> = {};
      data.forEach(m => {
        counts[m.sender_id] = (counts[m.sender_id] || 0) + 1;
      });
      
      set({ 
        unreadCounts: counts,
        totalUnreadCount: data.length
      });
    } catch (err) {
      console.warn('[SocialStore] Error fetching unread counts:', err);
    }
  },

  markAsRead: async (userId: string, friendId: string) => {
    try {
      const { error } = await supabase
        .from('direct_messages')
        .update({ is_read: true })
        .eq('receiver_id', userId)
        .eq('sender_id', friendId)
        .eq('is_read', false);
        
      if (error) throw error;
      // Optimistic update instead of full re-fetch
      set(s => {
        const newCounts = { ...s.unreadCounts };
        const removed = newCounts[friendId] || 0;
        delete newCounts[friendId];
        return {
          unreadCounts: newCounts,
          totalUnreadCount: Math.max(0, s.totalUnreadCount - removed),
        };
      });
    } catch (err) {
      console.warn('[SocialStore] Error marking messages as read:', err);
    }
  },

  subscribeToUnreadMessages: (userId: string) => {
    if (activeUnreadChannel) {
      return () => {};
    }
    const uniqueSuffix = Math.random().toString(36).substring(7);
    activeUnreadChannel = supabase.channel(`unread_counts_${userId}_${uniqueSuffix}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'direct_messages',
          filter: `receiver_id=eq.${userId}`
        },
        (payload: any) => {
          // Debounce unread count refresh (multiple messages in burst)
          debounce(`unread_${userId}`, () => get().fetchUnreadCounts(userId), 400);
          
          if (payload.new && payload.new.sender_id) {
            const senderId = payload.new.sender_id;
            const content = payload.new.content;
            
            supabase
              .from('profiles')
              .select('name')
              .eq('id', senderId)
              .single()
              .then(({ data }) => {
                const senderName = data?.name || 'Alguien';
                const preview = content?.length > 60
                  ? content.substring(0, 60) + '…'
                  : (content || 'Nuevo mensaje');
                triggerInstantNotification(
                  `💬 Mensaje de ${senderName}`,
                  `"${preview}"`,
                  { senderId, type: 'direct_message' },
                  'messages'
                );
              });
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'direct_messages',
          filter: `receiver_id=eq.${userId}`
        },
        () => {
          debounce(`unread_${userId}`, () => get().fetchUnreadCounts(userId), 400);
        }
      )
      .subscribe();
      
    return () => {
      if (activeUnreadChannel) {
        supabase.removeChannel(activeUnreadChannel);
        activeUnreadChannel = null;
      }
    };
  },

  subscribeToSocialEvents: (userId: string) => {
    if (activeSocialChannel) {
      return () => {};
    }
    const uniqueSuffix = Math.random().toString(36).substring(7);
    activeSocialChannel = supabase.channel(`social_events_${userId}_${uniqueSuffix}`)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'posts' }, () => {
        // New post: full refresh needed to get profile joins
        debounce('posts_refresh', () => get().fetchPosts(), 600);
      })
      .on('postgres_changes', { event: 'DELETE', schema: 'public', table: 'posts' }, (payload: any) => {
        // Optimistic remove — no re-fetch needed
        if (payload.old?.id) {
          set(s => ({ posts: s.posts.filter(p => p.id !== payload.old.id) }));
        }
      })
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'post_comments' }, (payload: any) => {
        // Increment comments_count locally — no full re-fetch
        const postId = payload.new?.post_id;
        if (postId) {
          set(s => ({
            posts: s.posts.map(p =>
              p.id === postId ? { ...p, comments_count: p.comments_count + 1 } : p
            ),
          }));
        }
      })
      .on('postgres_changes', { event: 'DELETE', schema: 'public', table: 'post_comments' }, (payload: any) => {
        const postId = payload.old?.post_id;
        if (postId) {
          set(s => ({
            posts: s.posts.map(p =>
              p.id === postId ? { ...p, comments_count: Math.max(0, p.comments_count - 1) } : p
            ),
          }));
        }
      })
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'post_likes' }, (payload: any) => {
        // Increment likes_count locally — no full re-fetch
        const postId = payload.new?.post_id;
        const likerId = payload.new?.user_id;
        if (postId) {
          set(s => ({
            posts: s.posts.map(p => {
              if (p.id !== postId) return p;
              return {
                ...p,
                likes_count: p.likes_count + 1,
                // Mark as liked if the liker is the current user
                is_liked: p.is_liked || likerId === userId,
              };
            }),
          }));
        }
      })
      .on('postgres_changes', { event: 'DELETE', schema: 'public', table: 'post_likes' }, (payload: any) => {
        const postId = payload.old?.post_id;
        const likerId = payload.old?.user_id;
        if (postId) {
          set(s => ({
            posts: s.posts.map(p => {
              if (p.id !== postId) return p;
              return {
                ...p,
                likes_count: Math.max(0, p.likes_count - 1),
                is_liked: likerId === userId ? false : p.is_liked,
              };
            }),
          }));
        }
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'friends' }, (payload: any) => {
        debounce(`friends_refresh_${userId}`, () => get().fetchFriends(userId), 300);
        
        if (payload.eventType === 'INSERT') {
          if (payload.new && payload.new.user_id_2 === userId && payload.new.status === 'pending') {
            const senderId = payload.new.user_id_1;
            supabase
              .from('profiles')
              .select('name')
              .eq('id', senderId)
              .single()
              .then(({ data }) => {
                const senderName = data?.name || 'Alguien';
                triggerInstantNotification(
                  `👥 Solicitud de amistad`,
                  `${senderName} quiere conectar contigo en FitGO.`,
                  { senderId, type: 'friend_request' },
                  'social'
                );
              });
          }
        } else if (payload.eventType === 'UPDATE') {
          if (payload.new && payload.old && payload.new.status === 'accepted' && payload.old.status === 'pending') {
            if (payload.new.user_id_1 === userId) {
              const friendId = payload.new.user_id_2;
              supabase
                .from('profiles')
                .select('name')
                .eq('id', friendId)
                .single()
                .then(({ data }) => {
                  const friendName = data?.name || 'Tu amigo';
                  triggerInstantNotification(
                    `🤝 ¡Solicitud aceptada!`,
                    `${friendName} aceptó tu solicitud. ¡Ya pueden chatear!`,
                    { friendId, type: 'friend_accepted' },
                    'social'
                  );
                });
            }
          }
        }
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'challenges' }, () => {
        debounce(`challenges_refresh_${userId}`, () => get().fetchChallenges(userId), 400);
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'challenge_participants' }, () => {
        debounce(`challenges_refresh_${userId}`, () => get().fetchChallenges(userId), 400);
      })
      .subscribe();

    return () => {
      if (activeSocialChannel) {
        supabase.removeChannel(activeSocialChannel);
        activeSocialChannel = null;
      }
    };
  },

  searchUsers: async (query: string) => {
    try {
      const { data, error } = await supabase.rpc('search_users_by_email_or_id', { search_query: query });
      if (error) throw error;
      return data || [];
    } catch (err) {
      console.warn('[SocialStore] Error searching users:', err);
      return [];
    }
  },

  fetchFriends: async (userId: string) => {
    set({ isFriendsLoading: true });
    try {
      const { data, error } = await supabase
        .from('friends')
        .select(`*, user1:user_id_1(id, name, email, avatar_url, name_color, is_pro), user2:user_id_2(id, name, email, avatar_url, name_color, is_pro)`)
        .or(`user_id_1.eq.${userId},user_id_2.eq.${userId}`);
        
      if (error) throw error;

      const friendsList = (data || []).map(f => {
        const isUser1 = f.user_id_1 === userId;
        return {
          ...f,
          friend_profile: isUser1 ? f.user2 : f.user1
        };
      });

      set({ friends: friendsList });
    } catch (err) {
      console.warn('[SocialStore] Error fetching friends:', err);
    } finally {
      set({ isFriendsLoading: false });
    }
  },

  addFriend: async (userId1: string, userId2: string) => {
    try {
      const { error } = await supabase.from('friends').insert({ user_id_1: userId1, user_id_2: userId2, status: 'pending' });
      if (error) throw error;
      // Real-time subscription will trigger fetchFriends via debounce
    } catch (err) {
      console.warn('[SocialStore] Error adding friend:', err);
    }
  },

  acceptFriend: async (friendshipId: string) => {
    try {
      const { error } = await supabase.from('friends').update({ status: 'accepted' }).eq('id', friendshipId);
      if (error) throw error;
      // Optimistic local update – no round-trip needed
      set(s => ({
        friends: s.friends.map(f =>
          f.id === friendshipId ? { ...f, status: 'accepted' } : f
        ),
      }));
    } catch (err) {
      console.warn('[SocialStore] Error accepting friend:', err);
    }
  },

  rejectFriend: async (friendshipId: string) => {
    try {
      const { error } = await supabase.from('friends').delete().eq('id', friendshipId);
      if (error) throw error;
      // Optimistic local update
      set(s => ({ friends: s.friends.filter(f => f.id !== friendshipId) }));
    } catch (err) {
      console.warn('[SocialStore] Error rejecting friend:', err);
    }
  },

  fetchChallenges: async (userId: string) => {
    set({ isChallengesLoading: true });
    try {
      const { data: partData, error: partErr } = await supabase
        .from('challenge_participants')
        .select('challenge_id, status')
        .eq('user_id', userId);
      
      if (partErr) throw partErr;

      const challengeIds = (partData || []).map(p => p.challenge_id);
      
      let allChallenges: any[] = [];
      if (challengeIds.length > 0) {
        const { data, error } = await supabase
          .from('challenges')
          .select('*')
          .in('id', challengeIds);
        if (error) throw error;
        
        // Attach user's participant status to the challenge object
        allChallenges = (data || []).map(challenge => {
          const participantInfo = partData?.find(p => p.challenge_id === challenge.id);
          return {
            ...challenge,
            my_status: participantInfo?.status || 'pending'
          };
        });
      }

      set({ challenges: allChallenges });
    } catch (err) {
      console.warn('[SocialStore] Error fetching challenges:', err);
    } finally {
      set({ isChallengesLoading: false });
    }
  },

  createChallenge: async (challenge: Partial<Challenge>, participantIds: string[]) => {
    try {
      const { data, error } = await supabase.from('challenges').insert(challenge).select().single();
      if (error) throw error;

      if (data && participantIds.length > 0) {
        const participants = participantIds.map(uid => ({
          challenge_id: data.id,
          user_id: uid,
          status: 'pending'
        }));
        await supabase.from('challenge_participants').insert(participants);
      }
      
      // Real-time subscription handles re-fetch via debounce
    } catch (err) {
      console.warn('[SocialStore] Error creating challenge:', err);
    }
  },

  fetchChallengeParticipants: async (challengeId: string) => {
    try {
      const { data, error } = await supabase
        .from('challenge_participants')
        .select(`*, user_profile:user_id(id, name, avatar_url, name_color, is_pro)`)
        .eq('challenge_id', challengeId);
      if (error) throw error;
      return data || [];
    } catch (err) {
      console.warn('[SocialStore] Error fetching challenge participants:', err);
      return [];
    }
  },

  surrenderChallenge: async (challengeId: string, userId: string) => {
    try {
      const { error } = await supabase
        .from('challenge_participants')
        .update({ status: 'surrendered' })
        .eq('challenge_id', challengeId)
        .eq('user_id', userId);
      if (error) throw error;
      get().fetchChallenges(userId); // refresh
    } catch (err) {
      console.warn('[SocialStore] Error surrendering challenge:', err);
    }
  },

  completeChallengeAndAwardPoints: async (challengeId: string, userId: string) => {
    try {
      // Use atomic RPC to prevent race conditions (advisory lock ensures only one winner)
      const { data, error } = await supabase.rpc('complete_challenge_atomic', {
        p_challenge_id: challengeId,
        p_user_id: userId,
      });
      if (error) throw error;

      // Show reward animation if this user earned points
      if (data?.completed && data?.reward_points > 0) {
        const leagueStore = useLeagueStore.getState();
        leagueStore.showReward(data.reward_points);
      }

      get().fetchChallenges(userId); // refresh
    } catch (err) {
      console.warn('[SocialStore] Error completing challenge:', err);
    }
  },

  fetchGlobalRanking: async (forceRefresh = false) => {
    // Skip fetch if cache is still fresh (5 min TTL) and not forced
    if (!forceRefresh && Date.now() - _rankingCacheTs < RANKING_CACHE_TTL && get().globalRanking.length > 0) {
      return;
    }
    set({ isRankingLoading: true });
    try {
      // Use direct table fetch instead of slow legacy RPC
      const { data, error } = await supabase
        .from('users')
        .select('id, name, avatar_url, name_color, is_pro, league_points, current_streak, role')
        .not('name', 'is', null)
        .order('league_points', { ascending: false, nullsFirst: false })
        .limit(50);
        
      if (error) throw error;
      
      const mappedData = (data || []).map((u: any) => {
        const hasPremiumAccess = u.is_pro || ['owner', 'admin', 'super_admin'].includes(u.role);
        let validNameColor = u.name_color;
        
        // Si no tiene acceso premium, no puede usar colores premium (dorados)
        if (!hasPremiumAccess && validNameColor && (validNameColor.toUpperCase() === '#EAB308' || validNameColor.toUpperCase() === '#FFD700' || validNameColor.toUpperCase() === '#F59E0B')) {
          validNameColor = null;
        }
        
        // Si tiene acceso premium y no tiene color, dale el dorado por defecto
        if (hasPremiumAccess && (!validNameColor || validNameColor === '')) {
          validNameColor = '#EAB308';
        }

        return {
          id: u.id,
          name: u.name,
          avatar_url: u.avatar_url,
          points: u.league_points || 0,
          current_streak: u.current_streak || 0,
          role: u.role || 'user',
          name_color: validNameColor
        };
      });
      
      _rankingCacheTs = Date.now();
      set({ globalRanking: mappedData });
    } catch (err: any) {
      if (err?.message !== 'AbortError: Aborted' && err?.name !== 'AbortError') {
        console.warn('[SocialStore] Error fetching ranking:', err);
      }
    } finally {
      set({ isRankingLoading: false });
    }
  },

  fetchPosts: async () => {
    set({ isPostsLoading: true });
    try {
      // Read userId from cached auth state — avoids an extra getSession() network call
      const currentUserId = useAuthStore.getState().session?.user?.id;

      const { data, error } = await supabase
        .from('posts')
        .select(`
          *,
          user_profile:user_id(name, avatar_url, name_color, is_pro),
          likes:post_likes(user_id),
          comments:post_comments(id)
        `)
        .order('created_at', { ascending: false })
        .limit(30);  // Reduced from 50 → 30 for faster load
      
      if (error) {
        console.warn('[SocialStore] Query failed, trying fallback:', error.message);
        const { data: fallbackData, error: fallbackError } = await supabase
          .from('posts')
          .select(`*, user_profile:user_id(name, avatar_url, name_color, is_pro)`)
          .order('created_at', { ascending: false })
          .limit(30);
        
        if (fallbackError) throw fallbackError;

        const enrichedPosts = (fallbackData || []).map(p => ({
          ...p,
          likes_count: 0,
          comments_count: 0,
          is_liked: false
        }));
        set({ posts: enrichedPosts });
      } else {
        const enrichedPosts = (data || []).map(p => ({
          ...p,
          likes_count: p.likes?.length || 0,
          comments_count: p.comments?.length || 0,
          is_liked: p.likes?.some((l: any) => l.user_id === currentUserId) || false
        }));
        set({ posts: enrichedPosts });
      }
    } catch (err) {
      console.warn('[SocialStore] Critical error fetching posts:', err);
    } finally {
      set({ isPostsLoading: false });
    }
  },

  createPost: async (post: Partial<Post>) => {
    try {
      const { data, error } = await supabase.from('posts').insert(post).select(`
        *,
        user_profile:user_id(name, avatar_url, name_color, is_pro)
      `).single();
      if (error) throw error;
      // Optimistic prepend to avoid full list re-fetch
      if (data) {
        const newPost = { ...data, likes_count: 0, comments_count: 0, is_liked: false };
        set(s => ({ posts: [newPost, ...s.posts] }));
      }
    } catch (err) {
      console.warn('[SocialStore] Error creating post:', err);
    }
  },

  deletePost: async (postId: string) => {
    // Optimistic remove
    set(s => ({ posts: s.posts.filter(p => p.id !== postId) }));
    try {
      const { error } = await supabase.from('posts').delete().eq('id', postId);
      if (error) {
        // Revert on error by re-fetching
        get().fetchPosts();
        throw error;
      }
    } catch (err) {
      console.warn('[SocialStore] Error deleting post:', err);
    }
  },

  likePost: async (postId: string, userId: string) => {
    // Optimistic update
    set(s => ({
      posts: s.posts.map(p =>
        p.id === postId
          ? { ...p, likes_count: p.likes_count + 1, is_liked: true }
          : p
      ),
    }));
    try {
      const { error } = await supabase.from('post_likes').insert({ post_id: postId, user_id: userId });
      if (error) {
        // Revert
        set(s => ({
          posts: s.posts.map(p =>
            p.id === postId
              ? { ...p, likes_count: Math.max(0, p.likes_count - 1), is_liked: false }
              : p
          ),
        }));
        throw error;
      }
    } catch (err) {
      console.warn('[SocialStore] Error liking post:', err);
    }
  },

  unlikePost: async (postId: string, userId: string) => {
    // Optimistic update
    set(s => ({
      posts: s.posts.map(p =>
        p.id === postId
          ? { ...p, likes_count: Math.max(0, p.likes_count - 1), is_liked: false }
          : p
      ),
    }));
    try {
      const { error } = await supabase.from('post_likes').delete().eq('post_id', postId).eq('user_id', userId);
      if (error) {
        // Revert
        set(s => ({
          posts: s.posts.map(p =>
            p.id === postId
              ? { ...p, likes_count: p.likes_count + 1, is_liked: true }
              : p
          ),
        }));
        throw error;
      }
    } catch (err) {
      console.warn('[SocialStore] Error unliking post:', err);
    }
  },

  addComment: async (postId: string, userId: string, content: string) => {
    try {
      const { error } = await supabase.from('post_comments').insert({ post_id: postId, user_id: userId, content });
      if (error) throw error;
      // Optimistically bump comments_count
      set(s => ({
        posts: s.posts.map(p =>
          p.id === postId ? { ...p, comments_count: p.comments_count + 1 } : p
        ),
      }));
    } catch (err) {
      console.warn('[SocialStore] Error adding comment:', err);
    }
  },

  deleteComment: async (commentId: string) => {
    try {
      const { error } = await supabase.from('post_comments').delete().eq('id', commentId);
      if (error) throw error;
    } catch (err) {
      console.warn('[SocialStore] Error deleting comment:', err);
    }
  },

  editComment: async (commentId: string, content: string) => {
    try {
      const { error } = await supabase
        .from('post_comments')
        .update({ content, is_edited: true })
        .eq('id', commentId);
      if (error) throw error;
    } catch (err) {
      console.warn('[SocialStore] Error editing comment:', err);
    }
  },

  fetchComments: async (postId: string) => {
    try {
      const { data, error } = await supabase
        .from('post_comments')
        .select('*, user_profile:user_id(name, avatar_url, name_color, is_pro)')
        .eq('post_id', postId)
        .order('created_at', { ascending: true });
      
      if (error) throw error;
      return data || [];
    } catch (err) {
      console.warn('[SocialStore] Error fetching comments:', err);
      return [];
    }
  },

  uploadPostImage: (uri: string) => uploadToSocialStorage(uri, 'posts', 'image/jpeg'),
  uploadPostVideo: (uri: string) => uploadToSocialStorage(uri, 'posts', 'video/mp4'),
  uploadPostAudio: (uri: string) => {
    const ext = uri.includes('.') ? uri.split('.').pop()?.split('?')[0] : '';
    const safeExt = (ext && ext.length <= 4 && !ext.includes(':')) ? ext : 'mp3';
    return uploadToSocialStorage(uri, 'posts', `audio/${safeExt}`);
  },
  uploadChatImage: (uri: string) => uploadToSocialStorage(uri, 'chat_media', 'image/jpeg'),
  uploadChatVideo: (uri: string) => uploadToSocialStorage(uri, 'chat_media', 'video/mp4'),
  uploadChatAudio: (uri: string) => {
    const ext = uri.includes('.') ? uri.split('.').pop()?.split('?')[0] : '';
    const safeExt = (ext && ext.length <= 4 && !ext.includes(':')) ? ext : 'mp3';
    return uploadToSocialStorage(uri, 'chat_media', `audio/${safeExt}`);
  },


  fetchDirectMessages: async (userId: string, friendId: string) => {
    try {
      const { data, error } = await supabase
        .from('direct_messages')
        .select('*')
        .or(`and(sender_id.eq.${userId},receiver_id.eq.${friendId}),and(sender_id.eq.${friendId},receiver_id.eq.${userId})`)
        .order('created_at', { ascending: true })
        .limit(100);  // Safety limit
        
      if (error) throw error;
      return data || [];
    } catch (err) {
      console.warn('[SocialStore] Error fetching direct messages:', err);
      return [];
    }
  },

  sendDirectMessage: async (senderId: string, receiverId: string, content: string, image_url?: string, audio_url?: string) => {
    try {
      const { error } = await supabase
        .from('direct_messages')
        .insert({ sender_id: senderId, receiver_id: receiverId, content, image_url, audio_url });
        
      if (error) throw error;
    } catch (err) {
      console.warn('[SocialStore] Error sending direct message:', err);
    }
  },

  fetchSquadInvitations: async (userId: string) => {
    try {
      // NOTE: We filter by a universal pattern that is always appended to squad invitation
      // messages regardless of language. The pattern '#INV-' is a stable code prefix.
      // Old Spanish-only filter `.ilike('content', '%código de invitación:%')` was a bug.
      const { data, error } = await supabase
        .from('direct_messages')
        .select('*, sender:sender_id(id, name, avatar_url, name_color, is_pro)')
        .eq('receiver_id', userId)
        .or('content.ilike.%#INV-%,content.ilike.%código de invitación:%,content.ilike.%invite code:%,content.ilike.%invitation code:%,content.ilike.%squad invite:%')
        .order('created_at', { ascending: false });
        
      if (error) throw error;
      return data || [];
    } catch (err) {
      console.warn('[SocialStore] Error fetching squad invitations:', err);
      return [];
    }
  },

  reset: () => {
    // Limpiar canales realtime globales para evitar que queden
    // vivos tras un logout/cambio de cuenta.
    if (activeUnreadChannel) {
      supabase.removeChannel(activeUnreadChannel);
      activeUnreadChannel = null;
    }
    if (activeSocialChannel) {
      supabase.removeChannel(activeSocialChannel);
      activeSocialChannel = null;
    }

    set({
      friends: [],
      challenges: [],
      globalRanking: [],
      posts: [],
      isLoading: false,
      isPostsLoading: false,
      isRankingLoading: false,
      isFriendsLoading: false,
      isChallengesLoading: false,
      unreadCounts: {},
      totalUnreadCount: 0,
    });
  }
}));
