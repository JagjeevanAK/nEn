import "dotenv/config";
import cookieParser from "cookie-parser";
import express, { urlencoded } from "express";
import cors from "cors";

const app = express();
const PORT = process.env.BACKEND_PORT

app.use(cookieParser());
app.use(urlencoded({ extended: true }));
app.use(express.json());
app.use(
  cors({
    origin: "http://localhost:5173",
    credentials: true,
  })
);

import v1 from "./routes"
import { errorHandler } from "./middlewares/error.middleware";

app.use("/api/v1", v1);

app.listen(PORT, () => {
  console.log("app is listening on port ", PORT);
});

app.use(errorHandler);
