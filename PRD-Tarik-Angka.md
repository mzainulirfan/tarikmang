# PRD — Tarik Angka!
## Multiplayer Math Tug-of-War Game

**Versi:** 1.0 MVP  
**Platform:** Web / PWA  
**Target:** Anak-anak, kelas/sekolah, keluarga, game edukasi  
**Mode:** 1 layar besar + 2 HP controller  
**Teknologi target:** Next.js, TypeScript, TailwindCSS, shadcn/ui, Hugeicons, Supabase, Vercel

---

# 1. Ringkasan Produk

Tarik Angka! adalah permainan matematika multiplayer sederhana yang menggabungkan kuis matematika cepat dengan mekanik tarik tambang.

Satu perangkat berfungsi sebagai layar utama/display dan dua HP berfungsi sebagai controller untuk masing-masing tim.

- Layar besar menampilkan seluruh arena, soal, skor, posisi tali, timer, status pemain, dan hasil ronde.
- HP Kubu A hanya digunakan oleh pemain A untuk membaca soal dan memilih jawaban.
- HP Kubu B hanya digunakan oleh pemain B untuk membaca soal dan memilih jawaban.
- Kedua pemain menjawab soal yang sama secara bersamaan.
- Jawaban benar + waktu tercepat memenangkan ronde.
- Pemenang ronde menarik tali satu langkah ke arah timnya.
- Setelah beberapa ronde, tim dengan posisi akhir terbaik menjadi pemenang.

Prinsip utama:

> Cepat. Benar. Tarik!

---

# 2. Tujuan Produk

## Tujuan utama

1. Membuat belajar matematika terasa seperti kompetisi.
2. Memungkinkan dua anak bermain bersama secara realtime.
3. Menjadikan layar besar sebagai pusat perhatian.
4. Membuat controller HP sangat sederhana sehingga anak tidak perlu memahami UI yang rumit.
5. Memungkinkan game dimainkan tanpa instalasi aplikasi.

## Non-goals MVP

- Login akun pengguna.
- Sistem ranking global.
- Chat antar pemain.
- Marketplace.
- Multiplayer lebih dari 2 tim.
- Voice chat.
- Sistem pembayaran.
- AI adaptive learning.
- Native Android/iOS.

---

# 3. Target User

## Primary

Anak usia sekitar 7–14 tahun.

## Secondary

- Guru.
- Orang tua.
- Tutor.
- Pengelola kelas.
- Event organizer.

## Skenario penggunaan

### Kelas

Guru membuka game di proyektor, dua siswa menggunakan HP.

### Rumah

TV/laptop menjadi display, dua anak menggunakan HP.

### Acara

Game ditampilkan di layar besar dan dimainkan oleh dua peserta.

---

# 4. Konsep Permainan

Ada tiga perangkat aktif:

1. Host/Display.
2. Controller Kubu A.
3. Controller Kubu B.

Secara fisik:

```text
             ┌───────────────────┐
             │    BIG SCREEN     │
             │     GAME ARENA    │
             └─────────┬─────────┘
                       │
                 Realtime Server
                       │
             ┌─────────┴─────────┐
             │                   │
        ┌────▼────┐         ┌────▼────┐
        │  HP A   │         │  HP B   │
        │ 🔵 A    │         │ 🔴 B    │
        └─────────┘         └─────────┘
```

---

# 5. Game Room

Setiap pertandingan mempunyai Room Code unik.

Contoh:

```text
7K4P2
```

Host membuat room.

Display menampilkan QR:

```text
SCAN TO JOIN

      [ QR ]

Game Code: 7K4P2
```

Pemain scan QR.

Pemain pertama memilih Kubu A.

Pemain kedua memilih Kubu B.

---

# 6. User Flow Utama

