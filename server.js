import express from "express";
import fs from "fs";
import path from "path";
import cors from "cors";
import { fileURLToPath } from "url";

const app = express();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = process.env.PORT || 3000;
const dbPath = path.join(__dirname, "src", "db", "db.json");

app.use(cors());
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ extended: true, limit: "50mb" }));

const readDB = () => {
  const data = fs.readFileSync(dbPath, "utf-8");
  return JSON.parse(data);
};

const writeDB = (data) => {
  fs.writeFileSync(dbPath, JSON.stringify(data, null, 2));
};

const convertQueryValue = (value) => {
  if (value === "true") return true;
  if (value === "false") return false;

  const numberValue = Number(value);
  if (!Number.isNaN(numberValue) && value !== "") {
    return numberValue;
  }

  return value;
};

const matchesQuery = (item, query) => {
  return Object.keys(query).every((key) => {
    const queryValue = convertQueryValue(query[key]);
    return item[key] === queryValue;
  });
};

app.get("/", (req, res) => {
  res.json({
    message: "Custom JSON Server running",
  });
});

app.get("/:resource", (req, res) => {
  try {
    const db = readDB();
    const { resource } = req.params;

    if (!db[resource]) {
      return res.status(404).json({ error: `${resource} not found` });
    }

    let data = db[resource];

    if (Object.keys(req.query).length > 0) {
      data = data.filter((item) => matchesQuery(item, req.query));
    }

    res.json(data);
  } catch (error) {
    console.log("GET resource error:", error);
    res.status(500).json({ error: "Unable to fetch data" });
  }
});

app.get("/:resource/:id", (req, res) => {
  try {
    const db = readDB();
    const { resource, id } = req.params;

    if (!db[resource]) {
      return res.status(404).json({ error: `${resource} not found` });
    }

    const item = db[resource].find((data) => Number(data.id) === Number(id));

    if (!item) {
      return res.status(404).json({ error: `${resource} item not found` });
    }

    res.json(item);
  } catch (error) {
    console.log("GET item error:", error);
    res.status(500).json({ error: "Unable to fetch item" });
  }
});

app.post("/:resource", (req, res) => {
  try {
    const db = readDB();
    const { resource } = req.params;

    if (!db[resource]) {
      db[resource] = [];
    }

    const existingItems = db[resource];
    const lastId =
      existingItems.length > 0
        ? Math.max(...existingItems.map((item) => Number(item.id) || 0))
        : 0;

    const newItem = {
      id: lastId + 1,
      ...req.body,
    };

    db[resource].push(newItem);
    writeDB(db);

    res.status(201).json(newItem);
  } catch (error) {
    console.log("POST error:", error);
    res.status(500).send("Payload too large or unable to save data");
  }
});

app.patch("/:resource/:id", (req, res) => {
  try {
    const db = readDB();
    const { resource, id } = req.params;

    if (!db[resource]) {
      return res.status(404).json({ error: `${resource} not found` });
    }

    const itemIndex = db[resource].findIndex(
      (item) => Number(item.id) === Number(id)
    );

    if (itemIndex === -1) {
      return res.status(404).json({ error: `${resource} item not found` });
    }

    db[resource][itemIndex] = {
      ...db[resource][itemIndex],
      ...req.body,
    };

    writeDB(db);

    res.json(db[resource][itemIndex]);
  } catch (error) {
    console.log("PATCH error:", error);
    res.status(500).json({ error: "Unable to update data" });
  }
});

app.delete("/:resource/:id", (req, res) => {
  try {
    const db = readDB();
    const { resource, id } = req.params;

    if (!db[resource]) {
      return res.status(404).json({ error: `${resource} not found` });
    }

    const originalLength = db[resource].length;

    db[resource] = db[resource].filter(
      (item) => Number(item.id) !== Number(id)
    );

    if (db[resource].length === originalLength) {
      return res.status(404).json({ error: `${resource} item not found` });
    }

    writeDB(db);

    res.json({ success: true });
  } catch (error) {
    console.log("DELETE error:", error);
    res.status(500).json({ error: "Unable to delete data" });
  }
});

const distPath = path.join(__dirname, "dist");

if (fs.existsSync(distPath)) {
  app.use(express.static(distPath));

  app.get("*", (req, res) => {
    res.sendFile(path.join(distPath, "index.html"));
  });
}

app.listen(PORT, () => {
  console.log(`Custom JSON Server running on http://localhost:${PORT}`);
});