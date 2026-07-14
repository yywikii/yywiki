import re

with open('/Users/wuju/Desktop/linkwiki/server/index.js', 'r', encoding='utf-8') as f:
    content = f.read()

# Update POST
content = content.replace(
    "const { title, type, status, rating, tags, platform, progress, watched_at, review, series_id, publication_status, release_year } = req.body;",
    "const { title, type, status, rating, tags, platform, progress, watched_at, review, series_id, publication_status, release_year, part_number } = req.body;"
)
content = content.replace(
    "INSERT INTO contents (title, type, status, rating, tags, platform, progress, watched_at, review, series_id, publication_status, release_year)",
    "INSERT INTO contents (title, type, status, rating, tags, platform, progress, watched_at, review, series_id, publication_status, release_year, part_number)"
)
content = content.replace(
    "VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
    "VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)"
)
content = content.replace(
    "stmt.run(title, type, status, rating, tags, platform, progress, watched_at, review, series_id, publication_status, release_year);",
    "stmt.run(title, type, status, rating, tags, platform, progress, watched_at, review, series_id, publication_status, release_year, part_number);"
)

# Update PUT
content = content.replace(
    "SET title=?, type=?, status=?, rating=?, tags=?, platform=?, progress=?, watched_at=?, review=?, series_id=?, publication_status=?, release_year=?",
    "SET title=?, type=?, status=?, rating=?, tags=?, platform=?, progress=?, watched_at=?, review=?, series_id=?, publication_status=?, release_year=?, part_number=?"
)
content = content.replace(
    "stmt.run(title, type, status, rating, tags, platform, progress, watched_at, review, series_id, publication_status, release_year, id);",
    "stmt.run(title, type, status, rating, tags, platform, progress, watched_at, review, series_id, publication_status, release_year, part_number, id);"
)

with open('/Users/wuju/Desktop/linkwiki/server/index.js', 'w', encoding='utf-8') as f:
    f.write(content)

print("Backend updated.")
