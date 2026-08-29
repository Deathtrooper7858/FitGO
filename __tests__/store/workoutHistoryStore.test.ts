import { useWorkoutHistoryStore } from '../../store/workoutHistoryStore';

describe('WorkoutHistoryStore', () => {
  beforeEach(() => {
    useWorkoutHistoryStore.getState().clearHistory();
  });

  it('should start with empty history', () => {
    const workouts = useWorkoutHistoryStore.getState().workouts;
    expect(workouts).toEqual([]);
  });

  it('should add a completed workout correctly', () => {
    useWorkoutHistoryStore.getState().addWorkout({
      date: '2026-08-29',
      routineName: 'Push Day',
      exercises: [
        { name: 'Bench Press', sets: 4, reps: '8-10' },
        { name: 'Overhead Press', sets: 3, reps: '10-12' },
      ],
    });

    const workouts = useWorkoutHistoryStore.getState().workouts;
    expect(workouts).toHaveLength(1);
    expect(workouts[0].routineName).toBe('Push Day');
    expect(workouts[0].exercises).toHaveLength(2);
    expect(useWorkoutHistoryStore.getState().hasCompletedWorkoutToday('2026-08-29')).toBe(true);
  });

  it('should replace previous workout on the same date for the user', () => {
    useWorkoutHistoryStore.getState().addWorkout({
      date: '2026-08-29',
      routineName: 'Morning Cardio',
      exercises: [{ name: 'Running', sets: 1, reps: '30 mins' }],
    });

    useWorkoutHistoryStore.getState().addWorkout({
      date: '2026-08-29',
      routineName: 'Evening Lift',
      exercises: [{ name: 'Deadlift', sets: 5, reps: '5' }],
    });

    const workouts = useWorkoutHistoryStore.getState().workouts;
    expect(workouts).toHaveLength(1);
    expect(workouts[0].routineName).toBe('Evening Lift');
  });

  it('should remove workout by id', () => {
    useWorkoutHistoryStore.getState().addWorkout({
      date: '2026-08-28',
      routineName: 'Leg Day',
      exercises: [{ name: 'Squats', sets: 4, reps: '8' }],
    });

    const added = useWorkoutHistoryStore.getState().workouts[0];
    useWorkoutHistoryStore.getState().removeWorkout(added.id);

    expect(useWorkoutHistoryStore.getState().workouts).toHaveLength(0);
  });
});
