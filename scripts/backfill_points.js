/**
 * Script de backfill para puntos de liga.
 * USO: node scripts/backfill_points.js
 * REQUIRE: Variables de entorno SUPABASE_URL y SUPABASE_SERVICE_KEY definidas
 *         (o un archivo .env en la raíz con EXPO_PUBLIC_SUPABASE_URL y EXPO_PUBLIC_SUPABASE_ANON_KEY)
 *
 * ⚠️  SEGURIDAD: No hardcodear credenciales. Siempre leer de env vars.
 */
const { createClient } = require('@supabase/supabase-js');

// Intentar cargar .env manualmente (dotenv no es dependencia de prod)
const fs = require('fs');
const path = require('path');
const envPath = path.join(__dirname, '..', '.env');
if (fs.existsSync(envPath)) {
  const lines = fs.readFileSync(envPath, 'utf8').split('\n');
  for (const line of lines) {
    const trimmed = line.trim();
    if (trimmed && !trimmed.startsWith('#')) {
      const eqIdx = trimmed.indexOf('=');
      if (eqIdx > 0) {
        const k = trimmed.slice(0, eqIdx).trim();
        const v = trimmed.slice(eqIdx + 1).trim().replace(/^["']|["']$/g, '');
        process.env[k] = process.env[k] || v;
      }
    }
  }
}

const supabaseUrl = process.env.SUPABASE_URL || process.env.EXPO_PUBLIC_SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_SERVICE_KEY || process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || '';

if (!supabaseUrl || !supabaseKey) {
  console.error('ERROR: Debes definir SUPABASE_URL y SUPABASE_SERVICE_KEY como variables de entorno.');
  console.error('  Ejemplo (PowerShell):');
  console.error('    $env:SUPABASE_URL="https://tu-proyecto.supabase.co"');
  console.error('    $env:SUPABASE_SERVICE_KEY="tu-service-role-key"');
  console.error('  O crear un archivo .env en la raíz del proyecto.');
  process.exit(1);
}

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
