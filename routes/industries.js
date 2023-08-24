const express = require("express");
const router = new express.Router();
const db = require("../db");

// Should display all the available industries with information, along with any company codes
// {"industries": [{"industry", "description", "companies": ["company_id", ...]}, ...]}
router.get('/', async (req, res, next) => {
    try {
        const results = await db.query(`SELECT * FROM industries`);
        for (let r of results.rows){
            const companies = await db.query(`SELECT company_id FROM companies_industries WHERE industry_id = $1`, [r.industry]);
            if (companies.rows.length !== 0){
                r.companies = [];
                for (let comp of companies.rows){
                    r.companies.push(comp.company_id)
                }
            }
        }
        return res.json({industries: results.rows});
    }
    catch (e) {
        next(e)
    }
});

// Should display information on the industry, along with any company codes
// {"industry": {"industry", "description", "companies": [{"company_id"}, ...]}}
router.get('/:industry', async (req, res, next) => {
    try {
        const results = await db.query(`SELECT * FROM industries WHERE industry = $1`, [req.params.industry]);
        if (results.rows.length === 0){
            return res.status(404).json(`Error: ${req.params.industry} can't be found.`)
        }
        const companies = await db.query(`SELECT company_id FROM companies_industries WHERE industry_id = $1`, [req.params.industry]);
        if(companies.rows.length !== 0){
            results.rows[0].companies = [];
            for (let comp of companies.rows){
                results.rows[0].companies.push(comp.company_id)
            }
        }
        return res.json({industry: results.rows[0]})
    }
    catch (e) {
        next(e)
    }
});

// Should add a new industry to industries if valid JSON is provided. If invalid JSON is provided, a 400 error will pop up.
// {"industry", "description"} => {"industry": {"industry", "description"}};
router.post('/', async (req, res, next) => {
    try {
        const { industry, description } = req.body;
        if (!industry || !description){
            res.status(400).json(`Error: please provide valid JSON.`)
        }
        const results = await db.query(`INSERT INTO industries (industry, description) VALUES ($1, $2) RETURNING *`, [industry, description]);
        return res.json({industry: results.rows[0]})
    }
    catch (e) {
        next(e)
    }
});

// Should associate an industry with a given company if both the industry and code are correct
// {"code"} => {"company_id", "industry_id"}
router.post('/:industry', async (req, res, next) => {
    try {
        const industry = req.params.industry;
        const { code } = req.body;
        if (!code){
            return res.status(400).json(`Error: Please provide valid JSON.`)
        }
        const verifyIndustry = await db.query(`SELECT * FROM industries WHERE industry = $1`, [industry]);
        if (verifyIndustry.rows === 0){
            return res.status(404).json(`Error: ${industry} is not a valid industry in the database.`)
        }
        const verifyCompany = await db.query(`SELECT * FROM companies WHERE code = $1`, [code]);
        if (verifyCompany.rows === 0){
            return res.status(404).json(`Error: ${code} is not a valid company in the database.`)
        }
        const results = await db.query(`INSERT INTO companies_industries (company_id, industry_id) VALUES ($1, $2) RETURNING *`, [code, industry]);
        return res.json(results.rows[0])
    }
    catch (e) {
        next(e)
    }
});

module.exports = router;