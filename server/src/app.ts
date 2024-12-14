import express from "express";
import controllers from "./controllers";
import logger from "./utils/logger";

const app = express();

app.get("/", controllers.homeController);
app.get("/post", controllers.postController);

app.listen("8081", () => {
  logger.info("server is running on port 8081");
});
