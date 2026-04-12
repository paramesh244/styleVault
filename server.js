// ===================================================================
// StyleVault Local Development Server
// Mirrors the Vercel serverless function at /api/index.js
// Run with: node server.js
// ===================================================================

import express from 'express';
import cors from 'cors';
import mongoose from 'mongoose';
import admin from 'firebase-admin';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// ─── Middleware ───────────────────────────────────────────────
app.use(cors());
app.use(express.json({ limit: '20mb' }));

// ─── Firebase Admin Init ─────────────────────────────────────
if (!admin.apps.length) {
  const projectId = process.env.FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n');

  if (projectId && clientEmail && privateKey) {
    admin.initializeApp({
      credential: admin.credential.cert({ projectId, clientEmail, privateKey }),
    });
    console.log('✅ Firebase Admin initialized');
  } else {
    console.warn('⚠️  Firebase Admin credentials not set — auth will be skipped in dev mode');
    // Initialize without credentials for dev mode
    admin.initializeApp({ projectId: 'stylevault-dev' });
  }
}

// ─── MongoDB Connection ──────────────────────────────────────
const MONGO_URI = process.env.VITE_MONGO_DB_URL;

if (!MONGO_URI) {
  console.error('❌ VITE_MONGO_DB_URL not set in .env');
  process.exit(1);
}

let dbConnected = false;

async function connectDB() {
  try {
    await mongoose.connect(MONGO_URI, { dbName: 'stylevault' });
    dbConnected = true;
    console.log('✅ Connected to MongoDB Atlas');
  } catch (err) {
    dbConnected = false;
    console.error('⚠️  MongoDB connection failed:', err.message);
    console.error('💡 TIP: Whitelist your IP in MongoDB Atlas → Network Access');
    console.error('   Retrying in 10 seconds...');
    setTimeout(connectDB, 10000);
  }
}

connectDB();

// ─── Auth Middleware ─────────────────────────────────────────
async function authenticate(req, res, next) {
  const authHeader = req.headers.authorization;

  // Dev mode: if Firebase Admin has no real credentials, accept any token
  if (!process.env.FIREBASE_PRIVATE_KEY) {
    // In dev, extract uid from token or use a default
    if (authHeader && authHeader.startsWith('Bearer ')) {
      try {
        const token = authHeader.split('Bearer ')[1];
        const decoded = await admin.auth().verifyIdToken(token);
        req.uid = decoded.uid;
      } catch {
        // If verification fails in dev, use a fallback uid
        req.uid = 'dev-user';
      }
    } else {
      req.uid = 'dev-user';
    }
    return next();
  }

  // Production: require valid token
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Missing authorization header' });
  }

  const token = authHeader.split('Bearer ')[1];
  try {
    const decoded = await admin.auth().verifyIdToken(token);
    req.uid = decoded.uid;
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
}

function requireDBAndAuth(req, res, next) {
  if (!dbConnected && mongoose.connection.readyState !== 1) {
    return res.status(503).json({
      error: 'Database not connected. Whitelist your IP in MongoDB Atlas.',
    });
  }
  return authenticate(req, res, next);
}

app.use('/api/clothes', requireDBAndAuth);
app.use('/api/outfits', requireDBAndAuth);
app.use('/api/settings', requireDBAndAuth);
app.use('/api/data', requireDBAndAuth);

// ─── Schemas ─────────────────────────────────────────────────

const clothingSchema = new mongoose.Schema({
  uid:              { type: String, required: true, index: true },
  name:             { type: String, required: true },
  type:             { type: String, enum: ['tops', 'bottoms', 'dresses', 'outerwear', 'shoes', 'accessories'], required: true },
  subType:          { type: String, default: '' },
  colors:           { type: [String], default: [] },
  pattern:          { type: String, default: '' },
  material:         { type: String, default: '' },
  formality:        { type: String, default: 'casual' },
  seasons:          { type: [String], default: [] },
  occasions:        { type: [String], default: [] },
  description:      { type: String, default: '' },
  fit:              { type: String, default: '' },
  versatility:      { type: Number, default: 0 },
  pairsWith:        { type: [String], default: [] },
  careInstructions:  { type: String, default: '' },
  imageDataUrl:     { type: String, default: '' },
  thumbnailDataUrl: { type: String, default: '' },
  createdAt:        { type: Number, default: () => Date.now() },
});

