const express = require("express");
const router = new express.Router();
const db = require("../db");

// Return information on invoices
// {invoices: [{id, comp_code}, ...]}
router.get('/', async (req, res, next) => {
    try {
        const results = await db.query(`SELECT id, comp_code FROM invoices`);
        return res.json({invoices: results.rows})
    }
    catch (e) {
        next(e)
    }
});

// Return object on a given invoice. If it can't be found, return a 404
// {invoice: [{id, amt, paid, add_date, paid_date, company: {code, name, description}}]}
router.get('/:id', async (req, res, next) => {
    try {
        const results = await db.query(`SELECT id, amt, paid, add_date, paid_date, comp_code AS company FROM invoices WHERE id=$1`, [req.params.id]);
        if (results.rows.length == 0){
            return res.status(404).json(`Error: invoice can't be found`)
        }
        let companyCode = results.rows[0].company;
        const companyInformation = await db.query(`SELECT * FROM companies WHERE code=$1`, [companyCode]);
        results.rows[0].company = companyInformation.rows[0];
        return res.json({invoice: results.rows});
    }
    catch (e) {
        next(e)
    }
});

// Adds an invoice if appropriate json is provided. Returns new invoice object.
// {comp_code, amt} => {invoice: {id, comp_code, amt, paid, add_date, paid_date}}.
router.post('/', async (req, res, next) => {
    try {
        const { comp_code, amt } = req.body;
        if(!comp_code || !amt){
            return res.status(400).json(`Error: incomplete JSON object provided in request.`)
        }
        const verify = await db.query(`SELECT * FROM companies WHERE code=$1`, [comp_code]);
        if(verify.rows.length == 0){
            return res.status(400).json(`Error: ${comp_code} is not an existing company within our database.`)
        }
        const results = await db.query(`INSERT INTO invoices (comp_code, amt) VALUES ($1, $2) RETURNING *`, [comp_code, amt]);
        return res.json({invoice: results.rows[0]})
    }
    catch (e) {
        next(e)
    }
});

// Updates an invoice if appropriate json is provided and returns updated invoice. If invoice can't be found, returns a 404.
// {amt} => {invoice: {id, comp_code, amt, paid, add_date, paid_date}}
router.put('/:id', async (req, res, next) => {
    try {
        const amt = req.body.amt;
        if (!amt){
            return res.status(400).json(`Error: incomplete JSON object provided in request.`);
        }
        const results = await db.query(`UPDATE invoices SET amt=$1 WHERE id=$2 RETURNING id, comp_code, amt, paid, add_date, paid_date`, [amt, req.params.id]);
        if (results.rows.length == 0){
            return res.status(404).json(`Error: invoice can't be found`)
        }
        return res.json({invoice: results.rows[0]})
    }
    catch (e) {
        next(e)
    }
});

// Deletes an invoice and returns a message. If invoice can't be found, returns a 404.
// {status: "deleted"}
router.delete('/:id', async (req, res, next) => {
    try {
        const verify = await db.query(`SELECT * FROM invoices WHERE id=$1`, [req.params.id]);
        if(verify.rows.length == 0){
            return res.status(404).json(`Error: invoice can't be found`)
        }
        await db.query('DELETE FROM invoices WHERE id=$1', [req.params.id]);
        return res.json({status: "deleted"})
    }
    catch (e) {
        next(e)
    }
});

// Returns an object containing details on the company along with any invoices from the company. If the company can't be found, returns a 404.
// {company: {code, name, description, invoices: [id, ...]}}
router.get('/companies/:code', async (req, res, next) => {
    try {
        const results = await db.query(`SELECT * FROM companies WHERE code=$1`, [req.params.code]);
        if(results.rows.length == 0){
            return res.status(404).json(`Error: ${req.params.code} can't be found`)
        }
        const allInvoices = await db.query(`SELECT * FROM invoices WHERE comp_code=$1`, [req.params.code]);
        if(allInvoices.rows.length == 0){
            results.rows[0].invoices = null;
            return res.json({company: results.rows[0]})
        }
        else if(allInvoices.rows.length == 1){
            results.rows[0].invoices = allInvoices.rows[0];
            return res.json({company: results.rows[0]})
        }
        else {
            results.rows[0].invoices = allInvoices.rows;
            return res.json({company: results.rows[0]})
        }
    }
    catch (e) {
        next(e)
    }
})

module.exports = router;