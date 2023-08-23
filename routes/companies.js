const express = require("express");
const router = new express.Router();
const db = require("../db");

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
// E.g. {code, name, description}
router.get('/:code', async (req, res) => {
    try {
        const results = await db.query(`SELECT code, name, description FROM companies WHERE code=$1`, [req.params.code]);
        if (results.rows.length === 0){
            return res.status(404).json(`Error: ${req.params.code} can't be found`)
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
            const results = await db.query(`INSERT INTO companies (code, name, description) VALUES ($1, $2, $3) RETURNING *`, [code, name, description]);
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
            return res.status(400).json(`Error: incomplete JSON object provided in request.`)
        }
        const results = await db.query(`UPDATE companies SET name=$1, description=$2 WHERE code=$3 RETURNING code, name, description`, [name, description, req.params.code]);
        if (results.rows.length === 0){
            return res.status(404).json(`Error: ${req.params.code} can't be found`)
        }
        return res.json({company: results.rows[0]})
    }
    catch (e) {
        //return res.status(404).json(`Error: ${req.params.code} can't be found`)
        next(e)
    }
});

// Deletes company. Returns a 404 if company doesn't exist.
// Returns {status: "deleted"}
router.delete('/:code', async (req, res, next) => {
    try {
        const verify = await db.query(`SELECT * FROM companies WHERE code=$1`, [req.params.code]);
        if(verify.rows.length === 0){
            return res.status(404).json(`Error: ${req.params.code} can't be found`)
        }
        await db.query('DELETE FROM companies WHERE code=$1', [req.params.code]);
        return res.json({status: "deleted"})
    }
    catch (e) {
        //return res.status(404).json(`Error: ${req.params.code} can't be found`)
        next(e)
    }
});

module.exports = router;