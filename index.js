const express = require('express');
const admin = require('firebase-admin');

const serviceAccount = JSON.parse(process.env.SERVICE_ACCOUNT);
const authUser = 'riaLogistic';
const authPass = 'notiLogisticRia';

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

const app = express();
app.use(express.json()); // ✅ เพื่อให้ parse JSON body ได้

app.post('/send-logistic-noti', async (req, res) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Basic ')) {
    return res.status(401).set('WWW-Authenticate', 'Basic').send('Unauthorized');
  }

  const base64Credentials = authHeader.split(' ')[1];
  const credentials = Buffer.from(base64Credentials, 'base64').toString('utf8');
  const [username, password] = credentials.split(':');

  if (username !== authUser || password !== authPass) {
    return res.status(403).send('Forbidden');
  }

  const { tokens, title, body } = req.body;

  if (!Array.isArray(tokens) || tokens.length === 0 || !title || !body) {
    return res.status(400).json({ error: 'Missing or invalid tokens, title, or body' });
  }

  try {
    // ✅ ใช้ sendEachForMulticast แทน sendEach
    const sendResult = await admin.messaging().sendEachForMulticast({
      tokens,
      notification: { title, body },
    });

    res.status(200).json({
      successCount: sendResult.successCount,
      failureCount: sendResult.failureCount,
      responses: sendResult.responses,
    });

  } catch (error) {
    console.error('🔥 sendEachForMulticast error:', error);
    res.status(500).json({ error: error.message });
  }
});

// ✅ ฟัง PORT จาก Render
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
