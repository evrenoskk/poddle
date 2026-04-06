import { Router, type IRouter } from "express";
import healthRouter from "./health";
import poddleRouter from "./poddle";

const router: IRouter = Router();

router.use(healthRouter);
router.use("/poddle", poddleRouter);

export default router;
