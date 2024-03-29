//third party packages
require("dotenv").config({ path: "./config.env" });
const mongoose = require("mongoose");

//Setting an event listener for uncaught exception event. Defined before App file so that it catches all the uncaught error.
process.on("uncaughtException", (err) => {
  console.log(err.name + ":" + err.message);
  console.log("UNCAUGHT EXCEPTION! Shutting down the server...");
  //forcefully terminate the server with exist code 1 to indicate abnormal termination
  process.exit(1);
});

//local files
const app = require("./app");

let server;

//Initializing Database
const MONGO_DB = process.env.MONGO_DB.replace(
  "<password>",
  process.env.MONGO_DB_PASS
);
mongoose.set("strictQuery", true); //will throw error if querying on undefined field
(async function () {
  try {
    await mongoose.connect(MONGO_DB);
    console.log("Connected with databse successfully!");

    //Start Server
    const PORT = process.env.PORT;
    server = app.listen(PORT || 8080, () =>
      console.log(`listening on ${PORT}`)
    );
  } catch (err) {
    console.log(err.name + ": " + err.message);
  }
})();

//Setting an event listener for unhandled rejection event.
process.on("unhandledRejection", (err) => {
  console.log(err.name + ":" + err.message);
  console.log("UNHANDLED REJECTION! Shutting down the server...");
  //Gracefully terminate the server. First stop making connections, then once all connections are closed terminate the server with code 1 to indicate abnormal termination
  server.close(() => {
    process.exit(1);
  });
});
