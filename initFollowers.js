import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const dbPath = path.join(__dirname, "src", "db", "db.json");

const db = JSON.parse(fs.readFileSync(dbPath, "utf-8"));

db.users = db.users.map((user) => {
  const allOtherUserIds = db.users
    .filter((otherUser) => Number(otherUser.id) !== Number(user.id))
    .map((otherUser) => otherUser.id);

  return {
    ...user,
    followersIds: allOtherUserIds,
    followingIds: allOtherUserIds,
    followers: allOtherUserIds.length,
    following: allOtherUserIds.length,
  };
});

fs.writeFileSync(dbPath, JSON.stringify(db, null, 2));

console.log("Followers and following initialized successfully");