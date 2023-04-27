const express = require("express");
const app = express();
const cors = require("cors");
const pool = require("./db");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const cookieParser = require("cookie-parser");
const verifyJWT = require("./middleware/verifyJWT");
const { validateSignup, validateLogin, validateTodo } = require("./validator");

// middleware
app.use(express.json());
app.use(cookieParser());
app.use(cors({
    origin: 'http://localhost:5173',
    credentials: true
}));

// ROUTES

// get all todos
app.get("/api/todos", verifyJWT, async (req, res) => {
    console.log(req.user);
  
    try {
        const allTodos = await pool.query("SELECT * FROM todo WHERE user_id = $1", [req.user.userId]);
        res.json(allTodos.rows);
    } catch (err) {
        console.error(err.message);
    }
});

// create a todo
app.post("/api/todos", verifyJWT, async (req, res) => {
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
app.get("/api/todos/:id", verifyJWT, async (req, res) => {
    try {
        const { id } = req.params;
        const todo = await pool.query("SELECT * FROM todo WHERE id = $1", [id]);
        res.json(todo.rows[0]);
    } catch (err) {
        console.error(err.message);
    }
});

// update a todo
app.put("/api/todos/:id", verifyJWT, async (req, res) => {
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
app.delete("/api/todos/:id", verifyJWT, async (req, res) => {
    try {
        const { id } = req.params;
        const deleteTodo = await pool.query("DELETE FROM todo WHERE id = $1 RETURNING *", [id]);  
        res.json(deleteTodo.rows[0]);        
    } catch (err) {
        console.error(err.message);
    }
});


app.post("/api/users", async (req, res) => {
    const { error, value } = validateSignup(req.body);   
    if (error) {
        return res.status(400).send(error.details[0].message);
    }    
    
    try {
        const salt = await bcrypt.genSalt();
        const hashedPassword = await bcrypt.hash(value.password, salt);
        const newUser = await pool.query(
			"INSERT INTO \"user\" (email, password) VALUES($1, $2)",
			[value.email, hashedPassword]
		);
        res.status(201).send("ok");
    } catch (err) {
       console.error(err.message);
       res.status(500).send(err.message);
    }

});

app.post("/api/users/login", async (req, res) => {
    const { error, value } = validateLogin(req.body);   
    if (error) {
        console.log(error.details);
        return res.status(400).send(error.details[0].message);
    } 

    try {
        const user = await pool.query("SELECT * FROM \"user\" WHERE email = $1", [value.email]);
        if (user.rows.length === 0) {
            return res.status(400).send("User not found");
        }
        const validPassword = await bcrypt.compare(value.password, user.rows[0].password);
        if (!validPassword) {
            return res.status(400).send("Invalid password");
        }
        
        const userId = user.rows[0].id;

        const userInfo = { userId };
        const accessToken = jwt.sign(userInfo, process.env.ACCESS_TOKEN_SECRET, { expiresIn: "30s" });
        const refreshToken = jwt.sign(userInfo, process.env.REFRESH_TOKEN_SECRET, { expiresIn: "3d" });

        const updateRefreshToken = await pool.query(
            "UPDATE \"user\" SET refreshtoken = $1 WHERE id = $2",
            [refreshToken, userId]
        ); 
        
        res.cookie("refreshToken", refreshToken, { httpOnly: true, sameSite: "none", secure: true, maxAge: 3 * 24 * 60 * 60 * 1000 });
        res.json({ accessToken });
    } catch (err) {
        console.error(err.message);
        res.status(500).send(err.message);
    }

});

app.get("/api/users/logout", async (req, res) => {
    const cookies = req.cookies;
    if (!cookies?.refreshToken) return res.status(204).send("No refresh token"); 
    const refreshToken = cookies.refreshToken;

    try {
        const user = await pool.query("SELECT * FROM \"user\" WHERE refreshtoken = $1", [refreshToken]);
        if (user.rows.length === 0) {
            res.clearCookie("refreshToken", { httpOnly: true, maxAge: 3 * 24 * 60 * 60 * 1000 });
            return res.status(204).send("User not found");
        }
        const userId = user.rows[0].id;

        const deleteRefreshToken = await pool.query("UPDATE \"user\" SET refreshtoken = NULL WHERE id = $1", [userId]);
        res.clearCookie("refreshToken", { httpOnly: true, sameSite: "none", secure: true });
        res.status(204).send("ok");
    } catch (err) {
        console.error(err.message);
        res.status(500).send(err.message);
    }
});


app.get("/api/users/refreshaccesstoken", async (req, res) => {
    const cookies = req.cookies;
    if (!cookies?.refreshToken) return res.status(401).send("No refresh token");    
    const refreshToken = cookies.refreshToken;

    try {
        const user = await pool.query("SELECT * FROM \"user\" WHERE refreshtoken = $1", [refreshToken]);
        if (user.rows.length === 0) {
            return res.status(400).send("User not found");
        }
        const userId = user.rows[0].id;

        jwt.verify(refreshToken, process.env.REFRESH_TOKEN_SECRET, async (err, payload) => {
            if (err || userId !== payload.userId) return res.status(403).send("Invalid refresh token");
        
            const userInfo = { userId };
            const accessToken = jwt.sign(userInfo, process.env.ACCESS_TOKEN_SECRET, { expiresIn: "30s" });
            res.json({ accessToken });        
        
        });
    } catch (err) {
        console.error(err.message);
        res.status(500).send(err.message);
    }
});
    
app.listen(5000, () => {
	console.log("server is listening on port 5000");
});