```text
OPEN WEBSITE
     ↓
BUAT GAME
     ↓
ROOM CREATED
     ↓
DISPLAY QR + ROOM CODE
     ↓
 ┌───────────────┐
 │               │
 ↓               ↓
HP A JOIN       HP B JOIN
 │               │
 ↓               ↓
SELECT TEAM A   SELECT TEAM B
 │               │
 └───────┬───────┘
         ↓
    BOTH READY?
         ↓
      COUNTDOWN
      3 → 2 → 1
         ↓
      ROUND START
         ↓
   QUESTION APPEARS
         ↓
  A & B ANSWER
         ↓
 SERVER VALIDATES
         ↓
    COMPARE RESULT
         ↓
   WINNER OF ROUND
         ↓
    ROPE PULL 1 STEP
         ↓
      NEXT ROUND
         ↓
       GAME OVER
         ↓
       WINNER
```

---

# 7. Flow Detail — Host

## 7.1 Landing

Host melihat:

- Logo Tarik Angka!
- Deskripsi singkat.
- Tombol "Buat Game".

Klik:

`Buat Game`

---

## 7.2 Game Setup

Host memilih:

### Tingkat kesulitan

- Mudah
- Sedang
- Sulit

### Operasi

- Penjumlahan
- Pengurangan
- Perkalian
- Pembagian
- Campuran

### Jumlah ronde

- 5
- 10
- 15
- Custom

### Durasi

- 5 detik
- 10 detik
- 15 detik

Default MVP:

```text
Kesulitan: Mudah
Operasi: Campuran
Ronde: 10
Waktu: 10 detik
```

Klik:

`Buat Game`

---

# 8. Flow — Waiting Room

Display menampilkan:

```text
TARIK ANGKA!

SCAN UNTUK BERGABUNG

          [ QR ]

       GAME CODE
          7K4P2

🔵 KUBU A        🔴 KUBU B
WAITING          WAITING
```

Saat HP A join:

```text
🔵 KUBU A
✓ TERHUBUNG
✓ SIAP
```

Saat HP B join:

```text
🔴 KUBU B
✓ TERHUBUNG
✓ SIAP
```

Jika keduanya siap:

```text
KEDUA TIM SIAP!

        [ MULAI ]
```

Host dapat menekan "Mulai".

---

# 9. Flow — Join dari HP

User membuka URL:

```text
/join/7K4P2
```

UI:

```text
TARIK ANGKA!

GAME 7K4P2

Pilih Tim

[ 🔵 KUBU A ]

[ 🔴 KUBU B ]
```

Jika A sudah terisi:

```text
🔵 KUBU A
SUDAH TERISI
```

User hanya dapat memilih B.

---

# 10. Controller HP

Setelah memilih tim:

```text
┌────────────────────────┐
│ 🔵 KUBU A              │
│                         │
│ ● TERHUBUNG             │
│                         │
│       ROUND 1           │
│                         │
│      8 × 7 = ?          │
│                         │
│       ⏱ 07.4            │
│                         │
│ ┌────────┐ ┌────────┐  │
│ │   54   │ │   56   │  │
│ └────────┘ └────────┘  │
│                         │
│ ┌────────┐ ┌────────┐  │
│ │   58   │ │   52   │  │
│ └────────┘ └────────┘  │
└────────────────────────┘
```

Controller hanya mempunyai satu aksi utama:

`Pilih jawaban`

---

# 11. Countdown

Semua perangkat menerima event yang sama.

```text
3
2
1
GO!
```

Timer harus berasal dari server timestamp, bukan timer lokal yang berdiri sendiri.

---

# 12. Flow — Menjawab

Contoh:

Soal:

`12 + 8 = ?`

A menjawab:

`20`

B menjawab:

`18`

Server:

```text
A → correct
B → incorrect
```

Result:

```text
🔵 KUBU A MENANG!

+1 TARIKAN
```

---

# 13. Jika Dua Tim Sama-sama Benar

Contoh:

```text
A → benar → 2.15 detik
B → benar → 1.72 detik
```

B menang karena lebih cepat.

Rule:

```text
correct > incorrect

Jika keduanya correct:
    waktu tercepat menang

Jika hanya satu correct:
    yang correct menang

Jika keduanya incorrect:
    seri

Jika timeout:
    seri
```

---

# 14. Jika Pemain Menjawab Salah

Jika A salah:

```text
❌ SALAH

Jawaban yang benar: 20
```

A tidak dapat menjawab lagi pada ronde tersebut.

B tetap dapat menjawab sampai:

- B menjawab.
- Timer habis.

---

