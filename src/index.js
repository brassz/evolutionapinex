import 'dotenv/config';
import express from 'express';
import { z } from 'zod';

const envSchema = z.object({
  PORT: z.string().optional(),
  EVOLUTION_API_URL: z.string().min(1),
  EVOLUTION_API_KEY: z.string().min(1),
  EVOLUTION_INSTANCE: z.string().min(1),
  // Optional shared secret to protect inbound webhook
  EVOLUTION_WEBHOOK_SECRET: z.string().min(1).optional()
});

const envParsed = envSchema.safeParse(process.env);
if (!envParsed.success) {
  // Avoid dumping all env; only show validation issues.
  console.error('Invalid environment variables:', envParsed.error.flatten().fieldErrors);
  process.exit(1);
}

const { PORT, EVOLUTION_API_URL, EVOLUTION_API_KEY, EVOLUTION_INSTANCE, EVOLUTION_WEBHOOK_SECRET } = envParsed.data;

const app = express();
app.use(express.json({ limit: '1mb' }));

app.get('/health', (_req, res) => {
  res.status(200).json({ ok: true });
});

app.post('/webhook/evolution', (req, res) => {
  if (EVOLUTION_WEBHOOK_SECRET) {
    const provided = req.header('x-webhook-secret');
    if (!provided || provided !== EVOLUTION_WEBHOOK_SECRET) {
      return res.status(401).json({ ok: false, error: 'unauthorized' });
    }
  }

  // Acknowledge quickly; you can later extend this to route/store events.
  return res.status(200).json({ ok: true, received: req.body ?? null });
});

app.post('/send-text', async (req, res) => {
  const bodySchema = z.object({
    to: z.string().min(3),
    text: z.string().min(1)
  });

  const parsed = bodySchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: 'invalid_body', details: parsed.error.flatten() });
  }

  try {
    const resp = await fetch(`${EVOLUTION_API_URL.replace(/\/$/, '')}/message/sendText/${encodeURIComponent(EVOLUTION_INSTANCE)}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        apikey: EVOLUTION_API_KEY
      },
      body: JSON.stringify({
        number: parsed.data.to,
        textMessage: {
          text: parsed.data.text
        }
      })
    });

    const contentType = resp.headers.get('content-type') || '';
    const payload = contentType.includes('application/json') ? await resp.json() : await resp.text();

    if (!resp.ok) {
      return res.status(resp.status).json({
        error: 'evolution_api_error',
        status: resp.status,
        payload
      });
    }

    return res.status(200).json({ ok: true, payload });
  } catch (e) {
    return res.status(502).json({ error: 'upstream_unreachable', message: e?.message ?? String(e) });
  }
});

const port = Number(PORT ?? 3000);
app.listen(port, () => {
  console.log(`Listening on :${port}`);
});

