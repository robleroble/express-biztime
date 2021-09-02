const express = require("express");
const ExpressError = require("../expressError");
const router = express.Router();
const db = require("../db")

// return list of all companies
router.get("/", async (req, res, next) => {
    try {
        const results = await db.query("SELECT * FROM companies")
        return res.json({companies: results.rows})
    } catch(e) {
        return next(e)
    }
})

// return a single company based on code
router.get("/:code", async (req, res, next) => {
    try {
        const {code} = req.params;
        const result = await db.query("SELECT * FROM companies WHERE code=$1", [code])
        if (result.rows.length === 0) {
            throw new ExpressError(`Can't find company with code of ${code}`, 404);
        }
        return res.json({company: result.rows[0]});
    } catch(e) {
        return next(e)
    }
})

// add a new company
router.post("/", async (req, res, next) => {
    try {
        const {name, description} = req.body;
        let code = name.toLowerCase();
        console.log(code)
        const result = await db.query("INSERT INTO companies (code, name, description) VALUES ($1, $2, $3) RETURNING code, name, desription", [code, name, description]);
        return res.status(201).json({company: result.row[0]});
    } catch(e) {
        return next(e)
    }
})



module.exports = router;