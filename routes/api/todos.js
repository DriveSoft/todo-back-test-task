const express = require("express");
const router = express.Router();
const pool = require("../../db");
const { validateTodo } = require("../../validator");

// get all todos
router.get("/", async (req, res) => {  
    try {
        const allTodos = await pool.query("SELECT * FROM todo WHERE user_id = $1", [req.user.userId]);
        res.json(allTodos.rows);
    } catch (err) {
        console.error(err.message);
    }
});

// create a todo
router.post("/", async (req, res) => {
	const { error, value } = validateTodo(req.body);   
    if (error) {
        console.log(error.details);
        return res.status(400).send(error.details[0].message);
    }     

    try {
		const newTodo = await pool.query(
			"INSERT INTO todo (title, description, completed, user_id) VALUES($1, $2, $3, $4) RETURNING *",
			[value.title, value.description, value.completed, req.user.userId]
		);

        res.json(newTodo.rows[0]);
	} catch (err) {
		console.error(err.message);
	}
});

// get a todo
router.get("/:id", async (req, res) => {
    try {
        const { id } = req.params;
        const todo = await pool.query("SELECT * FROM todo WHERE id = $1", [id]);
        res.json(todo.rows[0]);
    } catch (err) {
        console.error(err.message);
    }
});

// update a todo
router.put("/:id", async (req, res) => {
    const { error, value } = validateTodo(req.body);   
    if (error) {
        console.log(error.details);
        return res.status(400).send(error.details[0].message);
    }  

    try {
        const { id } = req.params;
        const updateTodo = await pool.query(
            "UPDATE todo SET title = $1, description = $2, completed = $3 WHERE id = $4 RETURNING *",
            [value.title, value.description, value.completed, id]
        );       

        res.json(updateTodo.rows[0]);
    } catch (err) {
        console.error(err.message);
    }
});

// delete a todo
router.delete("/:id", async (req, res) => {
    try {
        const { id } = req.params;
        const deleteTodo = await pool.query("DELETE FROM todo WHERE id = $1 RETURNING *", [id]);  
        res.json(deleteTodo.rows[0]);        
    } catch (err) {
        console.error(err.message);
    }
});

module.exports = router;