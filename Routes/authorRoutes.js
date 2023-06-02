const router = require("express").Router();

const { register, login } = require("../Controllers/authcontroller");
const {getAuthor} = require('../Controllers/authorController')

router.post("/register", register);
router.post("/login", login)

router.get('/:authorId', getAuthor)

module.exports = router;
