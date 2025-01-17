import { ExpressValidator, validationResult } from "express-validator";
import { Request, Response, NextFunction } from "express";

function requestValidator(req: Request, res: Response, next: NextFunction) {
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  next();
}

//still thinking if I should use this or not
