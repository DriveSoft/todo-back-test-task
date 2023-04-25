const express = require("express");
const app = express();
const cors = require("cors");
const pool = require("./db");

// middleware
app.use(cors());
app.use(express.json());

// ROUTES

// create a todo
app.post("/todos", async (req, res) => {
	try {
		const { title, description } = req.body;
		const newTodo = await pool.query(
			"INSERT INTO todo (title, description) VALUES($1, $2) RETURNING *",
			[title, description]
		);

        res.json(newTodo.rows[0]);
	} catch (err) {
		console.error(err.message);
	}
});

// get all todos
app.get("/todos", async (req, res) => {
    try {
        const allTodos = await pool.query("SELECT * FROM todo");
        res.json(allTodos.rows);
    } catch (err) {
        console.error(err.message);
    }
});

// get a todo
app.get("/todos/:id", async (req, res) => {
    try {
        const { id } = req.params;
        const todo = await pool.query("SELECT * FROM todo WHERE id = $1", [id]);
        res.json(todo.rows[0]);
    } catch (err) {
        console.error(err.message);
    }
});

// update a todo
app.put("/todos/:id", async (req, res) => {
    try {
        const { id } = req.params;
        const { title, description } = req.body;
        const updateTodo = await pool.query(
            "UPDATE todo SET title = $1, description = $2 WHERE id = $3",
            [title, description, id]
        );
        res.json("Todo was updated!");
    } catch (err) {
        console.error(err.message);
    }
});


// delete a todo
app.delete("/todos/:id", async (req, res) => {
    try {
        const { id } = req.params;
        const deleteTodo = await pool.query("DELETE FROM todo WHERE id = $1 RETURNING *", [id]);  
        res.json(deleteTodo.rows[0]);        
    } catch (err) {
        console.error(err.message);
    }
});


app.listen(5000, () => {
	console.log("server is listening on port 5000");
});
