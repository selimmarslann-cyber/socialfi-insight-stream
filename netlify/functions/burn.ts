import type { Handler } from '@netlify/functions';

interface BurnPayload {
  total: number;
  last24h: number;
  series?: { t: number; v: number }[];
  updatedAt: string;
}

let inMemory: BurnPayload = {
  total: 125_000_000,
  last24h: 450_000,
  series: [],
  updatedAt: new Date().toISOString(),
};

const handler: Handler = async (event) => {
  if (event.httpMethod === 'POST') {
    const token = event.headers.authorization;
    if (token !== `Bearer ${process.env.ADMIN_TOKEN}`) {
      return {
        statusCode: 401,
        body: 'unauthorized',
      };
    }

    try {
      const body = JSON.parse(event.body || '{}');
      inMemory = {
        total: Number(body.total ?? 0),
        last24h: Number(body.last24h ?? 0),
        series: Array.isArray(body.series) ? body.series : [],
        updatedAt: new Date().toISOString(),
      };
      return {
        statusCode: 200,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(inMemory),
      };
    } catch (error) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'invalid_payload', message: String(error) }),
      };
    }
  }

  return {
    statusCode: 200,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(inMemory),
  };
};

export { handler };
