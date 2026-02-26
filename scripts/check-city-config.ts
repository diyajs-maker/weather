/**
 * Print current alert config for a city from the database.
 * Run: npx tsx scripts/check-city-config.ts Buffalo
 */
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });
dotenv.config();

async function main() {
  const name = process.argv[2] || 'Buffalo';
  const { db } = await import('../src/lib/db/client');
  const cities = await db.getCities();
  const city = cities.find((c) => c.name.toLowerCase() === name.toLowerCase());
  if (!city) {
    console.error(`City "${name}" not found.`);
    process.exit(1);
  }
  console.log(`\nCity: ${city.name} (${city.state})`);
  console.log(`  alert_temp_delta:   ${city.alert_temp_delta}°F`);
  console.log(`  alert_window_hours: ${city.alert_window_hours}h`);
  console.log(`  nws: ${city.nws_office} ${city.nws_grid_x},${city.nws_grid_y}`);
  console.log('');
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
