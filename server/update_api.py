import re

with open('/Users/wuju/Desktop/linkwiki/server/index.js', 'r', encoding='utf-8') as f:
    content = f.read()

# Append music API at the end
music_api = """
// --- Music API ---
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
    const { title, artist, type, purpose, pop_rating, love_rating, genre, release_year, bpm, chart_peak, analysis } = req.body;
    const stmt = db.prepare(`
      INSERT INTO music (title, artist, type, purpose, pop_rating, love_rating, genre, release_year, bpm, chart_peak, analysis) 
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    const info = stmt.run(title, artist, type, purpose, pop_rating, love_rating, genre, release_year, bpm, chart_peak, analysis);
    res.json({ id: info.lastInsertRowid });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.put('/api/music/:id', (req, res) => {
  try {
    const { id } = req.params;
    const { title, artist, type, purpose, pop_rating, love_rating, genre, release_year, bpm, chart_peak, analysis } = req.body;
    const stmt = db.prepare(`
      UPDATE music 
      SET title=?, artist=?, type=?, purpose=?, pop_rating=?, love_rating=?, genre=?, release_year=?, bpm=?, chart_peak=?, analysis=? 
      WHERE id=?
    `);
    stmt.run(title, artist, type, purpose, pop_rating, love_rating, genre, release_year, bpm, chart_peak, analysis, id);
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

app.get('/api/music/:id/relations', (req, res) => {
  try {
    const { id } = req.params;
    const relations = db.prepare(`
      SELECT r.id as relation_id, r.source_id, r.target_id, r.relation_type,
             c.title, c.type, c.artist
      FROM music_relations r
      JOIN music c ON (r.target_id = c.id AND r.source_id = ?) OR (r.source_id = c.id AND r.target_id = ?)
      WHERE c.id != ?
    `).all(id, id, id);
    res.json(relations);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/music_relations', (req, res) => {
  try {
    const { source_id, target_id, relation_type } = req.body;
    const stmt = db.prepare('INSERT INTO music_relations (source_id, target_id, relation_type) VALUES (?, ?, ?)');
    stmt.run(source_id, target_id, relation_type);
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

app.listen(PORT, () => {
"""

content = content.replace("app.listen(PORT, () => {", music_api)

with open('/Users/wuju/Desktop/linkwiki/server/index.js', 'w', encoding='utf-8') as f:
    f.write(content)

print("Backend API updated.")
