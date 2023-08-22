const express = require("express");
const router = new express.Router();
const db = require("../db");

// Return information on invoices
// {invoices: [{id, comp_code}, ...]}
router.get('/invoices', async (req, res, next) => {
    try {
        const results = await db.query(`SELECT id, comp_code FROM invoices`);
        return res.json(results.rows)
    }
    catch (e) {
        next(e)
    }
});

// Return object on a given invoice. If it can't be found, return a 404
// {invoice: [{id, amt, paid, add_date, paid_date, company: {code, name, description}}]}
router.get('/invoices/:id', async (req, res, next) => {
    try {
        fff
    }
    catch (e) {
        fff
    }
});

// Adds an invoice if appropriate json is provided. Returns new invoice object.
// {comp_code, amt} => {invoice: {id, comp_code, amt, paid, add_date, paid_date}}.
router.post('/invoices', async (req, res, next) => {
    try {
        fff
    }
    catch (e) {
        fff
    }
});

// Updates an invoice if appropriate json is provided and returns updated invoice. If invoice can't be found, returns a 404.
// {amt} => {invoice: {id, comp_code, amt, paid, add_date, paid_date}}
router.put('/invoices/:id', async (req, res, next) => {
    try {
        fff
    }
    catch (e) {
        fff
    }
});

// Deletes an invoice and returns a message. If invoice can't be found, returns a 404.
// {status: "deleted"}
router.delete('/invoices/:id', async (req, res, next) => {
    try {
        fff
    }
    catch (e) {
        fff
    }
});

router.get('/companies/:code', async (req, res, next) => {
    try {
        fff
    }
    catch (e) {
        fff
    }
});

module.exports = router;