const { restrict, protect } = require("../Controllers/authcontroller");
const {
  getAllCategories,
  addCategory,
  updateCategory,
  deleteCategory,
} = require("../Controllers/categoryController");

const router = require("express").Router();

router.get("/", getAllCategories)
router.use(protect)
router.use(restrict)
router.post('/', addCategory);
router
  .route("/:categoryId")
  .patch(restrict, updateCategory)
  .delete(restrict, deleteCategory);

module.exports = router;
