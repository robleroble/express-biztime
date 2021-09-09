const express = require("express");
const ExpressError = require("../expressError");
const router = express.Router();
const db = require("../db");

// get all invoices
router.get("/", async (req, res, next) => {
  try {
    const results = await db.query(
      `SELECT *
        FROM invoices`
    );
    return res.json({ invoices: results.rows });
  } catch (e) {
    return next(e);
  }
});

// get an invoice by id
router.get("/:id", async (req, res, next) => {
  try {
    const { id } = req.params;
    const result = await db.query(
      `SELECT i.id,
                i.comp_code,
                i.amt,
                i.paid,
                i.add_date,
                i.paid_date,
                c.name,
                c.description
          FROM invoices as i
          INNER JOIN companies as c ON i.comp_code=c.code
          WHERE id=$1
          `,
      [id]
    );
    if (result.rows.length === 0) {
      throw new ExpressError("This invoice doesn't exist", 404);
    }
    const data = result.rows[0];
    return res.json({
      invoice: {
        id: data.id,
        amt: data.amt,
        paid: data.paid,
        add_date: data.add_date,
        paid_date: data.paid_date,
        company: {
          code: data.comp_code,
          name: data.name,
          description: data.description,
        },
      },
    });
  } catch (e) {
    return next(e);
  }
});

// create an invoice
router.post("/", async (req, res, next) => {
  try {
    const { comp_code, amt } = req.body;
    const paid_date = null;
    const result = await db.query(
      `INSERT INTO invoices (comp_code, amt, paid_date)
      VALUES ($1, $2, $3)
      RETURNING id, comp_code, amt, paid, add_date, paid_date`,
      [comp_code, amt, paid_date]
    );
    // const data = result.rows[0]
    return res.status(201).json({ invoice: result.rows[0] });
  } catch (e) {
    return next(e);
  }
});

// updates an invoice (only updates the amount)
router.put("/:id", async (req, res, next) => {
  try {
    const { amt, paid } = req.body;
    const { id } = req.params;

    // call invoice to see if it exists
    const currentInvoice = await db.query(
      `SELECT * FROM invoices WHERE id=$1`,
      [id]
    );

    if (currentInvoice.rows.length === 0) {
      throw new ExpressError("Can't find that invoice.", 404);
    }

    // if invoice totally paid
    if (paid) {
      console.log("paid is true");
      const current_date = new Date();
      const result = await db.query(
        `UPDATE invoices SET amt=$1, paid=$2, paid_date=$3
          WHERE id = $4
          RETURNING id, comp_code, amt, paid, add_date, paid_date`,
        [amt, paid, current_date, id]
      );
      return res.json({ invoice: result.rows[0] });
      // if invoice not paid in full
    } else if (!paid) {
      console.log("paid is false");
      const result = await db.query(
        `UPDATE invoices SET amt=$1
          WHERE id = $2
          RETURNING id, comp_code, amt, paid, add_date, paid_date`,
        [amt, id]
      );
      return res.json({ invoice: result.rows[0] });
    }

    return res.json({ invoice: result.rows[0] });
  } catch (e) {
    return next(e);
  }
});

// delete an invoice
router.delete("/:id", async (req, res, next) => {
  try {
    const { id } = req.params;
    const result = await db.query(
      `DELETE FROM invoices
            WHERE id=$1
            RETURNING id`,
      [id]
    );
    console.log(result.rows);
    if (result.rows.length === 0) {
      throw new ExpressError("Invoice doesn't exist", 404);
    }
    return res.json({ status: "deleted" });
  } catch (e) {
    return next(e);
  }
});
module.exports = router;
