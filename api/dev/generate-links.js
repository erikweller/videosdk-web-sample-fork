

const { KJUR } = require('jsrsasign');

const SDK_KEY = process.env.ZOOM_SDK_KEY;
const SDK_SECRET = process.env.ZOOM_SDK_SECRET;

if (!SDK_KEY || !SDK_SECRET) {
  throw new Error('Missing ZOOM_SDK_KEY or ZOOM_SDK_SECRET in env');
}

function generateSignature(topic, role) {
  const iat = Math.floor(Date.now() / 1000) - 30;
  const exp = iat + 60 * 60 * 2;

  const header = { alg: 'HS256', typ: 'JWT' };
  const payload = {
    app_key: SDK_KEY,
    tpc: topic,
    role_type: role,
    iat,
    exp,
    tokenExp: exp
  };

  return KJUR.jws.JWS.sign('HS256', JSON.stringify(header), JSON.stringify(payload), SDK_SECRET);
}

module.exports = async (req, res) => {
  try {
    const topic = `cv-dev-meeting-${Date.now()}`;
    const base = 'https://videosdk-web-sample-fork.vercel.app/video';

    const participants = [
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

    if (req.query?.format === 'html') {
      const html = `
        <html>
          <head><title>Zoom Join Links</title></head>
          <body>
            <h1>🔗 Join Links for ${topic}</h1>
            <ul>
              ${links.map(({ name, url }) => `<li><a href="${url}" target="_blank">${name}</a></li>`).join('\n')}
            </ul>
          </body>
        </html>
      `;
      res.setHeader('Content-Type', 'text/html');
      return res.status(200).send(html);
    }

    return res.status(200).json({ topic, links });
  } catch (e) {
    console.error('❌ generate-links crashed:', e);
    return res.status(500).json({ error: 'Internal Server Error', message: e.message });
  }
};
