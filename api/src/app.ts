import "dotenv/config";
import cookieParser from "cookie-parser";
import cors from "cors";

import express, {
  type Application,
  type Request,
  type Response,
} from "express";

import authRoutes from "./routes/auth.route.js";
import profileRoutes from "./routes/profile.route.js";
import headWorkerRoutes from "./routes/head-worker.route.js";
import { ErrorMiddleware } from "./middlewares/error.middleware.js";

class App {
  public app: Application;
  private readonly PORT: number;

  constructor(port: number) {
    this.app = express();
    this.PORT = port;

    this.initializeMiddlewares();
    this.initializeStatus();
    this.initializeRoutes();
    this.initializeErrorHandler();
  }

  private initializeMiddlewares(): void {
    const corsOptions = {
      origin: "http://localhost:3000",
      methods: "GET,HEAD,PUT,PATCH,POST,DELETE",
      credentials: true,
      optionsSuccessStatus: 204,
    };

    this.app.use(cors(corsOptions));
    this.app.use(express.json());
    this.app.use(cookieParser());
  }

  private initializeStatus(): void {
    this.app.get("/status", (req: Request, res: Response) => {
      res
        .status(200)
        .json({ message: "API Running", uptime: Math.round(process.uptime()) });
    });
  }

  private initializeRoutes(): void {
    this.app.use("/api/auth", authRoutes);
    this.app.use("/api", profileRoutes);
    this.app.use("/api/head-worker", headWorkerRoutes);
  }

  private initializeErrorHandler(): void {
    this.app.use(ErrorMiddleware.notFound);
    this.app.use(ErrorMiddleware.global);
  }

  public listen(): void {
    this.app.listen(this.PORT, () =>
      console.info(`Server is listening on port ${this.PORT}`),
    );
  }
}

export default App;