# 15. Jika Pemain Tidak Menjawab

Timer habis:

```text
⏰ WAKTU HABIS!

Tidak ada tarikan.
```

Kemudian ronde berikutnya.

---

# 16. Rope Mechanic

Arena menggunakan posisi tali berdasarkan skor.

Contoh:

```text
A 0 — 0 B

        🪢
```

A menang:

```text
A 1 — 0 B

       🪢
      ←
```

A menang lagi:

```text
A 2 — 0 B

      🪢
     ←
```

B kemudian menang:

```text
A 2 — 1 B

       🪢
        →
```

Display menghidupkan animasi:

- Karakter menarik tali.
- Tali bergerak.
- Flag bergerak.
- Debu/partikel.
- Sound effect opsional.
- Score pop animation.

---

# 17. Win Condition

Untuk MVP, permainan memiliki jumlah ronde tetap.

Default:

`10 ronde`

Setelah ronde ke-10:

```text
GAME OVER
```

Score dibandingkan.

Contoh:

```text
🔵 KUBU A    🔴 KUBU B

     6    —    4

       🏆

    KUBU A MENANG!
```

Jika skor sama:

```text
🤝 SERI!
```

---

# 18. Optional Sudden Death

Jika skor sama setelah ronde terakhir:

```text
SUDDEN DEATH!

Soal berikutnya menentukan pemenang.

Yang benar dan paling cepat
langsung menang.
```

Fitur ini sebaiknya masuk MVP+ karena sangat cocok untuk game.

---

# 19. Game State

State utama:

```ts
type GameStatus =
  | "waiting"
  | "ready"
  | "countdown"
  | "playing"
  | "result"
  | "finished";
```

Player:

```ts
type Team = "A" | "B";

type Player = {
  team: Team;
  playerToken: string;
  connected: boolean;
  ready: boolean;
};
```

Game:

```ts
type GameState = {
  roomCode: string;
  status: GameStatus;

  round: number;
  totalRounds: number;

  scoreA: number;
  scoreB: number;

  questionId: string;

  questionStartedAt: number;
  questionDuration: number;

  answeredA: boolean;
  answeredB: boolean;
};
```

---

# 20. Realtime Event

Event yang digunakan:

```text
GAME_CREATED
PLAYER_JOINED
PLAYER_LEFT
PLAYER_READY

GAME_STARTING
COUNTDOWN_STARTED
ROUND_STARTED

PLAYER_ANSWERED

ROUND_RESULT
ROPE_PULLED

NEXT_ROUND

GAME_FINISHED
GAME_RESET
```

---

# 21. Contoh Event

## ROUND_STARTED

```json
{
  "type": "ROUND_STARTED",
  "round": 4,
  "questionId": "q_892",
  "question": "12 + 8 = ?",
  "options": [18, 20, 22, 24],
  "startedAt": 1725349200000,
  "duration": 10000
}
```

## PLAYER_ANSWERED

```json
{
  "type": "PLAYER_ANSWERED",
  "team": "A",
  "questionId": "q_892",
  "answer": 20,
  "clientTimestamp": 1725349202100
}
```

Server tidak mempercayai `clientTimestamp` sebagai sumber utama.

---

# 22. Server Authority

Server harus menjadi sumber kebenaran untuk:

- Jawaban benar/salah.
- Waktu jawaban.
- Pemenang ronde.
- Score.
- Round.
- Game status.

Client hanya mengirim intent:

```text
"Team A memilih jawaban 20"
```

Server menentukan hasil.

Tujuannya menghindari:

- Manipulasi timer.
- HP dengan jam berbeda.
- Double answer.
- Score tidak sinkron.
- Race condition.

---

# 23. Database

Supabase PostgreSQL.

## rooms

```text
id
code
status
difficulty
operations
total_rounds
duration_seconds
current_round
created_at
expires_at
```

## players

```text
id
room_id
team
player_token
connected
ready
joined_at
last_seen_at
```

## rounds

```text
id
room_id
round_number
question_id
question_text
correct_answer
started_at
ended_at
winner_team
```

## answers

```text
id
round_id
player_id
team
answer
is_correct
answered_at
response_ms
```

Question bank dapat dipisahkan:

