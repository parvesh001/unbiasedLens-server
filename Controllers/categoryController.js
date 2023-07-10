const Category = require("../Models/categoryModel");
const catchAsync = require("../Utils/catchAsync");

exports.getAllCategories = catchAsync(async (req, res) => {
  const { page, limit } = req.query;
  const currentPage = page || 1;
  const imposedLimit = limit || undefined;
  const skip = (currentPage - 1) * imposedLimit;

  const categories = await Category.find()
    .skip(skip)
    .limit(imposedLimit)

  const totalDocs = await Category.countDocuments();
  res
    .status(200)
    .json({
      status: "success",
      results: categories.length,
      data: { categories, totalDocs },
    });
});

exports.addCategory = catchAsync(async (req, res) => {
  const category = await Category.create(req.body);
  res.status(201).json({ category });
});

exports.updateCategory = catchAsync(async (req, res) => {
  const category = await Category.findByIdAndUpdate(
    req.params.categoryId,
    req.body,
    { new: true, runValidators: true }
  );
  res.status(200).json({ status: "success", category });
});

exports.deleteCategory = catchAsync(async (req, res) => {
  await Category.findByIdAndDelete(req.params.categoryId);
  res.status(204).json({ message: "Category deleted successfully" });
});
