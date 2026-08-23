CREATE EXTENSION IF NOT EXISTS "pgcrypto";

CREATE TABLE users (
  id            UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  google_id     TEXT        UNIQUE NOT NULL,
  email         TEXT        UNIQUE NOT NULL,
  name          TEXT        NOT NULL,
  avatar_url    TEXT,
  role          TEXT        NOT NULL DEFAULT 'user'  CHECK (role IN ('user', 'moderator', 'admin')),
  is_banned     BOOLEAN     NOT NULL DEFAULT FALSE,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_users_google_id ON users(google_id);
CREATE INDEX idx_users_email     ON users(email);

CREATE TABLE categories (
  id          SERIAL      PRIMARY KEY,
  slug        TEXT        UNIQUE NOT NULL,
  name_tr     TEXT        NOT NULL,
  name_en     TEXT        NOT NULL,
  icon        TEXT,
  sort_order  INTEGER     NOT NULL DEFAULT 0
);

INSERT INTO categories (slug, name_tr, name_en, icon, sort_order) VALUES
  ('workplace','İş Yeri','Workplace','🏢',1),
  ('traffic','Trafik','Traffic','🚗',2),
  ('public-service','Kamu Hizmeti','Public Service','🏛️',3),
  ('social-media','Sosyal Medya','Social Media','📱',4),
  ('neighborhood','Komşuluk','Neighborhood','🏘️',5),
  ('commerce','Ticaret','Commerce','🛒',6),
  ('education','Eğitim','Education','🎓',7),
  ('health','Sağlık','Health','🏥',8),
  ('other','Diğer','Other','📌',9);

CREATE TABLE incidents (
  id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  author_id       UUID        REFERENCES users(id) ON DELETE SET NULL,
  category_id     INTEGER     REFERENCES categories(id) ON DELETE SET NULL,
  title           TEXT        NOT NULL CHECK (char_length(title) BETWEEN 10 AND 200),
  description     TEXT        NOT NULL CHECK (char_length(description) BETWEEN 50 AND 5000),
  location        TEXT,
  incident_date   DATE,
  is_anonymous    BOOLEAN     NOT NULL DEFAULT FALSE,
  status          TEXT        NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'removed')),
  reject_reason   TEXT,
  vote_ethical    INTEGER     NOT NULL DEFAULT 0,
  vote_unethical  INTEGER     NOT NULL DEFAULT 0,
  view_count      INTEGER     NOT NULL DEFAULT 0,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_incidents_status      ON incidents(status);
CREATE INDEX idx_incidents_category_id ON incidents(category_id);
CREATE INDEX idx_incidents_author_id   ON incidents(author_id);
CREATE INDEX idx_incidents_created_at  ON incidents(created_at DESC);
CREATE INDEX idx_incidents_fts ON incidents USING GIN (to_tsvector('turkish', coalesce(title,'') || ' ' || coalesce(description,'')));

CREATE TABLE votes (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  incident_id UUID        NOT NULL REFERENCES incidents(id) ON DELETE CASCADE,
  user_id     UUID        NOT NULL REFERENCES users(id)     ON DELETE CASCADE,
  verdict     TEXT        NOT NULL CHECK (verdict IN ('ethical', 'unethical')),
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (incident_id, user_id)
);

CREATE INDEX idx_votes_incident_id ON votes(incident_id);
CREATE INDEX idx_votes_user_id     ON votes(user_id);

CREATE TABLE comments (
  id           UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  incident_id  UUID        NOT NULL REFERENCES incidents(id) ON DELETE CASCADE,
  author_id    UUID        REFERENCES users(id) ON DELETE SET NULL,
  parent_id    UUID        REFERENCES comments(id) ON DELETE CASCADE,
  content      TEXT        NOT NULL CHECK (char_length(content) BETWEEN 1 AND 2000),
  is_anonymous BOOLEAN     NOT NULL DEFAULT FALSE,
  is_removed   BOOLEAN     NOT NULL DEFAULT FALSE,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_comments_incident_id ON comments(incident_id);
CREATE INDEX idx_comments_author_id   ON comments(author_id);

CREATE TABLE reports (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  reporter_id UUID        NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  incident_id UUID        REFERENCES incidents(id) ON DELETE CASCADE,
  comment_id  UUID        REFERENCES comments(id)  ON DELETE CASCADE,
  reason      TEXT        NOT NULL CHECK (reason IN ('spam','false_info','harassment','hate_speech','irrelevant','other')),
  details     TEXT,
  resolved    BOOLEAN     NOT NULL DEFAULT FALSE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CHECK ((incident_id IS NOT NULL AND comment_id IS NULL) OR (incident_id IS NULL AND comment_id IS NOT NULL))
);

CREATE TABLE notifications (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID        NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type        TEXT        NOT NULL CHECK (type IN ('comment_on_incident','reply_to_comment','incident_approved','incident_rejected','report_resolved')),
  payload     JSONB       NOT NULL DEFAULT '{}',
  is_read     BOOLEAN     NOT NULL DEFAULT FALSE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_notifications_user_id ON notifications(user_id, is_read);

CREATE TABLE sessions (
  id            UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       UUID        NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  refresh_token TEXT        NOT NULL,
  expires_at    TIMESTAMPTZ NOT NULL,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_sessions_user_id       ON sessions(user_id);
CREATE INDEX idx_sessions_refresh_token ON sessions(refresh_token);

CREATE OR REPLACE FUNCTION update_incident_vote_counts()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE incidents
  SET
    vote_ethical   = (SELECT COUNT(*) FROM votes WHERE incident_id = COALESCE(NEW.incident_id, OLD.incident_id) AND verdict = 'ethical'),
    vote_unethical = (SELECT COUNT(*) FROM votes WHERE incident_id = COALESCE(NEW.incident_id, OLD.incident_id) AND verdict = 'unethical'),
    updated_at     = NOW()
  WHERE id = COALESCE(NEW.incident_id, OLD.incident_id);
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_votes_after_change
AFTER INSERT OR UPDATE OR DELETE ON votes
FOR EACH ROW EXECUTE FUNCTION update_incident_vote_counts();

CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_users_updated_at     BEFORE UPDATE ON users     FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER trg_incidents_updated_at BEFORE UPDATE ON incidents FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER trg_comments_updated_at  BEFORE UPDATE ON comments  FOR EACH ROW EXECUTE FUNCTION set_updated_at();