## questions

```text
id
difficulty
operation
question
correct_answer
options
```

---

# 24. Room Security

Room code bukan authentication.

Setiap controller mendapatkan:

```text
playerToken
```

Token disimpan di localStorage/session storage.

Contoh:

```text
roomCode = 7K4P2
team = A
playerToken = random-secure-token
```

Server memvalidasi setiap event berdasarkan token.

---

# 25. Room Lifecycle

Room memiliki TTL.

Contoh:

```text
WAITING
 ↓
PLAYING
 ↓
FINISHED
 ↓
EXPIRED
```

Room lama tidak boleh aktif selamanya.

Default:

`24 jam`

Setelah expired:

```text
Game sudah berakhir.
Silakan buat game baru.
```

---

# 26. Display UI

Display adalah bagian paling visual.

## Waiting

```text
┌────────────────────────────────────┐
│          TARIK ANGKA!              │
│                                    │
│         SCAN UNTUK JOIN            │
│                                    │
│              QR                    │
│                                    │
│           7K4P2                    │
│                                    │
│  🔵 A READY        🔴 B WAITING    │
└────────────────────────────────────┘
```

## Playing

```text
┌────────────────────────────────────┐
│ ROUND 4 / 10                       │
│                                    │
│ 🔵 A        🪢        🔴 B         │
│  3                     2           │
│                                    │
│          🧒────🪢────👧             │
│                                    │
│             12 + 8                 │
│                                    │
│              10.0                  │
└────────────────────────────────────┘
```

Display tidak perlu menampilkan pilihan jawaban jika ingin menjaga fokus pemain.

---

# 27. Controller UI

## Waiting

```text
🔵 KUBU A

✓ TERHUBUNG

Menunggu Kubu B...
```

## Ready

```text
🔵 KUBU A

ANDA SIAP?

[ SIAP! ]
```

## Playing

```text
ROUND 4

12 + 8 = ?

[ 18 ]
[ 20 ]
[ 22 ]
[ 24 ]

⏱ 7.2
```

## Answered

```text
✓ JAWABAN TERKIRIM

Menunggu hasil...
```

## Result

```text
🎉 BENAR!

KUBU A MENARIK!

+1
```

---

# 28. Responsive Design

Display:

- Landscape.
- 16:9.
- Fullscreen.

Controller:

- Portrait-first.
- Touch-friendly.
- Large tap targets.
- Tidak membutuhkan keyboard.

Minimum target tombol:

`48 × 48 px`

Ideal:

`64–80 px`.

---

# 29. Visual Design

Karakter harus terasa seperti game anak-anak, tetapi tidak terlalu ramai.

Style:

- Rounded.
- Bold.
- Colorful.
- Friendly.
- High contrast.
- Large typography.
- Playful animation.

Palet awal:

```text
Team A
Sky / Blue

Team B
Rose / Red

Neutral
Slate

Success
Green

Warning
Amber

Arena
Green grass
```

Font:

`Inter`

Icon:

`Hugeicons Stroke Rounded`

---

# 30. Animation

Animation utama:

### Countdown

Scale + bounce.

### Correct answer

Button pop.

### Wrong answer

Shake.

### Rope pull

Tali bergerak ke sisi pemenang.

### Character

Karakter condong ke belakang saat menarik.

### Winner

Confetti + celebration.

### Score

Score melakukan pop animation.

Animasi harus singkat agar tidak mengganggu permainan.

---

# 31. Sound Design

MVP dapat menyediakan sound toggle.

Sound:

```text
join
ready
countdown
start
correct
wrong
rope-pull
winner
```

Default:

`ON`

Tetapi browser mungkin membutuhkan user interaction sebelum audio dapat dimainkan.

---

# 32. Network Failure

Jika HP kehilangan koneksi:

Display:

```text
🔴 KUBU B
⚠ CONNECTION LOST
```

Controller mencoba reconnect otomatis.

Jika reconnect berhasil:

```text
✓ CONNECTED
```

Game melanjutkan state terakhir.

Jika pemain disconnect saat menjawab:

- Jawaban yang sudah diterima tetap valid.
- Jika belum menjawab, dianggap tidak menjawab sampai timeout.

