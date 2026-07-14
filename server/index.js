import express from 'express';
import cors from 'cors';
import db from './db.js';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3001;

import basicAuth from 'express-basic-auth';

app.use(cors());
app.use(express.json());

// 보안: 사이트 전체를 아이디/비밀번호로 잠금 (Basic Auth)
app.use(basicAuth({
    users: { 'wuju': '797' },
    challenge: true,
    realm: 'Private Archive Dashboard',
    unauthorizedResponse: '인증이 필요합니다.'
}));

// --- Series API ---
app.get('/api/series', (req, res) => {
  try {
    const series = db.prepare('SELECT * FROM series').all();
    res.json(series);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/series', (req, res) => {
  try {
    const { name } = req.body;
    const stmt = db.prepare('INSERT INTO series (name) VALUES (?)');
    const info = stmt.run(name);
    res.json({ id: info.lastInsertRowid, name });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// --- Contents API ---
app.get('/api/contents', (req, res) => {
  try {
    const contents = db.prepare(`
      SELECT c.*, s.name as series_name 
      FROM contents c 
      LEFT JOIN series s ON c.series_id = s.id
    `).all();
    res.json(contents);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/contents', (req, res) => {
  try {
    const { title, type, status, rating, tags, platform, progress, watched_at, review, series_id, publication_status, release_year, part_number } = req.body;
    const stmt = db.prepare(`
      INSERT INTO contents (title, type, status, rating, tags, platform, progress, watched_at, review, series_id, publication_status, release_year, part_number) 
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    const info = stmt.run(title, type, status, rating, tags, platform, progress, watched_at, review, series_id, publication_status, release_year, part_number);
    res.json({ id: info.lastInsertRowid });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.put('/api/contents/:id', (req, res) => {
  try {
    const { id } = req.params;
    const { title, type, status, rating, tags, platform, progress, watched_at, review, series_id, publication_status, release_year, part_number } = req.body;
    const stmt = db.prepare(`
      UPDATE contents 
      SET title=?, type=?, status=?, rating=?, tags=?, platform=?, progress=?, watched_at=?, review=?, series_id=?, publication_status=?, release_year=?, part_number=? 
      WHERE id=?
    `);
    stmt.run(title, type, status, rating, tags, platform, progress, watched_at, review, series_id, publication_status, release_year, part_number, id);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.delete('/api/contents/:id', (req, res) => {
  try {
    const { id } = req.params;
    const stmt = db.prepare('DELETE FROM contents WHERE id=?');
    stmt.run(id);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.delete('/api/contents/:id/relations', (req, res) => {
  try {
    const { id } = req.params;
    const stmt = db.prepare('DELETE FROM content_relations WHERE source_id=? OR target_id=?');
    stmt.run(id, id);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// --- Content Relations API ---
app.get('/api/contents/:id/relations', (req, res) => {
  try {
    const { id } = req.params;
    const relations = db.prepare(`
      SELECT cr.id as relation_id, cr.relation_type, cr.source_id, cr.target_id,
             c.id, c.title, c.type, c.platform, c.release_year
      FROM content_relations cr
      JOIN contents c ON (cr.source_id = c.id OR cr.target_id = c.id)
      WHERE (cr.source_id = ? OR cr.target_id = ?) AND c.id != ?
    `).all(id, id, id);
    res.json(relations);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/content_relations', (req, res) => {
  try {
    const { source_id, target_id, relation_type } = req.body;
    const stmt = db.prepare('INSERT INTO content_relations (source_id, target_id, relation_type) VALUES (?, ?, ?)');
    const info = stmt.run(source_id, target_id, relation_type);
    res.json({ id: info.lastInsertRowid });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.delete('/api/content_relations/:id', (req, res) => {
  try {
    const { id } = req.params;
    const stmt = db.prepare('DELETE FROM content_relations WHERE id=?');
    stmt.run(id);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// --- Studies API ---
app.get('/api/studies', (req, res) => {
  try {
    const studies = db.prepare('SELECT * FROM studies').all();
    res.json(studies);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/studies', (req, res) => {
  try {
    const { title, color, category, description, target_date } = req.body;
    const stmt = db.prepare('INSERT INTO studies (title, color, category, description, target_date) VALUES (?, ?, ?, ?, ?)');
    const info = stmt.run(title, color || 'bg-sky-500', category || '기타', description || '', target_date || '');
    res.json({ id: info.lastInsertRowid });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.put('/api/studies/:id', (req, res) => {
  try {
    const { id } = req.params;
    const { title, total_tasks, completed_tasks, color, category, description, target_date } = req.body;
    const stmt = db.prepare('UPDATE studies SET title=?, total_tasks=?, completed_tasks=?, color=?, category=?, description=?, target_date=? WHERE id=?');
    stmt.run(title, total_tasks, completed_tasks, color, category || '기타', description || '', target_date || '', id);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// --- Todos API ---
app.get('/api/todos', (req, res) => {
  try {
    const todos = db.prepare('SELECT * FROM todos').all();
    // Convert SQLite 0/1 back to boolean for frontend convenience
    res.json(todos.map(t => ({ ...t, done: !!t.done })));
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/todos', (req, res) => {
  try {
    const { text, done, date, study_id } = req.body;
    const stmt = db.prepare('INSERT INTO todos (text, done, date, study_id) VALUES (?, ?, ?, ?)');
    const info = stmt.run(text, done ? 1 : 0, date, study_id || null);
    res.json({ id: info.lastInsertRowid });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.put('/api/todos/:id', (req, res) => {
  try {
    const { id } = req.params;
    const { text, done, date, study_id } = req.body;
    const stmt = db.prepare('UPDATE todos SET text=?, done=?, date=?, study_id=? WHERE id=?');
    stmt.run(text, done ? 1 : 0, date, study_id || null, id);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.delete('/api/todos/:id', (req, res) => {
  try {
    const { id } = req.params;
    const stmt = db.prepare('DELETE FROM todos WHERE id=?');
    stmt.run(id);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// --- Budget API ---
app.get('/api/budget', (req, res) => {
  try {
    const budget = db.prepare('SELECT * FROM budget ORDER BY date DESC').all();
    res.json(budget);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/budget', (req, res) => {
  try {
    const { category, amount, date, method } = req.body;
    const stmt = db.prepare('INSERT INTO budget (category, amount, date, method) VALUES (?, ?, ?, ?)');
    const info = stmt.run(category, amount, date, method || null);
    res.json({ id: info.lastInsertRowid });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.delete('/api/budget/:id', (req, res) => {
  try {
    const { id } = req.params;
    const stmt = db.prepare('DELETE FROM budget WHERE id=?');
    stmt.run(id);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// --- Memo Groups API ---
app.get('/api/memo_groups', (req, res) => {
  try {
    const groups = db.prepare('SELECT * FROM memo_groups').all();
    res.json(groups);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/memo_groups', (req, res) => {
  try {
    const { name } = req.body;
    const stmt = db.prepare('INSERT INTO memo_groups (name) VALUES (?)');
    const info = stmt.run(name);
    res.json({ id: info.lastInsertRowid });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// --- Memos API ---
app.get('/api/memos', (req, res) => {
  try {
    const memos = db.prepare('SELECT * FROM memos ORDER BY created_at DESC').all();
    res.json(memos);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/memos', (req, res) => {
  try {
    const { content, group_id } = req.body;
    const stmt = db.prepare('INSERT INTO memos (content, group_id) VALUES (?, ?)');
    const info = stmt.run(content, group_id);
    res.json({ id: info.lastInsertRowid });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.put('/api/memos/:id', (req, res) => {
  try {
    const { id } = req.params;
    const { content, group_id } = req.body;
    const stmt = db.prepare('UPDATE memos SET content=?, group_id=? WHERE id=?');
    stmt.run(content, group_id, id);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.delete('/api/memos/:id', (req, res) => {
  try {
    const { id } = req.params;
    const stmt = db.prepare('DELETE FROM memos WHERE id=?');
    stmt.run(id);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// --- Schedules API ---
app.get('/api/schedules', (req, res) => {
  try {
    const schedules = db.prepare('SELECT * FROM schedules ORDER BY date ASC, time ASC').all();
    res.json(schedules);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/schedules', (req, res) => {
  try {
    const { title, date, time, color } = req.body;
    const stmt = db.prepare('INSERT INTO schedules (title, date, time, color) VALUES (?, ?, ?, ?)');
    const info = stmt.run(title, date, time || null, color || null);
    res.json({ id: info.lastInsertRowid });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.put('/api/schedules/:id', (req, res) => {
  try {
    const { id } = req.params;
    const { title, date, time, color } = req.body;
    const stmt = db.prepare('UPDATE schedules SET title=?, date=?, time=?, color=? WHERE id=?');
    stmt.run(title, date, time || null, color || null, id);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.delete('/api/schedules/:id', (req, res) => {
  try {
    const { id } = req.params;
    const stmt = db.prepare('DELETE FROM schedules WHERE id=?');
    stmt.run(id);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});


// --- Music API ---
app.get('/api/music/options', (req, res) => {
  try {
    const musicRows = db.prepare('SELECT artist FROM music WHERE artist IS NOT NULL').all();
    const trackRows = db.prepare('SELECT composer, lyricist, arranger, genre, bpm FROM music_tracks').all();
    
    const extractUnique = (rows, field) => {
      const set = new Set();
      rows.forEach(r => {
        if (r[field]) {
          r[field].split(',').forEach(v => {
            const val = v.trim();
            if (val) set.add(val);
          });
        }
      });
      return Array.from(set).sort();
    };

    res.json({
      artists: extractUnique(musicRows, 'artist'),
      composers: extractUnique(trackRows, 'composer'),
      lyricists: extractUnique(trackRows, 'lyricist'),
      arrangers: extractUnique(trackRows, 'arranger'),
      genres: extractUnique(trackRows, 'genre'),
      bpms: extractUnique(trackRows, 'bpm'),
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/music', (req, res) => {
  try {
    const musicList = db.prepare(`SELECT * FROM music`).all();
    res.json(musicList);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/music', (req, res) => {
  try {
    const { title, artist, type, purpose, pop_rating, love_rating, genre, release_year, bpm, chart_peak, analysis, composer, arranger, lyricist, distributor, mood, instrument, concept, art_rating, cover_image, tracks } = req.body;
    
    // Begin transaction
    const insertMusic = db.prepare('INSERT INTO music (title, artist, type, purpose, pop_rating, love_rating, genre, release_year, bpm, chart_peak, analysis, composer, arranger, lyricist, distributor, mood, instrument, concept, art_rating, cover_image) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)');
    const info = insertMusic.run(title, artist, type, purpose, pop_rating, love_rating, genre, release_year, bpm, chart_peak, analysis, composer, arranger, lyricist, distributor, mood, instrument, concept, art_rating, cover_image);
    const newId = info.lastInsertRowid;
    
    if (tracks && tracks.length > 0) {
      const insertTrack = db.prepare('INSERT INTO music_tracks (music_id, track_number, title, is_title_track, composer, lyricist, arranger, genre, mood, instrument, bpm, chart_peak, pop_rating, love_rating, art_rating, analysis) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)');
      const insertMany = db.transaction((tracks) => {
        for (const t of tracks) insertTrack.run(newId, t.track_number, t.title, t.is_title_track ? 1 : 0, t.composer, t.lyricist, t.arranger, t.genre, t.mood, t.instrument, t.bpm, t.chart_peak, t.pop_rating, t.love_rating, t.art_rating, t.analysis);
      });
      insertMany(tracks);
    }
    
    res.json({ id: newId });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.put('/api/music/:id', (req, res) => {
  try {
    const { id } = req.params;
    const { title, artist, type, purpose, pop_rating, love_rating, genre, release_year, bpm, chart_peak, analysis, composer, arranger, lyricist, distributor, mood, instrument, concept, art_rating, cover_image, tracks } = req.body;
    
    const updateMusic = db.transaction(() => {
      const stmt = db.prepare('UPDATE music SET title=?, artist=?, type=?, purpose=?, pop_rating=?, love_rating=?, genre=?, release_year=?, bpm=?, chart_peak=?, analysis=?, composer=?, arranger=?, lyricist=?, distributor=?, mood=?, instrument=?, concept=?, art_rating=?, cover_image=? WHERE id=?');
      stmt.run(title, artist, type, purpose, pop_rating, love_rating, genre, release_year, bpm, chart_peak, analysis, composer, arranger, lyricist, distributor, mood, instrument, concept, art_rating, cover_image, id);
      
      db.prepare('DELETE FROM music_tracks WHERE music_id=?').run(id);
      if (tracks && tracks.length > 0) {
        const insertTrack = db.prepare('INSERT INTO music_tracks (music_id, track_number, title, is_title_track, composer, lyricist, arranger, genre, mood, instrument, bpm, chart_peak, pop_rating, love_rating, art_rating, analysis) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)');
        for (const t of tracks) {
          insertTrack.run(id, t.track_number, t.title, t.is_title_track ? 1 : 0, t.composer, t.lyricist, t.arranger, t.genre, t.mood, t.instrument, t.bpm, t.chart_peak, t.pop_rating, t.love_rating, t.art_rating, t.analysis);
        }
      }
    });
    updateMusic();
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.delete('/api/music/:id', (req, res) => {
  try {
    const { id } = req.params;
    db.prepare('DELETE FROM music WHERE id=?').run(id);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});


app.get('/api/music/:id/tracks', (req, res) => {
  try {
    const { id } = req.params;
    const stmt = db.prepare(`SELECT * FROM music_tracks WHERE music_id = ? ORDER BY track_number ASC, id ASC`);
    const tracks = stmt.all(id);
    // SQLite returns 1/0 for boolean, map it to true/false
    const mapped = tracks.map(t => ({...t, is_title_track: t.is_title_track === 1}));
    res.json(mapped);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/music/:id/relations', (req, res) => {
  try {
    const { id } = req.params;
    const stmt = db.prepare(`
      SELECT r.id as relation_id, r.source_id, r.target_id, r.relation_type, r.order_number,
             m.title, m.type, m.artist
      FROM music_relations r
      JOIN music m ON (r.source_id = ? AND r.target_id = m.id) OR (r.target_id = ? AND r.source_id = m.id)
      ORDER BY r.order_number ASC, r.id ASC
    `);
    const relations = stmt.all(id, id);
    res.json(relations);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/music/relations', (req, res) => {
  try {
    const { source_id, target_id, relation_type, order_number } = req.body;
    const stmt = db.prepare('INSERT INTO music_relations (source_id, target_id, relation_type, order_number) VALUES (?, ?, ?, ?)');
    stmt.run(source_id, target_id, relation_type, order_number || null);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.delete('/api/music/:id/relations', (req, res) => {
  try {
    const { id } = req.params;
    db.prepare('DELETE FROM music_relations WHERE source_id=? OR target_id=?').run(id, id);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Serve static frontend in production
app.use(express.static(path.join(__dirname, '../dist')));

// SPA 펄백 라우트 (Express 5 방식)
app.use((req, res) => {
    res.sendFile(path.join(__dirname, '../dist/index.html'));
});

app.listen(PORT, () => {

  console.log(`Backend server running on http://localhost:${PORT}`);
});
