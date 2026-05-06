// Weekly Square summary — Mon–Sun of a given week
// Returns per-day revenue + item-level sales for the full week
// Used by the Brice tab for the weekly health view

const SQUARE_BASE = 'https://connect.squareup.com/v2';
const MIAMI_TZ = 'America/New_York';

function send(res, status, payload) {
  res.status(status).json(payload);
}

function centsToDollars(cents) {
  return Number(((cents || 0) / 100).toFixed(2));
}

function getTimeZoneParts(date, timeZone) {
  const fmt = new Intl.DateTimeFormat('en-US', {
    timeZone,
    year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit', second: '2-digit',
    hour12: false,
  });
  const parts = fmt.formatToParts(date);
  const pick = (type) => Number(parts.find((p) => p.type === type)?.value || 0);
  return { year: pick('year'), month: pick('month'), day: pick('day'), hour: pick('hour'), minute: pick('minute'), second: pick('second') };
}

function getOffsetMinutes(utcDate, timeZone) {
  const p = getTimeZoneParts(utcDate, timeZone);
  const asUtc = Date.UTC(p.year, p.month - 1, p.day, p.hour, p.minute, p.second);
  return Math.round((asUtc - utcDate.getTime()) / 60000);
}

function localToUtcIso(dateIso, hour, minute, second, ms, tz) {
  const [y, m, d] = dateIso.split('-').map(Number);
  let utcMs = Date.UTC(y, m - 1, d, hour, minute, second, ms);
  for (let i = 0; i < 3; i++) {
    const off = getOffsetMinutes(new Date(utcMs), tz);
    const adj = Date.UTC(y, m - 1, d, hour, minute, second, ms) - off * 60000;
    if (adj === utcMs) break;
    utcMs = adj;
  }
  return new Date(utcMs).toISOString();
}

function dateInTz(timeZone) {
  const p = getTimeZoneParts(new Date(), timeZone);
  const pad = (n) => String(n).padStart(2, '0');
  return `${p.year}-${pad(p.month)}-${pad(p.day)}`;
}

// Get Mon–Sun week containing a given YYYY-MM-DD date
function getWeekRange(dateIso, timeZone) {
  const [y, m, d] = dateIso.split('-').map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d, 12, 0, 0));
  // Get day of week in Miami
  const parts = new Intl.DateTimeFormat('en-US', { timeZone, weekday: 'short' }).format(dt);
  const dowMap = { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 };
  const dow = dowMap[parts] ?? 0;
  const daysFromMon = (dow === 0 ? 6 : dow - 1); // Mon=0 offset
  const days = [];
  for (let i = 0; i < 7; i++) {
    const offset = i - daysFromMon;
    const day = new Date(Date.UTC(y, m - 1, d + offset, 12, 0, 0));
    const p = getTimeZoneParts(day, timeZone);
    const pad = (n) => String(n).padStart(2, '0');
    days.push(`${p.year}-${pad(p.month)}-${pad(p.day)}`);
  }
  return days; // [Mon, Tue, Wed, Thu, Fri, Sat, Sun]
}

async function squarePost(path, token, body) {
  const res = await fetch(`${SQUARE_BASE}${path}`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
      'Square-Version': '2024-12-18',
    },
    body: JSON.stringify(body),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const err = new Error(data?.errors?.[0]?.detail || 'Square API error');
    err.status = res.status;
    throw err;
  }
  return data;
}

async function fetchOrdersForRange(token, locationId, startIso, endIso) {
  let cursor;
  const orders = [];
  do {
    const payload = {
      location_ids: [locationId],
      query: {
        filter: {
          date_time_filter: { closed_at: { start_at: startIso, end_at: endIso } },
          state_filter: { states: ['COMPLETED'] },
        },
        sort: { sort_field: 'CLOSED_AT', sort_order: 'ASC' },
      },
      limit: 500,
      cursor,
    };
    const data = await squarePost('/orders/search', token, payload);
    const chunk = Array.isArray(data.orders) ? data.orders : [];
    orders.push(...chunk);
    cursor = data.cursor;
  } while (cursor);
  return orders;
}

