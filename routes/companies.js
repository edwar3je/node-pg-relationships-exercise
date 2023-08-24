const express = require("express");
const router = new express.Router();
const db = require("../db");
const slugify = require('slugify');

// Returns a list of companies in object format
// 'apple' or 'ibm'
// E.g. {companies [{code, name}, ...]}
router.get('/', async (req, res, next) => {
    try {
        const results = await db.query(`SELECT code, name FROM companies`);
        return res.json({companies: results.rows})
    }
    catch (e) {
        next(e)
    }
});

// Returns an object of the company. If not found, returns a 404 response.
// E.g. {code, name, description, industries}
router.get('/:code', async (req, res) => {
    try {
        const results = await db.query(`SELECT code, name, description FROM companies WHERE code=$1`, [req.params.code]);
        if (results.rows.length === 0){
            return res.status(404).json(`Error: ${req.params.code} can't be found.`)
        }
        const industries = await db.query(`SELECT industry_id FROM companies_industries WHERE company_id = $1`, [req.params.code]);
        if (industries.rows.length !== 0){
            results.rows[0].industries = industries.rows;
        }
        return res.json(results.rows[0])
    }
    catch (e) {
        next(e)
    }
});

// Adds a company to the bizkit database if given appropriate JSON and returns an object of the new company.
// {code, name, description} => {company: {code, name, description}} 
router.post('/', async (req, res, next) => {
    try {
        const { code, name, description } = req.body;
        if (code && name && description){
            let newCode = slugify(code);
            const results = await db.query(`INSERT INTO companies (code, name, description) VALUES ($1, $2, $3) RETURNING *`, [newCode, name, description]);
            return res.json({company: results.rows[0]})
        }
        return res.status(400).json(`Error: incomplete JSON object provided in request.`)
    }
    catch (e) {
        next(e)
    }
});

// Edits existing company if given appropriate JSON. Returns a 404 if the company can't be found.
// {name, description} => {company: code, name, description}}
router.put('/:code', async (req, res, next) => {
    try {
        const { name, description } = req.body;
        if (!name || !description){
            return res.status(404).json(`Error: Please provide valid JSON and a valid code.`)
        }
        const results = await db.query(`UPDATE companies SET name=$1, description=$2 WHERE code=$3 RETURNING code, name, description`, [name, description, req.params.code]);
        if (results.rows.length === 0){
            return res.status(404).json(`Error: ${req.params.code} could not be updated. Please provide valid JSON and a valid code.`)
        }
        return res.json({company: results.rows[0]})
    }
    catch (e) {
        next(e)
    }
});

// Deletes company. Returns a 404 if company doesn't exist.
// Returns {status: "deleted"}
router.delete('/:code', async (req, res, next) => {
    try {
        const results = await db.query('DELETE FROM companies WHERE code=$1 RETURNING code', [req.params.code]);
        if (results.rows.length === 0){
            return res.status(404).json(`Error: ${req.params.code} can't be found`)
        }
        return res.json({status: "deleted"})
    }
    catch (e) {
        next(e)
    }
});

module.exports = router;