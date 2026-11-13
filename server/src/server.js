require("dotenv").config();

const app = require("./app");
const port = Number(process.env.PORT) || 4000;

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL must be configured before starting the server.");
}
const jwtSecret = process.env.JWT_SECRET || process.env.JWT_ACCESS_SECRET;
if (!jwtSecret || Buffer.byteLength(jwtSecret) < 32) {
  throw new Error("JWT_SECRET must be configured and contain at least 32 bytes.");
}

app.listen(port, () => {
  console.log(`FairMatch API listening on http://localhost:${port}`);
});