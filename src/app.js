import express from "express";
import cors from "cors";

const app = express();

app.use(cors());
app.use(express.json());

app.get("/", (req, res) => {
  res.send("API CM Stock funcionando");
});

app.listen(3000, () => {
  console.log("Servidor corriendo en puerto 3000");
});