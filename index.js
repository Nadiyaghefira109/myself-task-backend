import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import pool from './db.js'; // Pastikan file db.js ada di folder yang sama

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// --- MIDDLEWARE ---
// Mengaktifkan CORS agar frontend (port 5174) bisa mengakses backend (port 5000)
app.use(cors());
// Mengubah body request menjadi JSON agar bisa dibaca oleh server
app.use(express.json());

// --- ROUTES ---

// 1. GET: Mengambil semua tugas
app.get('/api/tasks', async (req, res) => {
  try {
    const queryResult = await pool.query(`
      SELECT 
        tasks.id,
        tasks.title,
        tasks.description,
        tasks.due_date,
        tasks.status,
        categories.name AS category_name,
        categories.color AS category_color
      FROM tasks
      LEFT JOIN categories ON tasks.category_id = categories.id
      ORDER BY tasks.id DESC;
    `);
    res.json(queryResult.rows);
  } catch (error) {
    console.error('Error saat mengambil data:', error.message);
    res.status(500).json({ error: 'Terjadi kesalahan pada server' });
  }
});

// 2. POST: Menambah tugas baru
app.post('/api/tasks', async (req, res) => {
  try {
    const { title, description, due_date, category_id } = req.body;
    
    const newTask = await pool.query(
      `INSERT INTO tasks (title, description, due_date, status, category_id) 
       VALUES ($1, $2, $3, 'Belum Selesai', $4) 
       RETURNING *;`,
      [title, description, due_date || null, category_id || 1]
    );

    res.status(201).json(newTask.rows[0]);
  } catch (error) {
    console.error('Error saat menambah data:', error.message);
    res.status(500).json({ error: 'Gagal menambahkan tugas' });
  }
});

// 3. DELETE: Menghapus tugas berdasarkan ID
app.delete('/api/tasks/:id', async (req, res) => {
  try {
    const { id } = req.params;
    await pool.query('DELETE FROM tasks WHERE id = $1', [id]);
    res.json({ message: 'Tugas berhasil dihapus' });
  } catch (error) {
    console.error('Error saat menghapus data:', error.message);
    res.status(500).json({ error: 'Gagal menghapus tugas' });
  }
});

// --- START SERVER ---
app.listen(PORT, () => {
  console.log(`🚀 Server backend berjalan dengan mulus di http://localhost:${PORT}`);
});