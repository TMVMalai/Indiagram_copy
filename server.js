import express from "express";
import cors from "cors";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const app = express();
const PORT = 3000;

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const dbPath = path.join(__dirname, "src", "db", "db.json");

app.use(cors());

// Important: allows bigger Base64 image/video upload
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ limit: "50mb", extended: true }));

const readDB = () => {
  const data = fs.readFileSync(dbPath, "utf-8");
  return JSON.parse(data);
};

const writeDB = (data) => {
  fs.writeFileSync(dbPath, JSON.stringify(data, null, 2));
};

const filterByQuery = (items, query) => {
  return items.filter((item) => {
    return Object.keys(query).every((key) => {
      return String(item[key]) === String(query[key]);
    });
  });
};

app.get("/", (req, res) => {
  res.json({
    message: "Custom JSON Server running",
    endpoints: [
      "/users",
      "/posts",
      "/stories",
      "/conversations",
      "/reposts",
      "/suggestions"
    ]
  });
});

app.get("/:resource", (req, res) => {
  const db = readDB();
  const { resource } = req.params;

  if (!db[resource]) {
    return res.status(404).json({ error: "Resource not found" });
  }

  const result =
    Object.keys(req.query).length > 0
      ? filterByQuery(db[resource], req.query)
      : db[resource];

  res.json(result);
});

app.get("/:resource/:id", (req, res) => {
  const db = readDB();
  const { resource, id } = req.params;

  if (!db[resource]) {
    return res.status(404).json({ error: "Resource not found" });
  }

  const item = db[resource].find((item) => String(item.id) === String(id));

  if (!item) {
    return res.status(404).json({ error: "Item not found" });
  }

  res.json(item);
});

app.post("/:resource", (req, res) => {
  const db = readDB();
  const { resource } = req.params;

  if (!db[resource]) {
    return res.status(404).json({ error: "Resource not found" });
  }

  const items = db[resource];

  const maxId =
    items.length > 0 ? Math.max(...items.map((item) => Number(item.id))) : 0;

  const newItem = {
    id: maxId + 1,
    ...req.body
  };

  db[resource].push(newItem);
  writeDB(db);

  res.status(201).json(newItem);
});

app.patch("/:resource/:id", (req, res) => {
  const db = readDB();
  const { resource, id } = req.params;

  if (!db[resource]) {
    return res.status(404).json({ error: "Resource not found" });
  }

  const itemIndex = db[resource].findIndex(
    (item) => String(item.id) === String(id)
  );

  if (itemIndex === -1) {
    return res.status(404).json({ error: "Item not found" });
  }

  db[resource][itemIndex] = {
    ...db[resource][itemIndex],
    ...req.body
  };

  writeDB(db);

  res.json(db[resource][itemIndex]);
});

app.delete("/:resource/:id", (req, res) => {
  const db = readDB();
  const { resource, id } = req.params;

  if (!db[resource]) {
    return res.status(404).json({ error: "Resource not found" });
  }

  db[resource] = db[resource].filter(
    (item) => String(item.id) !== String(id)
  );

  writeDB(db);

  res.json({ message: "Deleted successfully" });
});

app.listen(PORT, () => {
  console.log(`Custom JSON Server running on http://localhost:${PORT}`);
});