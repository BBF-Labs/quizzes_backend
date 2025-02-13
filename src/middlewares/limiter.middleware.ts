import rateLimit from "express-rate-limit";
const Limiter = rateLimit({
  windowMs: 5 * 60 * 1000,
  limit: 200,
  message: { error: "Too many requests, please try again later" },
  handler: (req, res) => {
    res
      .status(429)
      .send({ error: "Too many requests, please try again later" });
  },
  legacyHeaders: true,
  standardHeaders: "draft-8",
});

export { Limiter };
