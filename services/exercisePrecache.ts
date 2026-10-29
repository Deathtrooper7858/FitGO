import { Image } from 'expo-image';
import exercisesData from '../excercise/exercises.json';

const POPULAR_EXERCISE_KEYWORDS = [
  'bench press',
  'squat',
  'deadlift',
  'pull-up',
  'overhead press',
  'biceps curl',
  'triceps extension',
  'plank',
  'lat pulldown',
  'leg press',
];

let isPrecached = false;

/**
 * Pre-caches the GIFs of the top staple fitness exercises in the background.
 * Uses expo-image's high-efficiency disk/memory cache so when the user opens
 * the muscle directory, the animations render instantly with 0 latency.
 */
export async function initExercisePrecache(): Promise<void> {
  if (isPrecached) return;
  isPrecached = true;

  try {
    const urlsToCache: string[] = [];

    for (const keyword of POPULAR_EXERCISE_KEYWORDS) {
      const match = (exercisesData as { name: string; gifUrl: string }[]).find(
        ex => ex.name.toLowerCase().includes(keyword) && ex.gifUrl && ex.gifUrl.startsWith('http')
      );
      if (match && !urlsToCache.includes(match.gifUrl)) {
        urlsToCache.push(match.gifUrl);
      }
    }

    if (urlsToCache.length > 0) {
      // Prefetch up to 10 GIFs in parallel in background
      await Promise.allSettled(urlsToCache.slice(0, 10).map(url => Image.prefetch(url)));
    }
  } catch (err) {
    // Non-blocking background enhancement
    if (__DEV__) console.log('[ExercisePrecache] Precache completed with non-fatal notice:', err);
  }
}
