// app.js
const express = require("express");
const session = require("express-session");
const cookieParser = require("cookie-parser");
const path = require("path");
const expressLayouts = require("express-ejs-layouts");
const multer = require("multer");
const fs = require("fs");
const XLSX = require("xlsx");
const { Parser } = require("json2csv");
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const User = require('./models/User');

require("dotenv").config();

const app = express();

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(
  session({
    secret: process.env.SESSION_SECRET || "keyboardcat",
    resave: false,
    saveUninitialized: true,
  })
);

// EJS
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));
app.use(expressLayouts);
app.set("layout", "layout");

// Static
app.use(express.static(path.join(__dirname, "public")));

// --------------------
// Load & Save User Profile (untuk Profile page)
// --------------------
const userFile = path.join(__dirname, "data", "user.json");

if (!fs.existsSync(path.join(__dirname, "data"))) {
  fs.mkdirSync(path.join(__dirname, "data"));
}

let user = {
  name: "Admin",
  email: "admin@example.com",
  photo: "/uploads/default.png"
};

if (fs.existsSync(userFile)) {
  try {
    const saved = JSON.parse(fs.readFileSync(userFile));
    user = { ...user, ...saved };
  } catch (e) {
    console.warn("Gagal load user.json", e);
  }
}

function saveUser() {
  fs.writeFileSync(userFile, JSON.stringify(user, null, 2));
}



// ===== MongoDB connect (simple) =====
const MONGO_URI = process.env.MONGO_URI || process.env.MONGO || 'mongodb://localhost:27017/mycrm_local';
mongoose.set('strictQuery', false);
mongoose.connect(MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => console.log('MongoDB connected'))
  .catch(err => console.warn('MongoDB connect error:', err));

// --------------------
// Stats
let stats = {
  contacts: 120,
  deals: 50,
  tasks: 6,
  revenue: 85000000,
  revenueTrend: [12000000,15000000,13000000,18000000,22000000,20000000,25000000],
  dealsStage: [25,15,10],
  tasksStatus: [2,2,2]
};

// --------------------
// Generate 50 Deals
let dealsList = Array.from({ length: 50 }, (_, i) => ({
  id: i + 1,
  title: `Proyek #${i + 1}`,
  company: `Perusahaan ${i + 1}`,
  value: Math.floor(Math.random() * 20000000) + 1000000,
  status: ["Proposal Terkirim", "Inisiasi", "Negosiasi", "Selesai"][Math.floor(Math.random() * 4)]
}));

// --------------------
// Tasks awal
let tasks = generateRandomTasks().map(t => ({ text: t, done: false }));

// --------------------
// Contacts data
let contacts = [];

// --------------------
// Export ke Excel & CSV
app.get("/contacts/export/excel", (req, res) => {
  if (!contacts.length) return res.status(400).send("Belum ada kontak untuk diexport.");

  const worksheet = XLSX.utils.json_to_sheet(contacts);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "Contacts");

  const buffer = XLSX.write(workbook, { bookType: "xlsx", type: "buffer" });

  res.setHeader("Content-Disposition", "attachment; filename=contacts.xlsx");
  res.setHeader(
    "Content-Type",
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
  );
  res.send(buffer);
});

// Export Contacts ke CSV
app.get("/contacts/export/csv", (req, res) => {
  if (!contacts.length) return res.status(400).send("Belum ada kontak untuk diexport.");
  const parser = new Parser();
  const csv = parser.parse(contacts);

  res.header("Content-Type", "text/csv");
  res.attachment("contacts.csv");
  res.send(csv);
});

// --------------------
// Multer untuk foto
const uploadFolder = path.join(__dirname, "public", "uploads");
if (!fs.existsSync(uploadFolder)) fs.mkdirSync(uploadFolder);
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadFolder),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    const base = path.basename(file.originalname, ext).replace(/\s+/g, "_");
    cb(null, `${Date.now()}_${base}${ext}`);
  }
});
const upload = multer({ storage, limits: { fileSize: 2 * 1024 * 1024 } });

// --------------------
// Middleware set locals
app.use((req, res, next) => {
  res.locals.user = user; // profil static
  res.locals.stats = stats;
  next();
});

// Middleware currentUser dari session
app.use(async (req, res, next) => {
  if (req.session && req.session.userId) {
    try {
      const u = await User.findById(req.session.userId).lean();
      res.locals.currentUser = u || null;
    } catch {
      res.locals.currentUser = null;
    }
  } else {
    res.locals.currentUser = null;
  }
  next();
});

// --------------------
// Routes
// Dashboard
app.get("/", (req, res) => res.render("dashboard/index", { title: "Ringkasan" }));

// Deals
app.get("/deals", (req, res) => {
  const shuffled = dealsList.slice().sort(() => Math.random() - 0.5);
  res.render("deals/index", { title: "Catatan / Proyek", deals: shuffled });
});

// Contacts
app.get("/contacts", (req, res) => {
  res.render("contacts/index", { title: "Daftar Orang", contacts });
});

