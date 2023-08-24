process.env.NODE_ENV = 'test';

const request = require('supertest');
const app = require('./app');
const db = require('./db');

let testCompany;
let testInvoice;

beforeEach(async () => {
    const companyResult = await db.query(`INSERT INTO companies (code, name, description) VALUES ('apple', 'Apple', 'Maker of OSX') RETURNING *`);
    const invoiceResult = await db.query(`INSERT INTO invoices (comp_code, amt) VALUES ('apple', 100) RETURNING *`);
    const industryResult = await db.query(`INSERT INTO industries (industry, description) VALUES ('tech', 'produces and manufactures technology'), ('famous', 'well known brand')`);
    const companyIndustryResult = await db.query(`INSERT INTO companies_industries (company_id, industry_id) VALUES ('apple', 'tech'), ('apple', 'famous');`);
    testCompany = companyResult.rows[0];
    testInvoice = invoiceResult.rows[0];
});

afterEach(async () => {
    await db.query(`DELETE FROM companies_industries`);
    await db.query(`DELETE FROM companies`);
    await db.query(`DELETE FROM invoices`);
    await db.query(`DELETE FROM industries`)
});

describe('GET /companies', function() {
    test("Get a list of companies along with their information", async function() {
        const resp = await request(app).get('/companies');
        expect(resp.statusCode).toEqual(200);
        expect(resp.body).toEqual({companies: [{code: "apple", name: "Apple"}]})
    })
});

describe('GET /companies/:id', function() {
    test('Get an object of a company if the proper code is provided', async function() {
        const resp = await request(app).get('/companies/apple');
        expect(resp.statusCode).toEqual(200);
        expect(resp.body).toEqual({"code": "apple", "name": "Apple", "description": "Maker of OSX", "industries": [{"industry_id": "tech"}, {"industry_id": "famous"}]});
    });

    test('A 404 error should pop up if the code does not exist in the database', async function() {
        const resp = await request(app).get('/companies/something');
        expect(resp.statusCode).toEqual(404);
        expect(resp.body).toEqual(`Error: something can't be found.`)
    });
});

describe('POST /companies', function() {
    test('Adds a company if the appropriate JSON is provided in the body', async function() {
        const resp = await request(app).post('/companies').send({ code: "samsung", name: "Samsung", description: "Korean tech company"});
        expect(resp.statusCode).toEqual(200);
        expect(resp.body).toEqual({"company": {"code": "samsung", "name": "Samsung", "description": "Korean tech company"}})
    });

    test('If a code is provided that has a space, slugify() will add a "-" mark and use a word for any special characters (e.g. "&" to "and")', async function() {
        const resp = await request(app).post('/companies').send({ code: "barnes & noble", name: "Barnes & Noble", description: "Book store"});
        expect(resp.statusCode).toEqual(200);
        expect(resp.body).toEqual({"company": {"code": "barnes-and-noble", "name": "Barnes & Noble", description: "Book store"}})
    });

    test('An error should pop up if only some JSON data is provided', async function() {
        const resp = await request(app).post('/companies').send({ code: "samsung", name: "Samsung"});
        expect(resp.statusCode).toEqual(400);
        expect(resp.body).toEqual(`Error: incomplete JSON object provided in request.`)
    });

    test('An error should pop up if no JSON data is provided', async function() {
        const resp = await request(app).post('/companies');
        expect(resp.statusCode).toEqual(400);
        expect(resp.body).toEqual(`Error: incomplete JSON object provided in request.`)
    })
});

describe('PUT /companies/:code', function() {
    test('Edits information on an existing company if the proper code and JSON are provided', async function() {
        const resp = await request(app).put('/companies/apple').send({ name: "Apple", description: "Creator of iPhone"});
        expect(resp.statusCode).toEqual(200);
        expect(resp.body).toEqual({"company": {"code": "apple", "name": "Apple", "description": "Creator of iPhone"}});
    });
    
    test('An error should pop up if a code is provided that is not in the database', async function() {
        const resp = await request(app).put('/companies/ibm').send({ name: "ibm", description: "Creator of computers"});
        expect(resp.statusCode).toEqual(404);
        expect(resp.body).toEqual(`Error: ibm could not be updated. Please provide valid JSON and a valid code.`)
    })

    test('An error should pop up if no code is provided', async function() {
        const resp = await request(app).put('/companies/').send({ name: "Apple", description: "Creator of iPhone"});
        expect(resp.statusCode).toEqual(404);
        expect(resp.body).toEqual({"error": {"message": "Not Found", "status": 404}, "message": "Not Found"});
    });

    test('An error should pop up if no JSON is provided', async function() {
        const resp = await request(app).put('/companies/apple').send(null);
        expect(resp.statusCode).toEqual(404);
        expect(resp.body).toEqual("Error: Please provide valid JSON and a valid code.")
    });

    test('An error should pop up if neither JSON nor a code are provided', async function() {
        const resp = await request(app).put('/companies/');
        expect(resp.statusCode).toEqual(404);
        expect(resp.body).toEqual({"error": {"message": "Not Found", "status": 404}, "message": "Not Found"})
    })
});

