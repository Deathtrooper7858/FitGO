import React from 'react';
import { StyleSheet, View, Text } from 'react-native';
import { Image } from 'expo-image';
import { useVideoPlayer, VideoView } from 'expo-video';

interface VideoPlayerViewProps {
  videoUrl: string;
  style?: any;
}

// Helper to verify if URL is an image
function isImage(url: string): boolean {
  const clean = url.split('?')[0].toLowerCase();
  return (
    clean.endsWith('.jpg') ||
    clean.endsWith('.jpeg') ||
    clean.endsWith('.png') ||
    clean.endsWith('.webp') ||
    clean.endsWith('.gif') ||
    clean.endsWith('.bmp') ||
    clean.endsWith('.heic')
  );
}

// Error boundary to protect against native video player crashes
class SafeVideoBoundary extends React.Component<
  { fallback?: React.ReactNode; children: React.ReactNode },
  { hasError: boolean }
> {
  state = { hasError: false };
  static getDerivedStateFromError() {
    return { hasError: true };
  }
  componentDidCatch(err: any) {
    console.warn('[VideoPlayerView] Caught video playback error:', err);
  }
  render() {
    if (this.state.hasError) {
      return (
        this.props.fallback || (
          <View style={[styles.container, styles.fallbackContainer]}>
            <Text style={styles.fallbackText}>Video no disponible</Text>
          </View>
        )
      );
    }
    return this.props.children;
  }
}

export function VideoPlayerView({ videoUrl, style }: VideoPlayerViewProps) {
  if (!videoUrl || typeof videoUrl !== 'string' || !videoUrl.trim()) {
    return <View style={[styles.container, style]} />;
  }

  // If accidentally passed an image, render Image safely instead of crashing ExoPlayer
  if (isImage(videoUrl)) {
    return (
      <View style={[styles.container, style]}>
        <Image
          source={{ uri: videoUrl }}
          style={StyleSheet.absoluteFill}
          contentFit="cover"
          cachePolicy="memory-disk"
        />
      </View>
    );
  }

  return (
    <SafeVideoBoundary
      fallback={
        <View style={[styles.container, style, styles.fallbackContainer]}>
          <Text style={styles.fallbackText}>Video no disponible</Text>
        </View>
      }
    >
      <VideoPlayerInner videoUrl={videoUrl} style={style} />
    </SafeVideoBoundary>
  );
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
  fallbackContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: 120,
  },
  fallbackText: {
    color: '#888',
    fontSize: 12,
  },
});

export default VideoPlayerView;
