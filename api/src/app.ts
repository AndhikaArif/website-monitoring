import "dotenv/config";
import cookieParser from "cookie-parser";
import cors from "cors";

import express, {
  type Application,
  type Request,
  type Response,
} from "express";

import authRoutes from "./routes/auth.route.js";

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
      // Replace 3000 with your actual frontend port if it's different
      origin: "http://localhost:3000",
      methods: "GET,HEAD,PUT,PATCH,POST,DELETE",
      credentials: true, // Important if you use cookies/sessions
      optionsSuccessStatus: 204, // Handle preflight (OPTIONS) requests gracefully
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
  }

  private initializeErrorHandler(): void {}

  public listen(): void {
    this.app.listen(this.PORT, () =>
      console.info(`Server is listening on port ${this.PORT}`),
    );
  }
}

export default App;