describe('DELETE /companies/:code', function() {
    test('Deletes information on a company if a valid code is provided', async function() {
        const resp = await request(app).delete('/companies/apple');
        expect(resp.statusCode).toEqual(200);
        expect(resp.body).toEqual({status: "deleted"})
    });

    test('An error should pop up if a code is provided that is not in the database', async function() {
        const resp = await request(app).delete('/companies/ibm');
        expect(resp.statusCode).toEqual(404);
        expect(resp.body).toEqual(`Error: ibm can't be found`)
    });

    test('An error should pop up if no code is provided', async function() {
        const resp = await request(app).delete('/companies/');
        expect(resp.statusCode).toEqual(404);
        expect(resp.body).toEqual({"error": {"message": "Not Found", "status": 404}, "message": "Not Found"})
    })
});

describe('GET /invoices', function() {
    test('Returns information on invoices', async function() {
        const resp = await request(app).get('/invoices');
        expect(resp.statusCode).toEqual(200);
        expect(resp.body).toEqual({"invoices": [{"id": expect.any(Number), "comp_code": "apple"}]})
    })
});

describe('GET /invoices/:id', function() {
    test('Returns information on one invoice if the right id is provided', async function() {
        const search = await request(app).get('/invoices');
        let id = search.body.invoices[0].id;
        const resp = await request(app).get(`/invoices/${id}`);
        expect(resp.statusCode).toEqual(200);
        expect(resp.body).toEqual({"invoice": [{"id": expect.any(Number), "amt": 100, "paid": false, "add_date": expect.any(String), "paid_date": null, "company": {"code": "apple", "name": "Apple", "description": "Maker of OSX"}}]})
    });

    test('A 404 error should pop up if an id is provided that does not exist in the database', async function() {
        const resp = await request(app).get('/invoices/10000');
        expect(resp.statusCode).toEqual(404);
        expect(resp.body).toEqual("Error: invoice can't be found.")
    })
});

describe('POST /invoices', function() {
    test('Creates a new invoice if the appropriate JSON is provided and the comp_code corresponds with a code in the companies table', async function() {
        const resp = await request(app).post('/invoices').send({"comp_code": "apple", "amt": 200});
        expect(resp.statusCode).toEqual(200);
        expect(resp.body).toEqual({"invoice": {"id": expect.any(Number), "comp_code": "apple", "amt": 200, "paid": false, "add_date": expect.any(String), "paid_date": null}})
    });
    
    test('A 400 error pops up if no JSON data is provided', async function() {
        const resp = await request(app).post('/invoices').send(null);
        expect(resp.statusCode).toEqual(400);
        expect(resp.body).toEqual(`Error: incomplete JSON object provided in request.`);
    });

    test('A 400 error pops up if only some JSON data is provided', async function() {
        const resp = await request(app).post('/invoices').send({"comp_code": "apple"});
        expect(resp.statusCode).toEqual(400);
        expect(resp.body).toEqual('Error: incomplete JSON object provided in request.')
    });

    test('A 400 error pops up if the comp_code provided does not correspond with any codes within the companies table', async function() {
        const resp = await request(app).post('/invoices').send({"comp_code": "ibm", "amt": 200});
        expect(resp.statusCode).toEqual(400);
        expect(resp.body).toEqual(`Error: ibm is not an existing company within our database.`)
    });
});

