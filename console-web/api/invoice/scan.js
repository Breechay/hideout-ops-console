const ANTHROPIC_API = 'https://api.anthropic.com/v1/messages';

function send(res, status, payload) {
  res.status(status).json(payload);
}

function inferMime(file) {
  if (!file || !file.mimetype) return 'image/jpeg';
  return file.mimetype;
}

function normalizeSupplier(raw) {
  const text = String(raw || '').trim();
  if (!text) return '';
  const known = [
    'Instacart',
    'Zak the Baker',
    "Perl'a",
    'BOLA Granola',
    'Restaurant Depot',
    'Amazon',
    'WebstaurantStore',
    'Sprouts',
    'Live Ultimate Shrooms',
    'Terrasoul',
    'Costco',
    'Other',
  ];
  const low = text.toLowerCase();
  const match = known.find((k) => low.includes(k.toLowerCase()) || k.toLowerCase().includes(low));
  return match || text;
}

export const config = {
  api: {
    bodyParser: false,
  },
};

export default async function handler(req, res) {
  if (req.method !== 'POST') return send(res, 405, { code: 'METHOD_NOT_ALLOWED' });
  const key = process.env.ANTHROPIC_API_KEY;
  if (!key) return send(res, 500, { code: 'ANTHROPIC_KEY_MISSING', message: 'ANTHROPIC_API_KEY missing.' });

  try {
    const form = await req.formData();
    const file = form.get('file');
    if (!file || typeof file.arrayBuffer !== 'function') {
      return send(res, 400, { code: 'FILE_REQUIRED', message: 'Attach an invoice image.' });
    }
    const mimeType = inferMime(file);
    const bytes = await file.arrayBuffer();
    const base64 = Buffer.from(bytes).toString('base64');

    const prompt = [
      'Read this invoice/receipt image and extract:',
      '1) supplier name',
      '2) total amount in USD',
      'Return strict JSON with keys: supplier, amount.',
      'amount must be a number, no currency symbol.',
      'If unclear, use empty supplier and amount 0.',
    ].join(' ');

    const response = await fetch(ANTHROPIC_API, {
      method: 'POST',
      headers: {
        'x-api-key': key,
        'anthropic-version': '2023-06-01',
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        model: 'claude-3-5-sonnet-latest',
        max_tokens: 220,
        messages: [
          {
            role: 'user',
            content: [
              { type: 'image', source: { type: 'base64', media_type: mimeType, data: base64 } },
              { type: 'text', text: prompt },
            ],
          },
        ],
      }),
    });
    const body = await response.json().catch(() => ({}));
    if (!response.ok) {
      return send(res, 502, { code: 'VISION_ERROR', message: body?.error?.message || 'Invoice scan failed.' });
    }

    const text = body?.content?.map((c) => c?.text || '').join('\n') || '{}';
    let parsed = {};
    try {
      const jsonStart = text.indexOf('{');
      const jsonEnd = text.lastIndexOf('}');
      const raw = jsonStart >= 0 && jsonEnd > jsonStart ? text.slice(jsonStart, jsonEnd + 1) : text;
      parsed = JSON.parse(raw);
    } catch (err) {
      parsed = {};
    }

    const supplier = normalizeSupplier(parsed.supplier || '');
    const amount = Number(parsed.amount || 0);
    return send(res, 200, {
      supplier,
      amount: Number.isFinite(amount) ? Number(amount.toFixed(2)) : 0,
    });
  } catch (err) {
    return send(res, 500, { code: 'SCAN_FAILED', message: 'Could not scan invoice image.' });
  }
}
