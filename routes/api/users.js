const express = require("express");
const router = express.Router();
const pool = require("../../db");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");
const { validateSignup, validateLogin } = require("../../validator");

router.post("/", async (req, res) => {
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

router.post("/login", async (req, res) => {
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

router.get("/logout", async (req, res) => {
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


router.get("/refreshaccesstoken", async (req, res) => {
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

module.exports = router;