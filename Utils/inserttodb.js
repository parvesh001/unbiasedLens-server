const mongoose = require('mongoose');
require("dotenv").config({ path: "../config.env" });
const Category = require('../Models/categoryModel');

const MONGO_DB = process.env.MONGO_DB.replace(
  "<password>",
  process.env.MONGO_DB_PASS
);

// Connect to MongoDB
mongoose.connect(MONGO_DB, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

// Array of category names
const categoryNames = [
  'Front-end Development',
  'Back-end Development',
  'Full Stack Development',
  'JavaScript',
  'HTML/CSS',
  'UI/UX Design',
  'Responsive Web Design',
  'API Development',
  'Security and Authentication',
  'SEO (Search Engine Optimization)',
];

// Function to insert categories into MongoDB
const insertCategories = async () => {
  try {
    // Insert each category into the database
    for (const categoryName of categoryNames) {
      const category = new Category({ name: categoryName });
      await category.save();
      console.log(`Category '${categoryName}' inserted successfully`);
    }

    // Disconnect from MongoDB after insertion
    mongoose.disconnect();
  } catch (error) {
    console.error('Error inserting categories:', error);
    mongoose.disconnect();
  }
};

// Call the function to insert categories
insertCategories();
