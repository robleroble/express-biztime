// set up testmode
process.env.NODE_ENV = "test";

const request = require("supertest");
const app = require("../app");
const db = require("../db");

let testCompany;
beforeEach(async () => {
  const result = await db.query(
    `INSERT INTO companies (code, name, description) VALUES ('google', 'Google', 'google is a company') RETURNING code, name, description`
  );
  testCompany = result.rows[0];
});

afterEach(async () => {
  await db.query(`DELETE FROM companies`);
});

afterAll(async () => {
  await db.end();
});

describe("GET /companies", () => {
  test("get a list with one company", async () => {
    const res = await request(app).get("/companies");
    expect(res.statusCode).toBe(200);
    expect(res.body).toEqual({ companies: [testCompany] });
  });
});

describe("GET /companies/:code", () => {
  test("get a single company by code", async () => {
    const res = await request(app).get("/companies/google");
    expect(res.statusCode).toBe(200);
    // we have to add an empty array for invoices because getting a single company expects invoices
    testCompany.invoices = [];
    expect(res.body).toEqual({ company: testCompany });
  });
  test("get error for using incorrect code", async () => {
    const res = await request(app).get("/companies/apple");
    expect(res.statusCode).toBe(404);
  });
});

describe("POST /companies", () => {
  test("create a new company", async () => {
    const res = await request(app)
      .post("/companies")
      .send({ name: "Apple", description: "apple is a company too" });
    expect(res.statusCode).toBe(201);
    expect(res.body).toEqual({
      company: {
        code: "apple",
        name: "Apple",
        description: "apple is a company too",
      },
    });
  });
});

describe("PUT /companies/google", () => {
  test("edit a company", async () => {
    const res = await request(app)
      .put("/companies/google")
      .send({ name: "goooooogle", description: "goooooogle is a companyyyyy" });
    expect(res.statusCode).toBe(200);
    expect(res.body).toEqual({
      company: {
        code: "google",
        name: "goooooogle",
        description: "goooooogle is a companyyyyy",
      },
    });
  });
  test("try to edit a company that doesn't exist", async () => {
    const res = await request(app)
      .put("/companies/gooogle")
      .send({ name: "yahoo", description: "yahoo is a company" });
    expect(res.statusCode).toBe(404);
  });
});

describe("DELETE /companies/google", () => {
  test("delete a company", async () => {
    const res = await request(app).delete("/companies/google");
    expect(res.statusCode).toBe(200);
    expect(res.body).toEqual({ message: "Deleted" });
  });
  test("delete a company that doesn't exist", async () => {
    const res = await request(app).delete("/companies/apple");
    expect(res.statusCode).toBe(404);
  });
});
