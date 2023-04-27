const express = require("express");
const app = express();
const cors = require("cors");
const cookieParser = require("cookie-parser");
const verifyJWT = require("./middleware/verifyJWT");

// middleware
app.use(express.json());
app.use(cookieParser());
app.use(cors({
    origin: 'http://localhost:5173',
    credentials: true
}));

// Members API route
app.use('/api/todos', verifyJWT, require('./routes/api/todos'));
app.use('/api/users', require('./routes/api/users'));

app.listen(5000, () => {
	console.log("server is listening on port 5000");
});
