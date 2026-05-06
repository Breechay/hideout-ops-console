const SQUARE_BASE = 'https://connect.squareup.com/v2';
const MIAMI_TZ = 'America/New_York';

function send(res, status, payload) {
  res.status(status).json(payload);
}

function toIsoDate(value) {
  if (!value) return null;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return null;
  return value;
}

function centsToDollars(cents) {
  return Number(((cents || 0) / 100).toFixed(2));
}

function getTimeZoneParts(date, timeZone) {
  const fmt = new Intl.DateTimeFormat('en-US', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  });
  const parts = fmt.formatToParts(date);
  const pick = (type) => Number(parts.find((p) => p.type === type)?.value || 0);
  return {
    year: pick('year'),
    month: pick('month'),
    day: pick('day'),
    hour: pick('hour'),
    minute: pick('minute'),
    second: pick('second'),
  };
}

function getOffsetMinutes(utcDate, timeZone) {
  const p = getTimeZoneParts(utcDate, timeZone);
  const asUtc = Date.UTC(p.year, p.month - 1, p.day, p.hour, p.minute, p.second);
  return Math.round((asUtc - utcDate.getTime()) / 60000);
}

function localDateTimeToUtcIso(dateIso, hour, minute, second, millisecond, timeZone) {
  const [year, month, day] = dateIso.split('-').map(Number);
  let utcMillis = Date.UTC(year, month - 1, day, hour, minute, second, millisecond);
  for (let i = 0; i < 3; i += 1) {
    const offsetMin = getOffsetMinutes(new Date(utcMillis), timeZone);
    const adjusted = Date.UTC(year, month - 1, day, hour, minute, second, millisecond) - (offsetMin * 60000);
    if (adjusted === utcMillis) break;
    utcMillis = adjusted;
  }
  return new Date(utcMillis).toISOString();
}

function buildWindow(dateIso, timeZone) {
  return {
    start: localDateTimeToUtcIso(dateIso, 0, 0, 0, 0, timeZone),
    end: localDateTimeToUtcIso(dateIso, 23, 59, 59, 999, timeZone),
  };
}

function dateInTimeZone(timeZone) {
  const p = getTimeZoneParts(new Date(), timeZone);
  const pad = (n) => String(n).padStart(2, '0');
  return `${p.year}-${pad(p.month)}-${pad(p.day)}`;
}

function hourInTimeZone(isoDateTime, timeZone) {
  const dt = new Date(isoDateTime);
  if (Number.isNaN(dt.getTime())) return null;
  const fmt = new Intl.DateTimeFormat('en-US', {
    timeZone,
    hour: '2-digit',
    hour12: false,
  });
  const value = Number(fmt.format(dt));
  return Number.isFinite(value) ? value : null;
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
    const message = data?.errors?.[0]?.detail || 'Square API error';
    const error = new Error(message);
    error.status = res.status;
    error.square = data;
    throw error;
  }
  return data;
}

