import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const dbPath = path.join(__dirname, "src", "db", "db.json");

const db = JSON.parse(fs.readFileSync(dbPath, "utf-8"));

const videoUrls = [
  "https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4",
  "https://www.w3schools.com/html/mov_bbb.mp4",
  "https://media.w3.org/2010/05/sintel/trailer.mp4",
  "https://media.w3.org/2010/05/bunny/trailer.mp4",
  "https://media.w3.org/2010/05/video/movie_300.mp4"
];

const tamilComedyCaptions = [
  "Amma: Saaptiya? Me: Diet la iruken. Also me: 3 dosa parcel 😂",
  "Friend: Serious ah iru da. Me: Seri. Brain: comedy start pannalama? 🤣",
  "Office meeting la mute potutu tea kudikura moment ☕😂",
  "Exam ku munnaadi confidence. Question paper vandha silence 😭",
  "Appa: Phone ah konjam vidu. Me: Last reel paathutu varen 😂",
  "Monday morning face is the real villain 😴",
  "Salary varumbodhu king. Month end la silent monk 🥲",
  "Gym join panna first day motivation. Second day body pain comedy 💪😂",
  "Tamil family function la introvert survival mode 😭",
  "Auto anna meter podunga nu sonna reaction 😂",
  "Friend treat kudukren nu sollitu disappear aagura moment 🤣",
  "Amma scolding background music is always high volume 🔊😂",
  "Crush story view pannanga. Life goal achieved nu feel 😂",
  "Tea kadai politics is better than news debate ☕",
  "Relatives: Job epdi poitu iruku? Me: Smile.exe stopped working 😭",
  "Oru small doubt kekren nu start pannitu full lecture kudukura friend 😂",
  "Cinema interval la popcorn rate paatha shock 😭",
  "Bus la window seat kidaicha king feeling 😎",
  "Rain varumbodhu bajji plan automatic ah start aagum 🌧️😂",
  "Friend oda bike petrol empty aana friendship test starts 😂",
  "Online class la camera off life was peaceful 😴",
  "Manager: quick call. Employee: fear unlocked 😭",
  "Tamil wedding sambar rice supremacy 😂",
  "Amma: Room clean pannu. Me: Tomorrow definitely. Tomorrow never comes 🤣",
  "Chennai traffic la patience test daily 😂",
  "One plate biryani shared by four friends. True friendship 😂",
  "Tea master knows more secrets than Google ☕😂",
  "Exam answer theriyala na handwriting dhaan hope 😭",
  "Cricket street rules: first batting owner of bat 😂",
  "Recharge expired aana dhaan life reality theriyum 📱😭",
  "Friend: 5 mins la varen. Actual arrival: next generation 😂",
  "Tamil serial bgm in real life arguments 😂",
  "Kovil prasadam queue la discipline max 😇",
  "Appa remote control power is permanent 📺😂",
  "Amma cooking smell > restaurant menu 😋",
  "Sunday evening sadness hits different 😭",
  "Office lunch box opening ceremony 😂",
  "When WiFi slow: whole family investigation starts 📶",
  "New shirt potta immediate sambar danger 😂",
  "Crush online but not replying. Detective mode activated 🕵️😂",
  "Village festival memories hit different 🎉",
  "Bike ride with friends is unpaid therapy 🏍️",
  "When relatives compare marks, soul leaves body 😭",
  "Tamil meme page admin deserves award 😂",
  "Tea, rain, and old songs. Perfect combo ☕🌧️",
  "Friend group la one unpaid photographer irupan 📸😂",
  "Mom calling full name means danger level high 😭",
  "Cinema first day first show energy 🔥",
  "Night coding and morning debugging pain 😂",
  "Life problem irundhaalum comedy dhaan solution 🤣"
];

const hashtags = [
  "#tamilcomedy",
  "#reels",
  "#funny",
  "#tamilmemes",
  "#chennaicomedy",
  "#officecomedy",
  "#friendship",
  "#familycomedy"
];

const users = db.users || [];

if (users.length === 0) {
  console.log("No users found in db.json");
  process.exit(1);
}

const reels = Array.from({ length: 50 }, (_, index) => {
  const user = users[index % users.length];

  return {
    id: index + 1,
    userId: user.id,
    username: user.username,
    profilePic: user.profilePic,
    videoUrl: videoUrls[index % videoUrls.length],
    caption: tamilComedyCaptions[index],
    hashtags: [
      hashtags[index % hashtags.length],
      hashtags[(index + 2) % hashtags.length]
    ],
    likes: Math.floor(Math.random() * 5000) + 100,
    liked: false,
    comments: [],
    shares: 0,
    createdAt: new Date().toISOString()
  };
});

db.reels = reels;

fs.writeFileSync(dbPath, JSON.stringify(db, null, 2));

console.log("50 Tamil comedy reels added successfully");