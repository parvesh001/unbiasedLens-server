const router = require('express').Router()
const { protect } = require('../Controllers/authcontroller')
const { view } = require('../Controllers/followViewController')

router.use(protect)


router.post('/author/:authorId', view)
module.exports = router