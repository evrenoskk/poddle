import { Router, type IRouter } from "express";
import healthRouter from "./health";
import poddleRouter from "./poddle";
import petsRouter from "./pets";

const router: IRouter = Router();

router.use(healthRouter);
router.use("/poddle", poddleRouter);
router.use("/pets", petsRouter);

export default router;
