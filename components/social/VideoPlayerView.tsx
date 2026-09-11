import React from 'react';
import { StyleSheet, View } from 'react-native';
import { useVideoPlayer, VideoView } from 'expo-video';

interface VideoPlayerViewProps {
  videoUrl: string;
  style?: any;
}

export function VideoPlayerView({ videoUrl, style }: VideoPlayerViewProps) {
  if (!videoUrl) {
    return <View style={[styles.container, style]} />;
  }

  return <VideoPlayerInner videoUrl={videoUrl} style={style} />;
}

function VideoPlayerInner({ videoUrl, style }: VideoPlayerViewProps) {
  const player = useVideoPlayer(videoUrl, (p) => {
    try {
      p.loop = true;
      p.muted = false;
    } catch (e) {
      console.warn('[VideoPlayerInner] player setup error:', e);
    }
  });

  return (
    <View style={[styles.container, style]}>
      <VideoView
        style={StyleSheet.absoluteFill}
        player={player}
        nativeControls
        contentFit="contain"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    overflow: 'hidden',
    backgroundColor: '#000',
    borderRadius: 12,
  },
});
export default VideoPlayerView;
