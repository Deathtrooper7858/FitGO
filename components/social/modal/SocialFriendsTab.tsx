import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, ActivityIndicator } from 'react-native';
import { Image } from 'expo-image';
import { Search, Plus, Check, X, Trash2, MessageSquare } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Radius } from '../../../constants';
import { GlassCard } from '../../../components/GlassCard';

interface SocialFriendsTabProps {
  profile: any;
  socialStore: any;
  colors: any;
  t: any;
  getNameStyle: any;
  premiumColor?: string;
  searchQuery: string;
  searchResults: any[];
  isSearching: boolean;
  onSearchQueryChange: (text: string) => void;
  onSearch: () => void;
  onAddFriend: (userId: string) => void;
  onAcceptFriend: (friendshipId: string) => void;
  onRejectFriend: (friendshipId: string) => void;
  onUserPress: (user: any) => void;
  onChat: (friend: any) => void;
}

export default function SocialFriendsTab({
  profile, socialStore, colors, t, getNameStyle, premiumColor,
  searchQuery, searchResults, isSearching,
  onSearchQueryChange, onSearch, onAddFriend,
  onAcceptFriend, onRejectFriend, onUserPress, onChat,
}: SocialFriendsTabProps) {
  const receivedRequests = socialStore.friends.filter((f: any) => f.status === 'pending' && f.user_id_2 === profile?.id);
  const sentRequests = socialStore.friends.filter((f: any) => f.status === 'pending' && f.user_id_1 === profile?.id);
  const acceptedFriends = socialStore.friends.filter((f: any) => f.status === 'accepted');

  return (
    <View style={s.tabContent}>
      <GlassCard accentColor={colors.primary} style={{ marginBottom: 20 }}>
        <Text style={[s.sectionTitle, { color: colors.textPrimary }]}>{t('social.friends.addFriends')}</Text>
        <View style={[s.searchBar, { backgroundColor: colors.surfaceAlt }]}>
          <Search size={20} color={colors.textSecondary} />
          <TextInput
            style={[s.searchInput, { color: colors.textPrimary }]}
            placeholder={t('social.friends.searchPlaceholder')}
            placeholderTextColor={colors.textMuted}
            value={searchQuery}
            onChangeText={onSearchQueryChange}
            onSubmitEditing={onSearch}
          />
          <TouchableOpacity onPress={onSearch}>
            <Text style={{ color: colors.primary, fontWeight: '700' }}>{t('social.friends.searchBtn')}</Text>
          </TouchableOpacity>
        </View>
        {isSearching && <ActivityIndicator color={colors.primary} style={{ marginVertical: 10 }} />}
        {searchResults.map((user: any) => (
          <View key={user.id} style={[s.userRow, { borderBottomColor: colors.border + '33' }]}>
            <TouchableOpacity style={s.userInfo} onPress={() => onUserPress(user)}>
              {user.avatar_url ? (
                <Image cachePolicy="memory-disk" source={{ uri: user.avatar_url }} style={s.avatar} />
              ) : (
                <View style={[s.avatarPlaceholder, { backgroundColor: colors.primary }]}>
                  <Text style={s.avatarInitials}>{user.name?.[0]}</Text>
                </View>
              )}
              <View>
                <Text style={[s.userName, getNameStyle(user.name_color, user.id, profile?.id, profile?.nameColor)]}>{user.name}</Text>
                <Text style={{ color: colors.textMuted, fontSize: 12 }}>{user.email}</Text>
              </View>
            </TouchableOpacity>
            <TouchableOpacity style={[s.actionBtn, { backgroundColor: colors.primary }]} onPress={() => onAddFriend(user.id)}>
              <Plus size={16} color="#fff" />
              <Text style={s.actionBtnText}>{t('social.friends.sendRequest')}</Text>
            </TouchableOpacity>
          </View>
        ))}
      </GlassCard>

      {receivedRequests.length > 0 && (
        <View style={{ marginBottom: 20 }}>
          <Text style={[s.sectionTitle, { color: colors.textPrimary, marginLeft: 8, marginBottom: 12 }]}>{t('social.receivedRequests', 'Solicitudes Recibidas')}</Text>
          {receivedRequests.map((req: any) => (
            <GlassCard key={req.id} style={{ marginBottom: 8, padding: 12 }}>
              <View style={s.userRow}>
                <TouchableOpacity style={s.userInfo} onPress={() => onUserPress(req.friend_profile)}>
                  {req.friend_profile?.avatar_url ? (
                    <Image cachePolicy="memory-disk" source={{ uri: req.friend_profile.avatar_url }} style={s.avatarSmall} />
                  ) : (
                    <View style={[s.avatarPlaceholder, { backgroundColor: colors.primary, width: 32, height: 32 }]}>
                      <Text style={[s.avatarInitials, { fontSize: 14 }]}>{req.friend_profile?.name?.[0]}</Text>
                    </View>
                  )}
                  <Text style={[s.userName, getNameStyle(req.friend_profile?.name_color, req.friend_profile?.id, profile?.id, profile?.nameColor)]}>
                    {req.friend_profile?.name}
                  </Text>
                </TouchableOpacity>
                <View style={{ flexDirection: 'row', gap: 8 }}>
                  <TouchableOpacity style={[s.iconBtn, { backgroundColor: colors.success }]} onPress={() => onAcceptFriend(req.id)}>
                    <Check size={18} color="#fff" />
                  </TouchableOpacity>
                  <TouchableOpacity style={[s.iconBtn, { backgroundColor: colors.error }]} onPress={() => onRejectFriend(req.id)}>
                    <X size={18} color="#fff" />
                  </TouchableOpacity>
                </View>
              </View>
            </GlassCard>
          ))}
        </View>
      )}

      {sentRequests.length > 0 && (
        <View style={{ marginBottom: 20 }}>
          <Text style={[s.sectionTitle, { color: colors.textPrimary, marginLeft: 8, marginBottom: 12 }]}>{t('social.sentRequests', 'Solicitudes Enviadas')}</Text>
          {sentRequests.map((req: any) => (
            <GlassCard key={req.id} style={{ marginBottom: 8, padding: 12, opacity: 0.8 }}>
              <View style={s.userRow}>
                <TouchableOpacity style={s.userInfo} onPress={() => onUserPress(req.friend_profile)}>
                  {req.friend_profile?.avatar_url ? (
                    <Image cachePolicy="memory-disk" source={{ uri: req.friend_profile.avatar_url }} style={s.avatarSmall} />
                  ) : (
                    <View style={[s.avatarPlaceholder, { backgroundColor: colors.primary, width: 32, height: 32 }]}>
                      <Text style={[s.avatarInitials, { fontSize: 14 }]}>{req.friend_profile?.name?.[0]}</Text>
                    </View>
                  )}
                  <Text style={[s.userName, getNameStyle(req.friend_profile?.name_color, req.friend_profile?.id, profile?.id, profile?.nameColor)]}>
                    {req.friend_profile?.name}
                  </Text>
                </TouchableOpacity>
                <View style={{ backgroundColor: colors.surfaceAlt, paddingHorizontal: 10, paddingVertical: 4, borderRadius: Radius.full }}>
                  <Text style={{ color: colors.textMuted, fontSize: 11 }}>{t('social.friends.pending', 'Pendiente')}</Text>
                </View>
                <TouchableOpacity onPress={() => onRejectFriend(req.id)} style={{ marginLeft: 12 }}>
                  <Trash2 size={16} color={colors.textMuted} />
                </TouchableOpacity>
              </View>
            </GlassCard>
          ))}
        </View>
      )}

      <Text style={[s.sectionTitle, { color: colors.textPrimary, marginLeft: 8, marginBottom: 12 }]}>{t('social.myFriends', 'Mis Amigos')}</Text>
      {acceptedFriends.length === 0 ? (
        <Text style={{ color: colors.textMuted, textAlign: 'center', marginTop: 10 }}>Aún no tienes amigos.</Text>
      ) : (
        acceptedFriends.map((friend: any) => (
          <GlassCard key={friend.id} style={{ marginBottom: 8, padding: 12 }}>
            <View style={s.userRow}>
              <TouchableOpacity style={s.userInfo} onPress={() => onUserPress(friend.friend_profile)}>
                {friend.friend_profile?.avatar_url ? (
                  <Image cachePolicy="memory-disk" source={{ uri: friend.friend_profile.avatar_url }} style={s.avatarSmall} />
                ) : (
                  <View style={[s.avatarPlaceholder, { backgroundColor: colors.primary, width: 32, height: 32 }]}>
                    <Text style={[s.avatarInitials, { fontSize: 14 }]}>{friend.friend_profile?.name?.[0]}</Text>
                  </View>
                )}
                <Text style={[s.userName, getNameStyle(friend.friend_profile?.name_color, friend.friend_profile?.id, profile?.id, profile?.nameColor, premiumColor)]}>
                  {friend.friend_profile?.name}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity style={s.iconBtn} onPress={() => onChat(friend)}>
                {socialStore.unreadCounts[friend.friend_profile?.id || ''] > 0 ? (
                  <LinearGradient colors={[colors.primary, colors.secondary || '#A855F7']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={s.gradientIconBtn}>
                    <MessageSquare size={18} color="#fff" />
                    <View style={s.badge}>
                      <Text style={s.badgeText}>{socialStore.unreadCounts[friend.friend_profile?.id || '']}</Text>
                    </View>
                  </LinearGradient>
                ) : (
                  <MessageSquare size={18} color={colors.primary} />
                )}
              </TouchableOpacity>
            </View>
          </GlassCard>
        ))
      )}
    </View>
  );
}

const s = StyleSheet.create({
  tabContent: { flex: 1 },
  sectionTitle: { fontSize: 18, fontWeight: '800', letterSpacing: -0.3 },
  searchBar: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, height: 50, borderRadius: Radius.full, marginBottom: 16 },
  searchInput: { flex: 1, marginLeft: 8, fontSize: 15, fontWeight: '500' },
  userRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 12 },
  userInfo: { flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1 },
  avatar: { width: 44, height: 44, borderRadius: 22 },
  avatarSmall: { width: 36, height: 36, borderRadius: 18 },
  avatarPlaceholder: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
  avatarInitials: { color: '#fff', fontWeight: 'bold', fontSize: 18 },
  userName: { fontSize: 15, fontWeight: '700' },
  actionBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 14, paddingVertical: 8, borderRadius: Radius.full },
  actionBtnText: { color: '#fff', fontSize: 12, fontWeight: '800' },
  iconBtn: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  gradientIconBtn: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  badge: { position: 'absolute', top: -4, right: -4, backgroundColor: '#FF3B30', borderRadius: 10, minWidth: 18, height: 18, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 4, borderWidth: 2, borderColor: '#fff' },
  badgeText: { color: '#fff', fontSize: 10, fontWeight: 'bold' },
});
