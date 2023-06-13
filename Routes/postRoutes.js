const { protect } = require('../Controllers/authcontroller');
const { uploadFile, createPost, processFile } = require('../Controllers/postController');

const router = require('express').Router()

router.get('/')
router.get('/post/:postId')

router.use(protect)

router.post('/', uploadFile, processFile, createPost)
router.route('/post/:postId').patch().delete()

router.put('/post/:postId/like')
router.put('/post/:postId/dislike')
router.put('/post/:postId/view')
module.exports = router;