const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://abvidinpswnfxijjfnic.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFidmlkaW5wc3duZnhpampmbmljIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzcyNDI0MDEsImV4cCI6MjA5MjgxODQwMX0.-fEFidltyCJFicuxNTqtVd-Ak3a1_-Yn2_XUdQhwrrM';

const supabase = createClient(supabaseUrl, supabaseKey);

async function backfill() {
  console.log('Fetching historical points from get_global_ranking...');
  const { data: rankingData, error: rankErr } = await supabase.rpc('get_global_ranking', { limit_val: 100000 });
  
  if (rankErr) {
    console.error('Error fetching global ranking:', rankErr);
    return;
  }
  
  console.log(`Found ${rankingData.length} users in ranking.`);
  
  // Fetch all users' current league_points in one query
  const { data: usersData, error: usersErr } = await supabase
    .from('users')
    .select('id, league_points');
    
  if (usersErr) {
    console.error('Error fetching users:', usersErr);
    return;
  }
  
  const userMap = {};
  for (const u of (usersData || [])) {
    userMap[u.id] = u.league_points || 0;
  }
  
  console.log(`Fetched ${Object.keys(userMap).length} users from users table.`);
  
  let count = 0;
  let skipped = 0;
  
  for (const user of rankingData) {
    if (!user.id || user.points == null) continue;
    
    const historicalPoints = Math.floor(Number(user.points));
    const currentPoints = userMap[user.id] ?? -1;
    
    if (currentPoints === -1) {
      console.log(`Skipping ${user.name} (not found in users table)`);
      skipped++;
      continue;
    }
    
    // Only update if historical > current (preserve any points earned via league system)
    if (historicalPoints > currentPoints) {
      const { error: updateErr } = await supabase
        .from('users')
        .update({ league_points: historicalPoints })
        .eq('id', user.id);
        
      if (updateErr) {
        console.error(`Error updating ${user.name}:`, updateErr.message);
      } else {
        count++;
        console.log(`✅ ${user.name}: ${currentPoints} → ${historicalPoints} pts`);
      }
    } else {
      console.log(`⏭️  ${user.name}: already has ${currentPoints} pts (historical=${historicalPoints}), skipping`);
      skipped++;
    }
  }
  
  console.log(`\nBackfill complete.`);
  console.log(`✅ Updated: ${count} users`);
  console.log(`⏭️  Skipped: ${skipped} users`);
}

backfill().catch(console.error);
