const router = require('express').Router()
const { protect } = require('../Controllers/authcontroller')
const { unfollow } = require('../Controllers/followViewController')

router.use(protect)

router.delete('/author/:authorId', unfollow)

module.exports = router