CREATE OR REPLACE FUNCTION get_achievement_points(achievement_id text)
RETURNS integer
LANGUAGE plpgsql
IMMUTABLE
AS $$
BEGIN
  RETURN CASE achievement_id
    WHEN 'welcome' THEN 10
    WHEN 'premium_club' THEN 25
    WHEN 'dark_mode_lover' THEN 10
    WHEN 'profile_complete' THEN 25
    WHEN 'streak_3' THEN 10
    WHEN 'streak_7' THEN 25
    WHEN 'streak_30' THEN 50
    WHEN 'streak_100' THEN 100
    WHEN 'streak_365' THEN 100
    WHEN 'streak_500' THEN 100
    WHEN 'streak_1000' THEN 100
    WHEN 'first_log' THEN 10
    WHEN 'early_bird' THEN 25
    WHEN 'protein_goal' THEN 25
    WHEN 'healthy_eater' THEN 25
    WHEN 'perfect_macros' THEN 50
    WHEN 'water_habit' THEN 10
    WHEN 'water_champion' THEN 25
    WHEN 'water_god' THEN 50
    WHEN 'water_ocean' THEN 100
    WHEN 'diet_expert' THEN 50
    WHEN 'hydration_streak_7' THEN 25
    WHEN 'nutrition_scholar' THEN 50
    WHEN 'carnival_eater' THEN 25
    WHEN 'vegan_day' THEN 50
    WHEN 'protein_pancake' THEN 10
    WHEN 'late_snack' THEN 25
    WHEN 'perfect_week_macros' THEN 100
    WHEN 'carnivore' THEN 100
    WHEN 'sweet_tooth' THEN 50
    WHEN 'coffee_addict' THEN 25
    WHEN 'fasting_monk' THEN 50
    WHEN 'chef_kiss' THEN 10
    WHEN 'goal_reached' THEN 50
    WHEN 'weight_loss_1' THEN 10
    WHEN 'muscle_gain_1' THEN 10
    WHEN 'weight_loss_10' THEN 100
    WHEN 'muscle_gain_10' THEN 100
    WHEN 'body_sculptor' THEN 25
    WHEN 'photo_pioneer' THEN 10
    WHEN 'step_master' THEN 25
    WHEN 'step_marathon' THEN 50
    WHEN 'step_half_marathon' THEN 100
    WHEN 'workout_warrior' THEN 50
    WHEN 'workout_machine' THEN 100
    WHEN 'sleep_master' THEN 10
    WHEN 'sleep_champion' THEN 25
    WHEN 'sleep_god' THEN 50
    WHEN 'social_star' THEN 10
    WHEN 'social_influence' THEN 25
    WHEN 'friend_magnet' THEN 50
    WHEN 'community_pillar' THEN 100
    WHEN 'beta_tester' THEN 50
    WHEN 'developer_god' THEN 100
    WHEN 'the_owner' THEN 100
    WHEN 'bug_hunter' THEN 25
    WHEN 'night_owl' THEN 25
    WHEN 'easter_egg_hunter' THEN 50
    WHEN 'ghost_mode' THEN 10
    WHEN 'matrix_glitch' THEN 100
    WHEN 'time_traveler' THEN 25
    WHEN 'heavy_lifter' THEN 100
    WHEN 'flash_speed' THEN 100
    WHEN 'zen_mode' THEN 50
    WHEN 'iron_lungs' THEN 25
    WHEN 'mountain_climber' THEN 50
    WHEN 'viral_post' THEN 100
    WHEN 'first_comment' THEN 10
    WHEN 'helper' THEN 25
    WHEN 'profile_stalker' THEN 10
    WHEN 'fitgo_veteran' THEN 100
    WHEN 'data_nerd' THEN 25
    WHEN 'fast_logger' THEN 10
    WHEN 'first_like' THEN 10
    WHEN 'like_bomber' THEN 25
    WHEN 'squad_creator' THEN 50
    WHEN 'squad_champion' THEN 100
    WHEN 'trend_setter' THEN 100
    WHEN 'chatty' THEN 25
    WHEN 'early_lifter' THEN 50
    WHEN 'leg_day_survivor' THEN 25
    WHEN 'cardio_bunny' THEN 50
    WHEN 'rest_day_respect' THEN 10
    WHEN 'yoga_streak' THEN 50
    WHEN '100k_steps_week' THEN 100
    WHEN 'waist_shredder' THEN 50
    WHEN 'biceps_pump' THEN 25
    WHEN 'scale_fearless' THEN 25
    WHEN 'first_compliment' THEN 50
    WHEN 'bmi_normal' THEN 25
    WHEN 'body_fat_15' THEN 100
    WHEN 'spartan_300' THEN 100
    WHEN 'kryptonian' THEN 100
    WHEN 'goggins_mode' THEN 100
    WHEN 'body_alchemist' THEN 100
    WHEN 'mr_olympia' THEN 100
    WHEN 'the_one_percent' THEN 100
    WHEN 'iron_monk' THEN 100
    WHEN 'immortal' THEN 100
    WHEN 'perfect_machine' THEN 100
    WHEN 'triceratops' THEN 100
    WHEN 'supernova' THEN 100
    WHEN 'god_of_war' THEN 100
    WHEN 'holy_grail' THEN 100
    WHEN 'five_meals' THEN 25
    WHEN 'balanced_day' THEN 50
    WHEN 'smoothie_lover' THEN 10
    WHEN 'three_workouts_week' THEN 25
    WHEN 'bike_rider' THEN 25
    WHEN 'ten_workouts' THEN 50
    WHEN 'fifty_workouts' THEN 100
    WHEN 'weight_loss_5' THEN 25
    WHEN 'muscle_gain_5' THEN 25
    WHEN 'five_measurements' THEN 25
    WHEN 'language_switcher' THEN 10
    WHEN 'night_mode' THEN 10
    WHEN 'first_week_user' THEN 10
    WHEN 'sleep_week' THEN 50
    WHEN 'power_nap' THEN 25
    WHEN 'first_friend' THEN 10
    WHEN 'three_friends' THEN 25
    ELSE 10
  END;
END;
$$;

-- Recalculate points for all users
UPDATE public.users u
SET league_points = compute_user_league_points(u.id)
WHERE u.name IS NOT NULL;

UPDATE public.squads s
SET points = (
  SELECT COALESCE(SUM(u.league_points), 0)
  FROM public.squad_members sm
  JOIN public.users u ON u.id = sm.user_id
  WHERE sm.squad_id = s.id
);
