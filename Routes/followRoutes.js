const router = require('express').Router()
const { protect } = require('../Controllers/authcontroller')
const { follow } = require('../Controllers/followViewController')

router.use(protect)
router.post('/author/:authorId', follow)

module.exports = router