---

# 33. Race Condition

Kasus:

A dan B menjawab hampir bersamaan.

Server harus menggunakan server receive timestamp.

Contoh:

```text
A received = 1200 ms
B received = 1250 ms

A menang.
```

Jika timestamp sangat dekat, server tetap menggunakan urutan event yang diterima.

Tidak boleh menentukan winner berdasarkan animasi atau waktu UI client.

---

# 34. Anti Double Submit

Jika HP mengirim:

```text
ANSWER A
ANSWER B
```

Server hanya menerima jawaban pertama.

Jawaban kedua:

```text
IGNORED
```

Database dapat menggunakan constraint:

```text
unique(round_id, player_id)
```

---

# 35. Reconnect

Controller menyimpan:

```text
roomCode
playerToken
team
```

Saat reload:

```text
/join/7K4P2
```

client mencoba:

```text
RECONNECT
```

Server mencari player berdasarkan token.

Jika ditemukan:

```text
CONNECTED
```

---

# 36. Host Disconnect

MVP sebaiknya memiliki konsep host sederhana.

Jika host/display refresh:

- State game tetap berada di server.
- Display melakukan reconnect.
- Game tidak reset.

Jika host benar-benar meninggalkan game:

- Game tetap hidup selama room masih aktif.
- Display baru dapat reconnect menggunakan room code.

---

# 37. API / Server Actions

Minimal endpoint:

```text
POST /api/game/create
POST /api/game/join
POST /api/game/ready
POST /api/game/start
POST /api/game/answer
POST /api/game/reset
GET  /api/game/:roomCode
```

Realtime digunakan untuk sinkronisasi state/event.

---

# 38. Arsitektur

```text
                 VERCEL
                    │
              Next.js App
                    │
        ┌───────────┼───────────┐
        │           │           │
      HOST       DISPLAY     CONTROLLER
                              /join/:room
        │           │           │
        └───────────┼───────────┘
                    │
             REALTIME LAYER
                    │
              SUPABASE
              ┌─────┴─────┐
              │           │
           Postgres    Realtime
```

Catatan implementasi: jika menggunakan Supabase Realtime, server-side validation tetap diperlukan. Jangan menjadikan client sebagai authority atas score.

---

# 39. MVP Scope

Prioritas P0:

- Create room.
- QR join.
- Join Team A/B.
- Waiting room.
- Ready.
- Start game.
- Generate questions.
- Realtime question sync.
- Answer dari HP.
- Server validation.
- Timer.
- Determine winner.
- Score.
- Rope animation.
- 10 rounds.
- Game over.
- Play again.
- Reconnect basic.

P1:

- Difficulty.
- Operation selector.
- Round selector.
- Timer selector.
- Sudden death.
- Sound.
- Fullscreen.
- PWA install.
- Better disconnect handling.

P2:

- Account.
- History.
- Leaderboard.
- Classroom mode.
- Teacher dashboard.
- Question bank management.
- Analytics.
- Custom team names.
- Custom avatars.

---

# 40. Development Phase

## Phase 1 — Game Engine

Buat logic lokal terlebih dahulu.

- Question generator.
- Timer.
- Answer validation.
- Round.
- Score.
- Winner.
- Rope position.

Target:

Game dapat dimainkan tanpa network.

---

## Phase 2 — UI

Buat tiga interface:

```text
Host
Display
Controller
```

Fokus pada mobile controller dan big-screen presentation.

---

## Phase 3 — Room System

Implement:

- Room creation.
- Room code.
- Join.
- Team assignment.
- Player token.

---

## Phase 4 — Realtime

Implement:

```text
PLAYER_JOINED
PLAYER_READY
GAME_STARTED
ROUND_STARTED
PLAYER_ANSWERED
ROUND_RESULT
ROPE_PULLED
GAME_FINISHED
```

---

## Phase 5 — Reconnect

Implement:

- Connection status.
- Auto reconnect.
- State recovery.
- Duplicate prevention.

---

## Phase 6 — Polish

Tambahkan:

- Animation.
- Sound.
- Confetti.
- Fullscreen.
- PWA.
- QR improvements.

---

# 41. Acceptance Criteria

