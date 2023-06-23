const mongoose = require("mongoose");
require("dotenv").config({ path: "./config.env" });
const Category = require("../Models/categoryModel");

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
const blogCategories = [
  {
    name: "Technology",
    description:
      "Stay updated with the latest trends and innovations in the tech industry.",
  },
  {
    name: "Travel",
    description:
      "Discover exciting destinations, travel tips, and stories from around the world.",
  },
  {
    name: "Health and Fitness",
    description:
      "Learn about maintaining a healthy lifestyle, fitness routines, and wellness advice.",
  },
  {
    name: "Food and Cooking",
    description:
      "Explore delicious recipes, cooking techniques, and culinary inspiration.",
  },
  {
    name: "Personal Development",
    description:
      "Enhance your personal growth, productivity, and self-improvement strategies.",
  },
  {
    name: "Fashion and Style",
    description:
      "Get insights into fashion trends, styling tips, and the world of fashion.",
  },
  {
    name: "Finance",
    description:
      "Discover financial planning, money-saving tips, and investment advice.",
  },
  {
    name: "Art and Culture",
    description:
      "Immerse yourself in the world of art, culture, and creative expression.",
  },
];



// Function to insert categories into MongoDB
const insertCategories = async () => {
  try {
    // Insert each category into the database
    for (const category of blogCategories) {
      const newCategory = new Category({ name: category.name, description:category.description });
      await newCategory.save();
      console.log(`Category '${category.name}' inserted successfully`);
    }

    // Disconnect from MongoDB after insertion
    mongoose.disconnect();
  } catch (error) {
    console.error("Error inserting categories:", error);
    mongoose.disconnect();
  }
};

// Call the function to insert categories
insertCategories();
