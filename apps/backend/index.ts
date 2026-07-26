import express from "express";
import { appRouter } from "./src/routes/index";
import cors from "cors";

const app = express();
app.use(cors());
app.use(express.json());
app.use(appRouter);

const PORT = process.env.PORT || 3001;

app.listen(PORT, () => {
  console.log(`Server Listening at http://localhost:${PORT}`);
});
