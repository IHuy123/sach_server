const { Router } = require('express');
const router = Router();
const multer = require("multer");
const pool = require('../db');
const upload = multer();

router.post("/upload", upload.single("file"), async (req, res) => {
  const { originalname, buffer } = req.file;
  const name = originalname.replace(/\.[^/.]+$/, "");
  const data = req.file.buffer;

  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    const query = {
      text: "INSERT INTO pdf_files (name, data) VALUES ($1, $2)",
      values: [name, data],
    };
    await client.query(query);

    await client.query("COMMIT");

    res.sendStatus(200);
  } catch (e) {
    await client.query("ROLLBACK");
    console.error(e);
    res.sendStatus(500);
  } finally {
    client.release();
  }
});

router.get("/download/:id", async (req, res) => {
  const { id } = req.params;

  const client = await pool.connect();
  try {
    const query = {
      text: "SELECT name, data FROM pdf_files WHERE id = $1",
      values: [id],
    };
    const result = await client.query(query);

    if (result.rowCount === 0) {
      res.sendStatus(404);
      return;
    }

    //const { name, data } = result.rows[0];
    //res.send(name);
    res.send(result.rows);
  } catch (e) {
    console.error(e);
    res.sendStatus(500);
  } finally {
    client.release();
  }
});

module.exports = router;