require("dotenv").config({ path: "./config.env" });
const mongoose = require('mongoose');
const Author = require('../Models/authorModel'); // Assuming you have your user model defined

const MONGO_DB = process.env.MONGO_DB.replace(
  "<password>",
  process.env.MONGO_DB_PASS
);

mongoose.connect(MONGO_DB, { useNewUrlParser: true, useUnifiedTopology: true });

mongoose.connection.once('open', async () => {
  try {
    // Use ensureIndex to update all existing documents and add the "verify" field with a default value of false
    await Author.updateMany({}, { $set: { verified: false } });
    console.log('Successfully updated existing documents with the "verify" field.');
  } catch (error) {
    console.error('Error updating existing documents:', error);
  } finally {
    mongoose.disconnect();
  }
});
