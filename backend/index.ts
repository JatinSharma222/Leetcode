import express from "express";
import { appRouter } from "./src/routes/index";
import cors from "cors";

const app = express();
app.use(cors());
app.use(express.json());
app.use(appRouter);



app.listen(3000, () => {{
    console.log("Server Listening at 3000");
}});