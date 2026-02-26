/**
 * Milestone 1 – Full test suite
 * Run: npx tsx scripts/test-milestone1.ts
 * Requires: .env or .env.local with POSTGRES_URL
 */
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });
dotenv.config();

const POSTGRES_URL = process.env.POSTGRES_URL;
let passed = 0;
let failed = 0;

function ok(name: string) {
  console.log(`  ✅ ${name}`);
  passed++;
}

function fail(name: string, err: unknown) {
  console.log(`  ❌ ${name}`);
  console.error(`     ${err instanceof Error ? err.message : String(err)}`);
  failed++;
}

async function run() {
  console.log('\n=== Milestone 1 Test Suite ===\n');

  // --- 1. Environment & DB connection ---
  console.log('1. Project setup (database)');
  if (!POSTGRES_URL) {
    fail('POSTGRES_URL is set', 'Missing POSTGRES_URL in environment');
  } else {
    ok('POSTGRES_URL is set');
  }

  const { db } = await import('../src/lib/db/client');

  try {
    await db.getCities();
    ok('DB connection and cities table');
  } catch (e) {
    fail('DB connection and cities table', e);
    console.log('\n--- Stopping (DB required for remaining tests) ---\n');
    process.exit(failed > 0 ? 1 : 0);
  }

  // --- 2. Database structure ---
  console.log('\n2. Database structure (Cities, Buildings, Recipients, Alert logs)');
  try {
    await db.getCities();
    ok('Cities table readable');
  } catch (e) {
    fail('Cities table', e);
  }

  try {
    const cities = await db.getCities();
    if (cities.length > 0) {
      await db.getBuildings(cities[0].id);
      ok('Buildings table readable (by city_id)');
    } else {
      console.log('  ⏭️  Skip buildings (no cities)');
    }
  } catch (e) {
    fail('Buildings table', e);
  }

  try {
    const cities = await db.getCities();
    if (cities.length > 0) {
      const buildings = await db.getBuildings(cities[0].id);
      if (buildings.length > 0) {
        await db.getRecipients(buildings[0].id);
        ok('Recipients table readable');
      } else {
        console.log('  ⏭️  Skip recipients (no buildings for first city)');
      }
    } else {
      console.log('  ⏭️  Skip recipients (no cities)');
    }
  } catch (e) {
    fail('Recipients table', e);
  }

  try {
    await db.getUnprocessedAlerts();
    ok('Alert logs table readable');
  } catch (e) {
    fail('Alert logs table', e);
  }

  // --- 3. City and building structure + configurable alert rules ---
  console.log('\n3. City structure & configurable alert logic');
  const cities = await db.getCities();
  const activeCity = cities.find((c) => c.is_active) || cities[0];

  if (!activeCity) {
    console.log('  ⏭️  No city in DB – add one via Admin to run alert tests');
  } else {
    ok(`City found: ${activeCity.name} (${activeCity.state})`);
    const hasDelta = typeof activeCity.alert_temp_delta === 'number' || typeof activeCity.alert_temp_delta === 'string';
    const hasWindow = typeof activeCity.alert_window_hours === 'number';
    if (hasDelta && hasWindow) {
      ok(`Configurable thresholds: delta=${activeCity.alert_temp_delta}°F, window=${activeCity.alert_window_hours}h`);
    } else {
      fail('Configurable thresholds', 'Missing alert_temp_delta or alert_window_hours');
    }
    const hasNWS =
      activeCity.nws_office && typeof activeCity.nws_grid_x === 'number' && typeof activeCity.nws_grid_y === 'number';
    if (hasNWS) {
      ok(`NWS config: ${activeCity.nws_office} ${activeCity.nws_grid_x},${activeCity.nws_grid_y}`);
    } else {
      fail('NWS config', 'Missing nws_office or grid');
    }

    // Update city (configurable) – verify persist
    try {
      const updated = await db.updateCity(activeCity.id, {
        alert_temp_delta: Number(activeCity.alert_temp_delta),
        alert_window_hours: activeCity.alert_window_hours,
      });
      if (updated) ok('updateCity persists alert config');
      else fail('updateCity', 'Returned null');
    } catch (e) {
      fail('updateCity persists alert config', e);
    }
  }

  // --- 4. NWS integration & alert service ---
  console.log('\n4. NWS integration & alert logic');
  if (!activeCity) {
    console.log('  ⏭️  Skipped (no city)');
  } else {
    const { alertService } = await import('../src/lib/services/alertService');
    const { fetchNWSHourlyForecast } = await import('../src/lib/controllers/weatherController');

    try {
      const forecast = await fetchNWSHourlyForecast(
        activeCity.nws_office,
        activeCity.nws_grid_x,
        activeCity.nws_grid_y
      );
      if (Array.isArray(forecast) && forecast.length > 0) {
        ok(`NWS hourly forecast: ${forecast.length} periods`);
        const first = forecast[0];
        if (first && 'tempF' in first && 'time' in first) ok('Forecast shape: { time, tempF }');
        else fail('Forecast shape', 'Missing time or tempF');
      } else {
        fail('NWS hourly forecast', 'Empty or invalid response');
      }
    } catch (e) {
      fail('NWS hourly forecast', e);
    }

    try {
      const result = await alertService.checkSuddenFluctuation(activeCity.id);
      if (result === null && !activeCity.is_active) {
        ok('checkSuddenFluctuation (city inactive)');
      } else if (result && typeof result.shouldAlert === 'boolean') {
        ok(`checkSuddenFluctuation: change=${result.temperatureChange.toFixed(1)}°F, shouldAlert=${result.shouldAlert}`);
      } else if (result === null) {
        fail('checkSuddenFluctuation', 'Returned null (city active; check NWS or window)');
      } else {
        fail('checkSuddenFluctuation', 'Invalid result shape');
      }
    } catch (e) {
      fail('checkSuddenFluctuation', e);
    }

    try {
      const summary = await alertService.calculateDailySummary(activeCity.id);
      if (summary === null && !activeCity.is_active) {
        ok('calculateDailySummary (city inactive)');
      } else if (summary && 'averageTemp' in summary && 'temperatureChange' in summary) {
        ok(`calculateDailySummary: avg=${summary.averageTemp}°F, Δ=${summary.temperatureChange}°F`);
      } else if (summary === null) {
        console.log('  ⏭️  calculateDailySummary returned null (need 24h forecast or snapshots)');
      } else {
        fail('calculateDailySummary', 'Invalid result shape');
      }
    } catch (e) {
      fail('calculateDailySummary', e);
    }
  }

  // --- 5. Alert log creation (internal alert events) ---
  console.log('\n5. Internal alert events (alert_logs)');
  if (!activeCity) {
    console.log('  ⏭️  Skipped (no city)');
  } else {
    try {
      const log = await db.createAlertLog({
        city_id: activeCity.id,
        alert_type: 'sudden_fluctuation',
        temperature_data: { currentTemp: 50, futureTemp: 58, change: 8, timeWindow: 6 },
        threshold_used: { tempDelta: 5, windowHours: 6 },
        processed: false,
      });
      if (log && log.id) {
        ok('createAlertLog (sudden_fluctuation)');
        await db.markAlertProcessed(log.id);
      } else {
        fail('createAlertLog', 'No id returned');
      }
    } catch (e) {
      fail('createAlertLog', e);
    }

    try {
      const log2 = await db.createAlertLog({
        city_id: activeCity.id,
        alert_type: 'daily_summary',
        temperature_data: { averageTemp: 52, minTemp: 45, maxTemp: 58, temperatureChange: 2 },
        threshold_used: {},
        processed: false,
      });
      if (log2 && log2.id) {
        ok('createAlertLog (daily_summary)');
        await db.markAlertProcessed(log2.id);
      } else {
        fail('createAlertLog daily_summary', 'No id returned');
      }
    } catch (e) {
      fail('createAlertLog (daily_summary)', e);
    }
  }

  // --- 6. Temperature snapshot (used by cron) ---
  console.log('\n6. Temperature snapshot');
  if (!activeCity) {
    console.log('  ⏭️  Skipped (no city)');
  } else {
    const { alertService } = await import('../src/lib/services/alertService');
    try {
      await alertService.saveTemperatureSnapshot(activeCity.id);
      ok('saveTemperatureSnapshot');
    } catch (e) {
      fail('saveTemperatureSnapshot', e);
    }
  }

  // --- Summary ---
  console.log('\n--- Summary ---');
  console.log(`  Passed: ${passed}`);
  console.log(`  Failed: ${failed}`);
  console.log('');
  process.exit(failed > 0 ? 1 : 0);
}

run().catch((err) => {
  console.error('Fatal:', err);
  process.exit(1);
});
