import { type VercelRequest, type VercelResponse } from '@vercel/node';
import { KJUR } from 'jsrsasign';

const SDK_KEY = process.env.ZOOM_SDK_KEY!;
const SDK_SECRET = process.env.ZOOM_SDK_SECRET!;

if (!SDK_KEY || !SDK_SECRET) {
  throw new Error('Missing ZOOM_SDK_KEY or ZOOM_SDK_SECRET in env');
}

function generateSignature(topic: string, role: 0 | 1): string {
  const iat = Math.floor(Date.now() / 1000) - 30;
  const exp = iat + 60 * 60 * 2;

  const header = { alg: 'HS256', typ: 'JWT' };
  const payload = {
    app_key: SDK_KEY,
    tpc: topic,
    role_type: role, // ✅ Note: Zoom Video SDK expects `role_type`, not just `role`
    iat,
    exp,
    tokenExp: exp
  };

  return KJUR.jws.JWS.sign('HS256', JSON.stringify(header), JSON.stringify(payload), SDK_SECRET);
}

export default function handler(req: VercelRequest, res: VercelResponse) {
  const topic = `cv-dev-meeting-${Date.now()}`;
  const base = 'https://YOUR-DEPLOYED-DOMAIN.vercel.app/video'; // ← Replace with your domain

  const participants: { name: string; role: 0 | 1 }[] = [
    { name: 'Erik Weller', role: 0 },
    { name: 'CareVillage: Lani Weller', role: 1 },
    { name: 'Lucian Weller', role: 0 },
    { name: 'Leopold Weller', role: 0 }
  ];

  const links = participants.map(({ name, role }) => {
    const signature = generateSignature(topic, role);
    const url = `${base}?topic=${topic}&name=${encodeURIComponent(name)}&sdkKey=${SDK_KEY}&signature=${signature}&role=${role}`;
    return { name, role, url };
  });

  res.status(200).json({ topic, links });
}
