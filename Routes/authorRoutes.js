const router = require("express").Router();

const { register } = require("../Controllers/authcontroller");

router.post("/register", register);

module.exports = router;
