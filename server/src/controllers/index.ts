import type { Request, Response } from "express";
import logger from "../utils/logger";

const homeController = async (req: Request, res: Response) => {
  try {
    logger.info("home page");
    res.send("welcome my home");
  } catch (error) {
    res.status(500).json({ message: `homeController went wrong`, error });
  }
};

const postController = async (req: Request, res: Response) => {
  try {
    logger.info("post page");
    res.send("this is a post page");
  } catch (error) {
    res.status(500).json({ message: `postController went wrong`, error });
  }
};

export default { homeController, postController };