function orderDateIso(order, timeZone) {
  if (!order?.closed_at) return null;
  const p = getTimeZoneParts(new Date(order.closed_at), timeZone);
  const pad = (n) => String(n).padStart(2, '0');
  return `${p.year}-${pad(p.month)}-${pad(p.day)}`;
}

export default async function handler(req, res) {
  if (req.method !== 'GET') return send(res, 405, { code: 'METHOD_NOT_ALLOWED' });

  const token = process.env.SQUARE_ACCESS_TOKEN;
  const locationId = process.env.SQUARE_LOCATION_ID;
  const squareEnv = process.env.SQUARE_ENVIRONMENT || 'production';
  if (!token) return send(res, 500, { code: 'TOKEN_MISSING' });
  if (!locationId) return send(res, 500, { code: 'LOCATION_MISSING' });
  if (squareEnv !== 'production') return send(res, 400, { code: 'INVALID_ENVIRONMENT' });

  const anchorDate = req.query?.date || dateInTz(MIAMI_TZ);
  const weekDays = getWeekRange(anchorDate, MIAMI_TZ); // [Mon..Sun]
  const weekStart = localToUtcIso(weekDays[0], 0, 0, 0, 0, MIAMI_TZ);
  const weekEnd = localToUtcIso(weekDays[6], 23, 59, 59, 999, MIAMI_TZ);

  try {
    const orders = await fetchOrdersForRange(token, locationId, weekStart, weekEnd);

    // Build per-day buckets
    const dayMap = {};
    weekDays.forEach(d => { dayMap[d] = { date: d, grossSales: 0, orderCount: 0, items: new Map() }; });

    for (const order of orders) {
      const dateIso = orderDateIso(order, MIAMI_TZ);
      if (!dateIso || !dayMap[dateIso]) continue;
      const day = dayMap[dateIso];
      day.grossSales += centsToDollars(order?.total_money?.amount || 0);
      day.orderCount += 1;
      const lines = Array.isArray(order?.line_items) ? order.line_items : [];
      for (const line of lines) {
        const name = line?.name || 'Unknown';
        const qty = Number(line?.quantity || 0);
        const amount = centsToDollars(line?.gross_sales_money?.amount || line?.total_money?.amount || 0);
        const existing = day.items.get(name) || { name, quantity: 0, grossSales: 0 };
        existing.quantity += qty;
        existing.grossSales += amount;
        day.items.set(name, existing);
      }
    }

    // Build weekly item totals
    const weekItems = new Map();
    for (const day of Object.values(dayMap)) {
      for (const [name, data] of day.items) {
        const existing = weekItems.get(name) || { name, quantity: 0, grossSales: 0 };
        existing.quantity += data.quantity;
        existing.grossSales += data.grossSales;
        weekItems.set(name, existing);
      }
    }

    const days = weekDays.map(d => {
      const day = dayMap[d];
      return {
        date: d,
        grossSales: Number(day.grossSales.toFixed(2)),
        orderCount: day.orderCount,
        avgTicket: day.orderCount > 0 ? Number((day.grossSales / day.orderCount).toFixed(2)) : 0,
        topItems: [...day.items.values()]
          .sort((a, b) => b.grossSales - a.grossSales)
          .slice(0, 5)
          .map(i => ({ ...i, quantity: Number(i.quantity.toFixed(1)), grossSales: Number(i.grossSales.toFixed(2)) })),
      };
    });

    const weekGross = Number(days.reduce((s, d) => s + d.grossSales, 0).toFixed(2));
    const weekOrders = days.reduce((s, d) => s + d.orderCount, 0);
    const topWeekItems = [...weekItems.values()]
      .sort((a, b) => b.grossSales - a.grossSales)
      .slice(0, 10)
      .map(i => ({ ...i, quantity: Number(i.quantity.toFixed(1)), grossSales: Number(i.grossSales.toFixed(2)) }));

    return send(res, 200, {
      weekRange: { start: weekDays[0], end: weekDays[6] },
      weekGross,
      weekOrders,
      days,
      topItems: topWeekItems,
    });
  } catch (err) {
    return send(res, 502, { code: 'SQUARE_API_ERROR', message: err?.message || 'Failed to fetch Square data.' });
  }
}
