import "dotenv/config";

import App from "./app.js";

const PORT: number = Number(process.env.PORT) || 8000;

const server = new App(PORT);
server.listen();
