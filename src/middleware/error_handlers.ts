import { Response, NextFunction } from "express";
import logger from "../utils/logger";
import { errorType } from "utils";

export const serverError = (error: Error, res: Response, next: NextFunction) => {
    logger.error(error);
    res.status(500).send({
        result: 'Common Error',
        error_code: error.stack,
        error_message: errorType[Number(error.stack)]
    })
}