import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// Determine __dirname for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Construct the path to the .env file in the project root
const projectRoot = path.resolve(__dirname, '..', '..'); // Adjust if server/index.ts is nested deeper
dotenv.config({ path: path.resolve(projectRoot, '.env') });

// Debug: Log environment variables
console.log('Attempting to load environment variables from:', path.resolve(projectRoot, '.env'));
console.log('NEXT_PUBLIC_SUPABASE_URL:', process.env.NEXT_PUBLIC_SUPABASE_URL);
console.log('SUPABASE_SERVICE_KEY:', process.env.SUPABASE_SERVICE_KEY);

import express from 'express';
import cors from 'cors';
import { createClient } from '@supabase/supabase-js';
import multer from 'multer';
import { scrapeAnime } from '../lib/scrapers/anime.js';
import { scrapeManga } from '../lib/scrapers/manga.js';
import rateLimit from 'express-rate-limit';
import helmet from 'helmet';

const app = express();
const port = process.env.PORT || 3001;

// Security middleware
app.use(helmet());
app.use(cors());
app.use(express.json());

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100 // limit each IP to 100 requests per windowMs
});

app.use(limiter);

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY!;

console.log('Supabase URL for client:', supabaseUrl);
console.log('Supabase Service Key for client:', supabaseServiceKey);

const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: 'uploads/',
  filename: (req, file, cb) => {
    cb(null, `${Date.now()}-${file.originalname}`);
  }
});

const upload = multer({ storage });

app.use('/uploads', express.static('uploads'));

// Scraping endpoints
app.get('/api/scrape/anime', async (req, res) => {
  try {
    const animeList = await scrapeAnime();
    res.json(animeList);
  } catch (error) {
    console.error('Error scraping anime:', error);
    res.status(500).json({ error: 'Failed to scrape anime content' });
  }
});

app.get('/api/scrape/manga', async (req, res) => {
  try {
    const mangaList = await scrapeManga();
    res.json(mangaList);
  } catch (error) {
    console.error('Error scraping manga:', error);
    res.status(500).json({ error: 'Failed to scrape manga content' });
  }
});

// Routes for streaming content
app.post('/api/stream/create', upload.single('thumbnail'), async (req, res) => {
  try {
    const { title, type, description, genres } = req.body;
    const thumbnailPath = req.file ? `/uploads/${req.file.filename}` : null;

    const { data, error } = await supabase
      .from('streaming_content')
      .insert({
        title,
        type,
        description,
        genres,
        thumbnail: thumbnailPath,
        created_at: new Date()
      })
      .select()
      .single();

    if (error) throw error;
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: 'Failed to create streaming content' });
  }
});

app.put('/api/stream/:id', upload.single('thumbnail'), async (req, res) => {
  try {
    const { id } = req.params;
    const { title, type, description, genres } = req.body;
    const thumbnailPath = req.file ? `/uploads/${req.file.filename}` : undefined;

    const updates: any = {
      title,
      type,
      description,
      genres,
      updated_at: new Date()
    };

    if (thumbnailPath) {
      updates.thumbnail = thumbnailPath;
    }

    const { data, error } = await supabase
      .from('streaming_content')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update streaming content' });
  }
});

// Routes for comics content
app.post('/api/comics/create', upload.single('cover'), async (req, res) => {
  try {
    const { title, type, author, description, genres } = req.body;
    const coverPath = req.file ? `/uploads/${req.file.filename}` : null;

    const { data, error } = await supabase
      .from('comics_content')
      .insert({
        title,
        type,
        author,
        description,
        genres,
        cover: coverPath,
        created_at: new Date()
      })
      .select()
      .single();

    if (error) throw error;
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: 'Failed to create comic content' });
  }
});

app.put('/api/comics/:id', upload.single('cover'), async (req, res) => {
  try {
    const { id } = req.params;
    const { title, type, author, description, genres } = req.body;
    const coverPath = req.file ? `/uploads/${req.file.filename}` : undefined;

    const updates: any = {
      title,
      type,
      author,
      description,
      genres,
      updated_at: new Date()
    };

    if (coverPath) {
      updates.cover = coverPath;
    }

    const { data, error } = await supabase
      .from('comics_content')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update comic content' });
  }
});

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});