Game dianggap MVP selesai jika:

### Room

- Host dapat membuat room.
- Room code unik.
- QR dapat digunakan untuk join.

### Player

- Dua HP dapat join.
- Hanya satu pemain per tim.
- Player dapat reconnect.

### Game

- Kedua pemain menerima soal yang sama.
- Timer sinkron.
- Pemain dapat menjawab.
- Server menentukan benar/salah.
- Server menentukan winner berdasarkan correctness + response time.
- Score tersinkron ke display.

### Arena

- Rope bergerak sesuai winner.
- Score berubah.
- Round berubah.
- Winner tampil.

### Reliability

- Refresh display tidak mereset game.
- Refresh controller dapat reconnect.
- Double answer tidak dihitung.
- Disconnect tidak merusak state.

---

# 42. Contoh Satu Match

```text
HOST
 ↓
Create Game
 ↓
ROOM 7K4P2
 ↓
Display QR
 ↓
A Scan
 ↓
B Scan
 ↓
Both Ready
 ↓
3
 ↓
2
 ↓
1
 ↓
GO!
 ↓
Question: 7 × 8
 ↓
A = 56 @ 2.1s
B = 54 @ 1.4s
 ↓
A correct
B incorrect
 ↓
A wins
 ↓
ROPE PULL
 ↓
A +1
 ↓
Round 2
 ↓
...
 ↓
Round 10
 ↓
A 6 — 4 B
 ↓
GAME OVER
 ↓
🏆 KUBU A MENANG
```

---

# 43. Prinsip UX Utama

1. Display harus bisa dipahami dari jarak jauh.
2. Controller HP harus bisa digunakan tanpa instruksi panjang.
3. Anak harus tahu dengan jelas kapan boleh menjawab.
4. Feedback benar/salah harus instan.
5. Animasi tidak boleh memperlambat ronde.
6. Tidak boleh ada informasi penting yang hanya tersedia di HP.
7. Koneksi terputus harus terlihat jelas.
8. Server menjadi sumber kebenaran.
9. Satu ronde harus selesai dalam beberapa detik.
10. Semua interaksi utama menggunakan tombol besar.

---

# 44. Rekomendasi Struktur Project

```text
src/
├── app/
│   ├── page.tsx
│   ├── host/
│   │   └── page.tsx
│   ├── display/
│   │   └── page.tsx
│   ├── join/
│   │   └── [roomCode]/
│   │       └── page.tsx
│   └── api/
│       └── game/
│
├── components/
│   ├── game/
│   │   ├── TugArena.tsx
│   │   ├── Rope.tsx
│   │   ├── TeamCard.tsx
│   │   ├── ScoreBoard.tsx
│   │   ├── Countdown.tsx
│   │   └── QuestionDisplay.tsx
│   │
│   ├── controller/
│   │   ├── ControllerScreen.tsx
│   │   ├── AnswerGrid.tsx
│   │   └── ConnectionStatus.tsx
│   │
│   └── room/
│       ├── RoomQR.tsx
│       ├── TeamSelector.tsx
│       └── PlayerStatus.tsx
│
├── lib/
│   ├── game/
│   │   ├── engine.ts
│   │   ├── questions.ts
│   │   └── scoring.ts
│   │
│   ├── realtime/
│   │   └── events.ts
│   │
│   └── supabase/
│
└── types/
    └── game.ts
```

---

# 45. Kesimpulan

Tarik Angka! sebaiknya dibangun bukan sebagai website quiz biasa, tetapi sebagai:

> **1 game room dengan 3 interface realtime: 1 arena + 2 controller.**

Display adalah pusat permainan.

HP adalah controller.

Server adalah authority.

Core loop:

```text
JOIN
 ↓
READY
 ↓
COUNTDOWN
 ↓
QUESTION
 ↓
ANSWER
 ↓
VALIDATE
 ↓
FASTEST CORRECT WINS
 ↓
ROPE PULL
 ↓
NEXT ROUND
 ↓
WINNER
```

Arsitektur ini cukup sederhana untuk MVP tetapi sudah mempunyai fondasi yang baik untuk berkembang menjadi game edukasi multiplayer yang lebih besar.
