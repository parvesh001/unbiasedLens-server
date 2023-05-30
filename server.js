require("dotenv").config({ path: "./config.env" });
const mongoose = require("mongoose");

const app = require("./app");

let server;
//Initializing Database
const MONGO_DB = process.env.MONGO_DB.replace(
  "<password>",
  process.env.MONGO_DB_PASS
);
mongoose.set("strictQuery", true);
(async function () {
  try {
    await mongoose.connect(MONGO_DB);
    console.log("Connected with databse successfully!");

    //Start Server
    const PORT = process.env.PORT;
    server = app.listen(PORT || 8080, () => console.log(`listening on ${PORT}`));
  } catch (err) {
    console.log(err.name + ': ' + err.message);
  }
})();
