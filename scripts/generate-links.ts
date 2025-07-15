import { KJUR } from 'jsrsasign';
import 'dotenv/config';

const SDK_KEY = process.env.ZOOM_SDK_KEY!;
const SDK_SECRET = process.env.ZOOM_SDK_SECRET!;
const BASE_URL = 'http://localhost:3000/video'; // or your dev URL

if (!SDK_KEY || !SDK_SECRET) {
  console.error('❌ Missing ZOOM_SDK_KEY or ZOOM_SDK_SECRET in .env.local');
  process.exit(1);
}

function generateSignature(topic: string, role: 0 | 1): string {
  const iat = Math.floor(Date.now() / 1000) - 30;
  const exp = iat + 60 * 60 * 2;

  const header = { alg: 'HS256', typ: 'JWT' };
  const payload = {
    app_key: SDK_KEY,
    tpc: topic,
    role_type: role, // ✅ Zoom requires this field for Video SDK
    iat,
    exp,
    tokenExp: exp
  };

  return KJUR.jws.JWS.sign('HS256', JSON.stringify(header), JSON.stringify(payload), SDK_SECRET);
}

const topic = `cv-dev-meeting-${Date.now()}`;
const participants = [
  { name: 'Erik Weller', role: 0 },
  { name: 'CareVillage: Lani Weller', role: 1 },
  { name: 'Leopold Weller', role: 0 },
  { name: 'Lucian Weller', role: 0 }
];

console.log(`\n🔗 Generated Zoom Video SDK Meeting Links for topic: ${topic}\n`);

participants.forEach(({ name, role }) => {
  const signature = generateSignature(topic, role as 0 | 1);
  const url = `${BASE_URL}?topic=${topic}&name=${encodeURIComponent(name)}&sdkKey=${SDK_KEY}&signature=${signature}&role=${role}`;
  console.log(`${name.padEnd(10)} → ${url}`);
});

console.log('\n✅ Use the above links to open different roles in separate browser windows.\n');