async function squareGet(path, token, params) {
  const query = new URLSearchParams();
  Object.entries(params || {}).forEach(([k, v]) => {
    if (v !== undefined && v !== null && v !== '') query.set(k, String(v));
  });
  const res = await fetch(`${SQUARE_BASE}${path}?${query.toString()}`, {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${token}`,
      'Square-Version': '2024-12-18',
    },
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const message = data?.errors?.[0]?.detail || 'Square API error';
    const error = new Error(message);
    error.status = res.status;
    error.square = data;
    throw error;
  }
  return data;
}

async function fetchOrdersSummary(token, locationId, dateIso) {
  const { start, end } = buildWindow(dateIso, MIAMI_TZ);
  let cursor;
  const orders = [];

  do {
    const payload = {
      location_ids: [locationId],
      query: {
        filter: {
          date_time_filter: {
            closed_at: { start_at: start, end_at: end },
          },
          state_filter: {
            states: ['COMPLETED'],
          },
        },
        sort: {
          sort_field: 'CLOSED_AT',
          sort_order: 'ASC',
        },
      },
      limit: 200,
      cursor,
    };
    const data = await squarePost('/orders/search', token, payload);
    const chunk = Array.isArray(data.orders) ? data.orders : [];
    orders.push(...chunk);
    cursor = data.cursor;
  } while (cursor);

  return orders;
}

async function fetchPaymentsSummary(token, locationId, dateIso) {
  const { start, end } = buildWindow(dateIso, MIAMI_TZ);
  let cursor;
  const payments = [];

  do {
    const params = {
      location_id: locationId,
      begin_time: start,
      end_time: end,
      sort_order: 'ASC',
      limit: 100,
      cursor,
    };
    const data = await squareGet('/payments', token, params);
    const chunk = Array.isArray(data.payments) ? data.payments : [];
    payments.push(...chunk);
    cursor = data.cursor;
  } while (cursor);

  return payments;
}

function summarizeOrders(orders, timeZone) {
  let grossCents = 0;
  const topItems = new Map();
  const salesByHour = Array.from({ length: 24 }, (_, hour) => ({ hour, grossSales: 0 }));
  const windows = {
    '07-10': { grossSales: 0, orderCount: 0 },
    '10-15': { grossSales: 0, orderCount: 0 },
  };

  for (const order of orders) {
    const total = order?.total_money?.amount || 0;
    grossCents += total;
    const hour = order?.closed_at ? hourInTimeZone(order.closed_at, timeZone) : null;
    if (hour !== null && salesByHour[hour]) {
      salesByHour[hour].grossSales += centsToDollars(total);
      if (hour >= 7 && hour < 10) windows['07-10'].grossSales += centsToDollars(total);
      if (hour >= 10 && hour < 15) windows['10-15'].grossSales += centsToDollars(total);
      if (hour >= 7 && hour < 10) windows['07-10'].orderCount += 1;
      if (hour >= 10 && hour < 15) windows['10-15'].orderCount += 1;
    }

    const lines = Array.isArray(order?.line_items) ? order.line_items : [];
    for (const line of lines) {
      const name = line?.name || 'Unknown Item';
      const qty = Number(line?.quantity || 0);
      const amount = line?.gross_sales_money?.amount || line?.total_money?.amount || 0;
      const existing = topItems.get(name) || { name, quantity: 0, grossSales: 0 };
      existing.quantity += Number.isFinite(qty) ? qty : 0;
      existing.grossSales += centsToDollars(amount);
      topItems.set(name, existing);
    }
  }

  const orderCount = orders.length;
  const grossSales = centsToDollars(grossCents);
  const averageTicket = orderCount > 0 ? Number((grossSales / orderCount).toFixed(2)) : 0;
  const top = [...topItems.values()]
    .sort((a, b) => b.grossSales - a.grossSales)
    .slice(0, 5)
    .map((item) => ({
      ...item,
      quantity: Number(item.quantity.toFixed(2)),
      grossSales: Number(item.grossSales.toFixed(2)),
    }));

  return {
    grossSales,
    orderCount,
    averageTicket,
    topItems: top,
    salesByHour: salesByHour.map((h) => ({ hour: h.hour, grossSales: Number(h.grossSales.toFixed(2)) })),
    timeWindows: {
      '07-10': {
        grossSales: Number(windows['07-10'].grossSales.toFixed(2)),
        orderCount: windows['07-10'].orderCount,
      },
      '10-15': {
        grossSales: Number(windows['10-15'].grossSales.toFixed(2)),
        orderCount: windows['10-15'].orderCount,
      },
    },
  };
}

function summarizePayments(payments) {
  const byMethod = {};
  const byChannel = {};
  for (const payment of payments) {
    if (payment?.status !== 'COMPLETED') continue;
    const method =
      payment?.card_details?.card?.card_brand ||
      payment?.source_type ||
      payment?.payment_method_details?.type ||
      'UNKNOWN';
    const channel =
      payment?.app_details?.application_details?.square_product ||
      payment?.processing_fee?.[0]?.type ||
      'UNKNOWN';
    byMethod[method] = (byMethod[method] || 0) + 1;
    byChannel[channel] = (byChannel[channel] || 0) + 1;
  }
  return {
    paymentMethodBreakdown: byMethod,
    channelBreakdown: byChannel,
  };
}

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return send(res, 405, { code: 'METHOD_NOT_ALLOWED', message: 'Use GET.' });
  }

  const token = process.env.SQUARE_ACCESS_TOKEN;
  const locationId = process.env.SQUARE_LOCATION_ID;
  const squareEnv = process.env.SQUARE_ENVIRONMENT || 'production';
  if (!token) return send(res, 500, { code: 'TOKEN_MISSING', message: 'SQUARE_ACCESS_TOKEN missing.' });
  if (!locationId) return send(res, 500, { code: 'LOCATION_MISSING', message: 'SQUARE_LOCATION_ID missing.' });
  if (squareEnv !== 'production') {
    return send(res, 400, {
      code: 'INVALID_ENVIRONMENT',
      message: 'SQUARE_ENVIRONMENT must be production for this endpoint.',
    });
  }

  const requestedDate = toIsoDate(req.query?.date) || dateInTimeZone(MIAMI_TZ);

  try {
    const [orders, payments] = await Promise.all([
      fetchOrdersSummary(token, locationId, requestedDate),
      fetchPaymentsSummary(token, locationId, requestedDate),
    ]);
    if (!orders.length && !payments.length) {
      return send(res, 404, { code: 'NO_SALES', message: 'No sales found for requested date.' });
    }

    const orderSummary = summarizeOrders(orders, MIAMI_TZ);
    const paymentSummary = summarizePayments(payments);

    return send(res, 200, {
      summary: {
        date: requestedDate,
        grossSales: orderSummary.grossSales,
        orderCount: orderSummary.orderCount,
        averageTicket: orderSummary.averageTicket,
        topItems: orderSummary.topItems,
        salesByHour: orderSummary.salesByHour,
        timeWindows: orderSummary.timeWindows,
        paymentMethodBreakdown: paymentSummary.paymentMethodBreakdown,
        channelBreakdown: paymentSummary.channelBreakdown,
      },
    });
  } catch (err) {
    return send(res, 502, {
      code: 'SQUARE_API_ERROR',
      message: err?.message || 'Failed to fetch Square data.',
      details: err?.square?.errors || null,
    });
  }
}

