const pg = require("pg");
require("dotenv").config();
const express = require("express");
const app = express();

const PORT = process.env.PORT || 3000;
const client = new pg.Client();

app.use(express.json());
app.use(require("morgan")("dev"));

app.get("/api/departments", async (req, res, next) => {
  try {
    const SQL = `SELECT * FROM departments`;
    const { rows } = await client.query(SQL);
    console.log(rows);
    res.send(rows);
  } catch (error) {
    next(error);
  }
});

app.get("/api/employee", async (req, res, next) => {
  try {
    const SQL = `SELECT * FROM employee ORDER BY created_at DESC`;
    const { rows } = await client.query(SQL);
    console.log(rows);
    res.send(rows);
  } catch (error) {
    next(error);
  }
});

app.post("/api/employee", async (req, res, next) => {
  try {
    console.log(req.body);
    const SQL = `INSERT INTO employee(name, category_id, VALUES($1, $2,) RETURNING *;)`;
    const { rows } = await client.query(SQL, [
      req.body.name,
      req.body.category_id,
    ]);
    res.send(rows[0]);
  } catch (error) {
    next(error);
  }
});

app.put("/api/employee:id", async (req, res, next) => {
  try {
    const SQL = `
      UPDATE notes
      SET name=$1, category_id=$2, updated_at= now()
      WHERE id=$4 RETURNING *
    `;
    const { rows } = await client.query(SQL, [
      req.body.name,
      req.body.category_id,
      req.params.id,
    ]);
    res.send({ message: "successfully updated", result: rows[0] });
  } catch (error) {
    next(error);
  }
});

app.delete("/api/employee:id", async (req, res, next) => {
  try {
    const SQL = `
      DELETE from employee
      WHERE id = $1
    `;
    const response = await client.query(SQL, [req.params.id]);
    res.sendStatus(204);
  } catch (error) {
    next(error);
  }
});

const init = async () => {
  try {
    await client.connect();
    let SQL = `
    DROP TABLE IF EXISTS employee;
    DROP TABLE IF EXISTS departments;
    CREATE TABLE departments(
    id SERIAL PRIMARY KEY,
    name VARCHAR(100)
    );
    CREATE TABLE employee(
    id SERIAL PRIMARY KEY,
    name VARCHAR(100),
    created_at TIMESTAMP DEFAULT now(),
    updated_at TIMESTAMP DEFAULT now(),
    department_id INTEGER REFERENCES departments(id) NOT NULL
    );`;

    console.log("connecting");
    await client.query(SQL);
    console.log("conected");

    SQL = `
    INSERT INTO departments(name) VALUES('Events');
    INSERT INTO departments(name) VALUES('Payroll');
    INSERT INTO departments(name) VALUES('Recreation');
    INSERT INTO employee(name, department_id) VALUES('Zach',
    (SELECT id FROM departments WHERE name='Payroll'));
    INSERT INTO employee(name, department_id) VALUES('Eric',
    (SELECT id FROM departments WHERE name='Events'));
    INSERT INTO employee(name, department_id) VALUES('Bikna',
    (SELECT id FROM departments WHERE name='Recreation'));
    `;
    console.log("Seeding data...");
    await client.query(SQL);
    console.log("seeded!");

    app.listen(PORT, () => {
      console.log(`server alive on port${PORT}`);
    });
  } catch (error) {}
};

init();
