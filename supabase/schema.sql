-- PRD #23 Database schema — prefix game_ untuk semua tabel
-- Jalankan di Supabase SQL Editor

create table if not exists game_rooms (
  id uuid primary key default gen_random_uuid(),
  code text unique not null,
  status text not null default 'waiting', -- waiting|ready|countdown|playing|result|finished
  difficulty text not null default 'mudah',
  operations text not null default 'campuran',
  total_rounds int not null default 10,
  duration_seconds int not null default 10,
  current_round int not null default 1,
  score_a int not null default 0,
  score_b int not null default 0,
  question_id text,
  question_text text,
  correct_answer int,
  question_started_at bigint,
  sudden_death boolean not null default false,
  created_at timestamptz not null default now(),
  expires_at timestamptz not null default now() + interval '24 hours'
);

create table if not exists game_players (
  id uuid primary key default gen_random_uuid(),
  room_id uuid references game_rooms(id) on delete cascade,
  team text not null check (team in ('A','B')),
  player_token text not null,
  connected boolean not null default true,
  ready boolean not null default false,
  joined_at timestamptz not null default now(),
  last_seen_at timestamptz not null default now(),
  unique(room_id, team),
  unique(room_id, player_token)
);

create table if not exists game_rounds (
  id uuid primary key default gen_random_uuid(),
  room_id uuid references game_rooms(id) on delete cascade,
  round_number int not null,
  question_id text not null,
  question_text text not null,
  correct_answer int not null,
  started_at bigint not null,
  ended_at bigint,
  winner_team text check (winner_team in ('A','B','draw'))
);

create table if not exists game_answers (
  id uuid primary key default gen_random_uuid(),
  round_id uuid references game_rounds(id) on delete cascade,
  player_id uuid references game_players(id) on delete cascade,
  team text not null,
  answer int not null,
  is_correct boolean not null,
  answered_at bigint not null,
  response_ms int not null,
  unique(round_id, player_id)
);

create table if not exists game_questions (
  id uuid primary key default gen_random_uuid(),
  difficulty text not null check (difficulty in ('mudah','sedang','sulit')),
  operation text not null check (operation in ('penjumlahan','pengurangan','perkalian','pembagian','campuran')),
  question text not null,
  correct_answer int not null,
  options int[] not null,
  created_at timestamptz not null default now()
);

-- Custom question banks (opsi cepat CSV private)
create table if not exists game_question_banks (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  category text not null default 'agama',
  owner_token text not null,
  is_public boolean not null default false,
  question_count int not null default 0,
  created_at timestamptz not null default now()
);

create table if not exists game_questions_custom (
  id uuid primary key default gen_random_uuid(),
  bank_id uuid references game_question_banks(id) on delete cascade,
  question text not null,
  options text[] not null,
  correct_answer text not null,
  difficulty text not null default 'mudah',
  created_at timestamptz not null default now()
);

-- Realtime: enable publication (uncomment jika pakai Supabase Realtime)
-- alter publication supabase_realtime add table game_rooms;
-- alter publication supabase_realtime add table game_players;
-- alter publication supabase_realtime add table game_answers;
-- alter publication supabase_realtime add table game_rounds;
-- alter publication supabase_realtime add table game_question_banks;
-- alter publication supabase_realtime add table game_questions_custom;

-- Index untuk lookup code cepat
create index if not exists idx_game_rooms_code on game_rooms(code);
create index if not exists idx_game_players_room_id on game_players(room_id);
create index if not exists idx_game_rounds_room_id on game_rounds(room_id);
create index if not exists idx_game_answers_round_id on game_answers(round_id);
create index if not exists idx_game_question_banks_owner on game_question_banks(owner_token);
create index if not exists idx_game_questions_custom_bank on game_questions_custom(bank_id);
