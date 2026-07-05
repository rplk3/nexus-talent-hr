const express = require("express");
const router = express.Router();
const pool = require("../config/db"); // use your new pg pool
const multer = require("multer");
const path = require("path");

// === Multer Storage (temporary local use, will later move to Supabase Storage) ===
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, "uploads/industry_images/");
    },
    filename: (req, file, cb) => {
        const uniqueName = Date.now() + "-" + file.originalname;
        cb(null, uniqueName);
    },
});
const upload = multer({ storage });

// === CREATE JOB ===
router.post("/", upload.single("industryImage"), async (req, res) => {
    const {
        title,
        company,
        location,
        type,
        experience,
        salary,
        salaryCurrency,
        description,
        gender,
        industry,
    } = req.body;

    const industryImage = req.file ? req.file.path : null;

    try {
        await pool.query(
            `INSERT INTO jobs
        (title, company, location, type, experience, salary, salary_currency, description, gender, industry, industry_image)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)`,
            [
                title,
                company,
                location,
                type,
                experience,
                salary,
                salaryCurrency || "AED",
                description,
                gender,
                industry || null,
                industryImage || null,
            ]
        );

        res.status(201).json({ message: "Job created successfully" });
    } catch (err) {
        console.error("Error inserting job:", err);
        res.status(500).json({ message: "Error creating job" });
    }
});

// === GET ALL JOBS ===
router.get("/", async (req, res) => {
    try {
        const result = await pool.query(
            `SELECT id, title, company, location, type, experience, salary, salary_currency AS "salaryCurrency",
              description, gender, industry, industry_image AS "industryImage"
       FROM jobs
       ORDER BY id DESC`
        );

        res.json(result.rows);
    } catch (err) {
        console.error("Error fetching jobs:", err);
        res.status(500).json({ message: "Error fetching jobs", error: err.message });
    }
});

// === GET SINGLE JOB BY ID ===
router.get("/:id", async (req, res) => {
    const { id } = req.params;

    try {
        const result = await pool.query(
            `SELECT id, title, company, location, type, experience, salary, salary_currency AS "salaryCurrency",
              description, gender, industry, industry_image AS "industryImage"
       FROM jobs
       WHERE id = $1`,
            [id]
        );

        if (result.rows.length === 0)
            return res.status(404).json({ message: "Job not found" });

        res.json(result.rows[0]);
    } catch (err) {
        console.error("Error fetching job:", err);
        res.status(500).json({ message: "Error fetching job" });
    }
});

// === UPDATE JOB ===
router.put("/:id", async (req, res) => {
    const { id } = req.params;
    const {
        title,
        company,
        location,
        type,
        experience,
        salary,
        salaryCurrency,
        description,
        gender,
        industry,
        industryImage, // 👈 Now coming from JSON body (Supabase URL)
    } = req.body;

    try {
        await pool.query(
            `UPDATE jobs
       SET title = $1, company = $2, location = $3, type = $4, experience = $5, salary = $6,
           salary_currency = $7, description = $8, gender = $9, industry = $10, industry_image = $11
       WHERE id = $12`,
            [
                title,
                company,
                location,
                type,
                experience,
                salary,
                salaryCurrency || "AED",
                description,
                gender,
                industry || null,
                industryImage || null, // 👈 Use the URL from request body
                id,
            ]
        );

        res.json({ message: "Job updated successfully" });
    } catch (err) {
        console.error("Error updating job:", err);
        res.status(500).json({ message: "Error updating job" });
    }
});

// === DELETE JOB ===
router.delete("/:id", async (req, res) => {
    const { id } = req.params;

    try {
        await pool.query(`DELETE FROM jobs WHERE id = $1`, [id]);
        res.json({ message: "Job deleted successfully" });
    } catch (err) {
        console.error("Error deleting job:", err);
        res.status(500).json({ message: "Error deleting job" });
    }
});

module.exports = router;