describe('PUT /invoices/:id', function() {
    test('Updates an invoice if the appropriate JSON and id are provided', async function() {
        const search = await request(app).get('/invoices');
        let id = search.body.invoices[0].id;
        const resp = await request(app).put(`/invoices/${id}`).send({"amt": 150, "paid": false});
        expect(resp.statusCode).toEqual(200);
        expect(resp.body).toEqual({"invoice": {"id": expect.any(Number), "comp_code": "apple", "amt": 150, "paid": false, "add_date": expect.any(String), "paid_date": null}})
    });

    test('Updates the paid_date to current date if paid is true', async function() {
        const search = await request(app).get('/invoices');
        let id = search.body.invoices[0].id;
        const resp = await request(app).put(`/invoices/${id}`).send({"amt": 150, "paid": true});
        expect(resp.statusCode).toEqual(200);
        expect(resp.body).toEqual({"invoice": {"id": expect.any(Number), "comp_code": "apple", "amt": 150, "paid": true, "add_date": expect.any(String), "paid_date": expect.any(String)}}) 
    });

    test('A 404 error should pop up if an id is provided that is not in the database', async function() {
        const resp = await request(app).put('/invoices/10000').send({"amt": 150, "paid": false});
        expect(resp.statusCode).toEqual(404);
        expect(resp.body).toEqual("Error: invoice could not be updated. Please provide valid JSON and a valid invoice id.")
    })
});

describe('DELETE /invoices/:id', function() {
    test('Deletes an invoice if the appropriate id is provided', async function() {
        const search = await request(app).get('/invoices');
        let id = search.body.invoices[0].id;
        const resp = await request(app).delete(`/invoices/${id}`);
        expect(resp.statusCode).toEqual(200);
        expect(resp.body).toEqual({"status": "deleted"})
    });

    test('A 404 error should pop up if an id is provided that is not in the database', async function() {
        const resp = await request(app).delete('/invoices/10000');
        expect(resp.statusCode).toEqual(404);
        expect(resp.body).toEqual("Error: invoice can't be found.")
    })
});

describe('GET /invoices/companies/:code', function() {
    test('Returns an object containing details on the company along with any invoices from the company if a code is provided that is in the companies table', async function() {
        const resp = await request(app).get('/invoices/companies/apple');
        expect(resp.statusCode).toEqual(200);
        expect(resp.body).toEqual({"company": {"code": "apple", "name": "Apple", "description": "Maker of OSX", "invoices": {"id": expect.any(Number), "comp_code": "apple", "amt": 100, "paid": false, "add_date": expect.any(String), "paid_date": null}}})
    });

    test('A 404 error should pop up if an code is provided that is not in the database', async function() {
        const resp = await request(app).get('/invoices/companies/ibm');
        expect(resp.statusCode).toEqual(404);
        expect(resp.body).toEqual("Error: ibm can't be found.")
    })
});

describe('GET /industries', function() {
    test('Returns an object containing all available industries along with companies within each industry', async function() {
        const resp = await request(app).get('/industries');
        expect(resp.statusCode).toEqual(200);
        expect(resp.body).toEqual({"industries": [{"industry": "tech", "description": "produces and manufactures technology", "companies": ["apple"]}, {"industry": "famous", "description": "well known brand", "companies": ["apple"]}]});
    })
});

describe('GET /industries/:industry', function() {
    test('Returns an object containing information on a specified industry along with any companies', async function() {
        const resp = await request(app).get('/industries/tech');
        expect(resp.statusCode).toEqual(200);
        expect(resp.body).toEqual({"industry": {"industry": "tech", "description": "produces and manufactures technology", "companies": ["apple"]}})
    });

    test('A 404 error should pop up if the industry provided is not in the database', async function() {
        const resp = await request(app).get('/industries/somethingelse');
        expect(resp.statusCode).toEqual(404);
        expect(resp.body).toEqual("Error: somethingelse can't be found.")
    })
});

describe('POST /industries', function() {
    test('Creates a new industry if valid JSON is provided', async function() {
        const resp = await request(app).post('/industries').send({"industry": "accounting", "description": "numbers and stuff"});
        expect(resp.statusCode).toEqual(200);
        expect(resp.body).toEqual({"industry": {"industry": "accounting", "description": "numbers and stuff"}})
    });

    test('A 400 error should pop up if only some JSON is provided', async function() {
        const resp = await request(app).post('/industries').send({"industry": "accounting"});
        expect(resp.statusCode).toEqual(400);
        expect(resp.body).toEqual("Error: please provide valid JSON.")
    });

    test('A 400 error should pop up if no JSON is provided', async function() {
        const resp = await request(app).post('/industries').send(null);
        expect(resp.statusCode).toEqual(400);
        expect(resp.body).toEqual("Error: please provide valid JSON.")
    })
});

describe('POST /industries/:industry', function() {
    test('Associates an industry with a company if a valid industry and code are provided', async function() {
        await db.query(`INSERT INTO industries (industry, description) VALUES ('accounting', 'numbers and stuff')`);
        const resp = await request(app).post('/industries/accounting').send({"code": "apple"});
        expect(resp.statusCode).toEqual(200);
        expect(resp.body).toEqual({"company_id": "apple", "industry_id": "accounting"})
    })
})