const express=require('express');
const {getUser, registerUser, loginUser, createFolder, getFolders} = require("./utils");
const router=express.Router();

// User Routes
router.get("/getUser", getUser);
router.post("/register", registerUser);
router.post("/login",loginUser);

// Folder Routes
router.post("/createFolder", createFolder);
router.get("/:username/folders", getFolders);

router.get("/", (req, res) => {
    res.send("VarMan Notes");
});

module.exports= router;