const express = require("express");
const slugify = require("slugify");
const ExpressError = require("../expressError");
const router = express.Router();
const db = require("../db");

// return list of all companies
router.get("/", async (req, res, next) => {
  try {
    const results = await db.query("SELECT * FROM companies");
    return res.json({ companies: results.rows });
  } catch (e) {
    return next(e);
  }
});

// return a single company based on code
router.get("/:code", async (req, res, next) => {
  try {
    const { code } = req.params;

    const result = await db.query(
      `SELECT c.code, c.name, ind.industry
        FROM companies as c
          LEFT JOIN industries_companies as ic
            ON c.code = ic.company_code
          LEFT JOIN industries as ind ON ic.industry_code = ind.code
        WHERE c.code=$1`,
      [code]
    );

    const companyResult = await db.query(
      `SELECT * 
      FROM companies 
      WHERE code=$1`,
      [code]
    );

    const invoiceResult = await db.query(
      `SELECT id 
      FROM invoices 
      WHERE comp_code=$1`,
      [code]
    );

    if (companyResult.rows.length === 0) {
      throw new ExpressError(`Can't find company with code of ${code}`, 404);
    }
    let company = result.rows[0];
    company.invoices = invoiceResult.rows.map((inv) => inv.id);
    let industries = result.rows.map((r) => r.industry);
    company.industries = industries;
    return res.json({
      company: company,
    });
  } catch (e) {
    return next(e);
  }
});

// add a new company
router.post("/", async (req, res, next) => {
  try {
    const { name, description } = req.body;
    const code = slugify(name, { lower: true });
    const result = await db.query(
      `INSERT INTO companies (code, name, description) 
        VALUES ($1, $2, $3) 
        RETURNING code, name, description`,
      [code, name, description]
    );
    return res.status(201).json({ company: result.rows[0] });
  } catch (e) {
    return next(e);
  }
});

// update a company
router.put("/:code", async (req, res, next) => {
  try {
    const { name, description } = req.body;
    const { code } = req.params;
    const result = await db.query(
      `UPDATE companies SET name=$1, description=$2
        WHERE code = $3
        RETURNING code, name, description`,
      [name, description, code]
    );
    if (result.rows.length === 0) {
      throw new ExpressError(`Can't find company with code of ${code}.`, 404);
    }
    return res.json({ company: result.rows[0] });
  } catch (e) {
    return next(e);
  }
});

// delete a company
router.delete("/:code", async (req, res, next) => {
  try {
    const { code } = req.params;
    const result = await db.query(
      `DELETE FROM companies
      WHERE code=$1
      RETURNING code`,
      [code]
    );
    if (result.rows.length === 0) {
      throw new ExpressError(`Can't find company with code of ${code}.`, 404);
    }
    return res.json({ message: "Deleted" });
  } catch (e) {
    return next(e);
  }
});

module.exports = router;
