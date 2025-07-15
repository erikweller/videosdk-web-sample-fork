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
    <!DOCTYPE html>
    <html lang="en">
      <head>
        <meta charset="UTF-8" />
        <title>Zoom Join Links</title>
        <style>
          body {
            font-family: system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif;
            background: #f9fafb;
            color: #111827;
            padding: 40px;
            line-height: 1.6;
          }
          h1 {
            font-size: 1.8em;
            margin-bottom: 0.5em;
            color: #2563eb;
          }
          ul {
            padding-left: 1em;
          }
          li {
            margin: 0.5em 0;
            font-size: 1.1em;
          }
          a {
            color: #2563eb;
            text-decoration: none;
            font-weight: 500;
          }
          a:hover {
            text-decoration: underline;
          }
          .container {
            max-width: 600px;
            margin: 0 auto;
            background: white;
            padding: 2em;
            border-radius: 10px;
            box-shadow: 0 5px 15px rgba(0,0,0,0.05);
          }
          code {
            font-size: 0.9em;
            background: #f3f4f6;
            padding: 0.2em 0.4em;
            border-radius: 4px;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <h1>🔗 Zoom Join Links</h1>
          <p><strong>Meeting Topic:</strong> <code>${topic}</code></p>
          <ul>
            ${links
              .map(
                ({ name, url }) =>
                  `<li><strong>${name}:</strong> <a href="${url}" target="_blank">Join as ${name}</a></li>`
              )
              .join('\n')}
          </ul>
        </div>
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