const outfitSchema = new mongoose.Schema({
  uid:            { type: String, required: true, index: true },
  name:           { type: String, default: 'Saved Outfit' },
  clothingIds:    { type: [String], default: [] },
  occasion:       { type: String, default: '' },
  aiReasoning:    { type: String, default: '' },
  styleNotes:     { type: String, default: '' },
  confidence:     { type: Number, default: 0 },
  colorStory:     { type: String, default: '' },
  missingPieces:  { type: [String], default: [] },
  savedAt:        { type: Number, default: () => Date.now() },
});

const settingSchema = new mongoose.Schema({
  uid:   { type: String, required: true, index: true },
  key:   { type: String, required: true },
  value: { type: mongoose.Schema.Types.Mixed },
});
settingSchema.index({ uid: 1, key: 1 }, { unique: true });

const Clothing = mongoose.models.Clothing || mongoose.model('Clothing', clothingSchema);
const Outfit   = mongoose.models.Outfit   || mongoose.model('Outfit', outfitSchema);
const Setting  = mongoose.models.Setting  || mongoose.model('Setting', settingSchema);

// ─── Clothing Routes ─────────────────────────────────────────

app.get('/api/clothes', async (req, res) => {
  try {
    const items = await Clothing.find({ uid: req.uid }).sort({ createdAt: -1 }).lean();
    const mapped = items.map((item) => ({ ...item, id: item._id.toString() }));
    res.json(mapped);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/clothes/count', async (req, res) => {
  try {
    const count = await Clothing.countDocuments({ uid: req.uid });
    res.json({ count });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/clothes/:id', async (req, res) => {
  try {
    const item = await Clothing.findOne({ _id: req.params.id, uid: req.uid }).lean();
    if (!item) return res.status(404).json({ error: 'Not found' });
    res.json({ ...item, id: item._id.toString() });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/clothes', async (req, res) => {
  try {
    const item = await Clothing.create({ ...req.body, uid: req.uid, createdAt: Date.now() });
    res.status(201).json({ ...item.toObject(), id: item._id.toString() });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

app.put('/api/clothes/:id', async (req, res) => {
  try {
    const item = await Clothing.findOneAndUpdate(
      { _id: req.params.id, uid: req.uid },
      req.body,
      { new: true }
    ).lean();
    if (!item) return res.status(404).json({ error: 'Not found' });
    res.json({ ...item, id: item._id.toString() });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

app.delete('/api/clothes/:id', async (req, res) => {
  try {
    const deletedId = req.params.id;
    await Clothing.findOneAndDelete({ _id: deletedId, uid: req.uid });

    const outfits = await Outfit.find({ uid: req.uid, clothingIds: deletedId });
    for (const outfit of outfits) {
      const newIds = outfit.clothingIds.filter((cid) => cid !== deletedId);
      if (newIds.length < 2) {
        await Outfit.findByIdAndDelete(outfit._id);
      } else {
        outfit.clothingIds = newIds;
        await outfit.save();
      }
    }

    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── Outfit Routes ───────────────────────────────────────────

app.get('/api/outfits', async (req, res) => {
  try {
    const outfits = await Outfit.find({ uid: req.uid }).sort({ savedAt: -1 }).lean();
    const mapped = outfits.map((o) => ({ ...o, id: o._id.toString() }));
    res.json(mapped);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/outfits', async (req, res) => {
  try {
    const outfit = await Outfit.create({ ...req.body, uid: req.uid, savedAt: Date.now() });
    res.status(201).json({ ...outfit.toObject(), id: outfit._id.toString() });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

app.delete('/api/outfits/:id', async (req, res) => {
  try {
    await Outfit.findOneAndDelete({ _id: req.params.id, uid: req.uid });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── Settings Routes ─────────────────────────────────────────

app.get('/api/settings/:key', async (req, res) => {
  try {
    const setting = await Setting.findOne({ uid: req.uid, key: req.params.key }).lean();
    res.json({ value: setting ? setting.value : null });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/settings/:key', async (req, res) => {
  try {
    await Setting.findOneAndUpdate(
      { uid: req.uid, key: req.params.key },
      { uid: req.uid, key: req.params.key, value: req.body.value },
      { upsert: true, new: true }
    );
    res.json({ success: true });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// ─── Clear All Data ──────────────────────────────────────────

app.delete('/api/data', async (req, res) => {
  try {
    await Clothing.deleteMany({ uid: req.uid });
    await Outfit.deleteMany({ uid: req.uid });
    await Setting.deleteMany({ uid: req.uid });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── Health Check ────────────────────────────────────────────
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', db: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected' });
});

// ─── Start Server ────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`🚀 StyleVault API running on http://localhost:${PORT}`);
});
