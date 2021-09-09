const express = require("express");
const ExpressError = require("../expressError");
const router = express.Router();
const db = require("../db");

// get all industries (and companies associated with each industry)
router.get("/", async (req, res, next) => {
  try {
    // simple query to get all industries
    const industriesResults = await db.query(
      `SELECT code, industry FROM industries`
    );

    // simple query to get companies with relation to industries
    // we only want the company code for this route (no Name, etc)
    const companiesResults = await db.query(
      `SELECT company_code, industry_code 
				FROM industries_companies`
    );

    // store industries in a variable
    const industries = industriesResults.rows.map((ind) => ind);

    // map over industries, adding a companies key that is populated by filtering the companies results then mapping over results to populate array of company codes
    const industriesComps = industriesResults.rows.map((i) => {
      i.companies = companiesResults.rows
        .filter((c) => c.industry_code === i.code)
        .map((company) => company.company_code);
    });

    // Honestly not sure how this ended up working
    return res.json({ industries });
  } catch (e) {
    return next(e);
  }
});

// add a new industry
router.post("/", async (req, res, next) => {
  try {
    const { code, industry } = req.body;
    const result = await db.query(
      `INSERT INTO industries (code, industry)
				VALUES ($1, $2)
				RETURNING code, industry`,
      [code, industry]
    );
    return res.status(201).json({ industry: result.rows[0] });
  } catch (e) {
    return next(e);
  }
});

// add a new industries_companies row
router.post("/:industry_code", async (req, res, next) => {
  try {
    const { industry_code } = req.params;
    const { comp_code } = req.body;
    const result = await db.query(
      `INSERT INTO industries_companies (industry_code, company_code)
				VALUES ($1, $2)
				RETURNING company_code, industry_code`,
      [industry_code, comp_code]
    );
    return res.status(201).json({ "new comp_ind": result.rows[0] });
  } catch (e) {
    return next(e);
  }
});

module.exports = router;