app.post("/contacts/add", (req, res) => {
  const { name, email, company, phone } = req.body;
  contacts.push({ id: Date.now(), name, email, company, phone });
  stats.contacts = contacts.length;
  res.redirect("/contacts");
});

app.post("/contacts/delete/:id", (req, res) => {
  contacts = contacts.filter(c => c.id != req.params.id);
  stats.contacts = contacts.length;
  res.redirect("/contacts");
});

// Tasks
app.get("/tasks", (req, res) => {
  res.render("tasks/index", { title: "To-Do List", tasks });
});
app.post("/tasks/update", (req, res) => {
  const done = req.body.done;
  if (!done) { tasks.forEach(t => t.done = false); }
  else if (Array.isArray(done)) { tasks.forEach((t, i) => t.done = done.includes(String(i))); }
  else { tasks.forEach((t, i) => t.done = (String(i) === String(done))); }

  if (tasks.length && tasks.every(t => t.done)) {
    tasks = generateRandomTasks().map(t => ({ text: t, done: false }));
  }
  res.redirect("/tasks");
});

// Stats edit
app.get("/stats", (req, res) => res.render("stats/edit", { title: "Ubah Statistik" }));
app.post("/stats", (req, res) => {
  const { contacts: c, deals: d, tasks: t, revenue: r } = req.body;
  stats.contacts = parseInt(c) || 0;
  stats.deals = parseInt(d) || 0;
  stats.tasks = parseInt(t) || 0;
  stats.revenue = parseInt(r) || 0;
  res.redirect("/");
});

// Profile
app.get("/profile", (req, res) => res.render("users/profile", { title: "Profil" }));
app.post("/profile", upload.single("photo"), (req, res) => {
  const { name, email } = req.body;
  if (name) user.name = name;
  if (email) user.email = email;
  if (req.file) user.photo = "/uploads/" + req.file.filename;
  saveUser();
  res.redirect("/profile");
});

// Reports
app.get("/reports", (req, res) => res.render("reports/index", { title: "Laporan" }));

// Search
app.get("/search", (req, res) => {
  const q = (req.query.q || "").toLowerCase();
  const found = contacts.filter(c =>
    c.name.toLowerCase().includes(q) ||
    c.email.toLowerCase().includes(q) ||
    c.company.toLowerCase().includes(q) ||
    c.phone.toLowerCase().includes(q)
  );
  res.render("search/index", { title: "Hasil Pencarian", contacts: found, q });
});

// --------------------
// Authentication Routes
// Register
app.get("/register", (req, res) => {
  if (req.session.userId) return res.redirect("/");
  res.render("auth/register", { title: "Register" });
});

app.post("/register", async (req, res) => {
  try {
    const { name, email, password } = req.body;
    if (!name || !email || !password)
      return res.render("auth/register", { title: "Register", error: "Isi semua field" });

    const exists = await User.findOne({ email });
    if (exists)
      return res.render("auth/register", { title: "Register", error: "Email sudah dipakai" });

    const hash = await bcrypt.hash(password, 10);
    const u = new User({ name, email, passwordHash: hash });
    await u.save();

    req.session.userId = u._id;
    req.session.userName = u.name;
    res.redirect("/");
  } catch (err) {
    console.error(err);
    res.render("auth/register", { title: "Register", error: "Terjadi error" });
  }
});

// Login
app.get("/login", (req, res) => {
  if (req.session.userId) return res.redirect("/");
  res.render("auth/login", { title: "Login" });
});

app.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    if (!user) return res.render("auth/login", { title: "Login", error: "User tidak ditemukan" });

    const ok = await bcrypt.compare(password, user.passwordHash);
    if (!ok) return res.render("auth/login", { title: "Login", error: "Password salah" });

    req.session.userId = user._id;
    req.session.userName = user.name;
    res.redirect("/");
  } catch (err) {
    console.error(err);
    res.render("auth/login", { title: "Login", error: "Terjadi error" });
  }
});

// Logout
app.get("/logout", (req, res) => {
  req.session.destroy(() => {
    res.clearCookie("connect.sid");
    res.redirect("/login");
  });
});

// --------------------
// fallback
app.use((req, res) => res.status(404).send("Not found"));

module.exports = app;

// --------------------
// Helper
function generateRandomTasks() {
  const pools = [
    "Follow up klien melalui email",
    "Hubungi lead prioritas via telepon",
    "Siapkan ringkasan pertemuan minggu ini",
    "Perbarui data kontak perusahaan",
    "Buat draft proposal singkat",
    "Upload dokumen invoice ke drive",
    "Analisis tren penjualan minggu lalu",
    "Atur jadwal demo produk",
    "Kirim ucapan ke pelanggan lama",
    "Cek laporan keuangan harian"
  ];
  const count = 5 + Math.floor(Math.random() * 3);
  const chosen = [];
  while (chosen.length < count) {
    const idx = Math.floor(Math.random() * pools.length);
    if (!chosen.includes(pools[idx])) chosen.push(pools[idx]);
  }
  return chosen;
}
