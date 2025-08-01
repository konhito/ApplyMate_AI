import express from "express";
import type { Request, Response } from "express";
import fs from "fs";
import path from "path";
import cors from "cors";

const app = express();
const port = 3000;

app.use(cors());
app.use(express.json({ limit: "10mb" }));
app.use(
  express.raw({
    type: ["image/jpeg", "image/png", "application/octet-stream"],
    limit: "10mb",
  })
);

let shouldCapture = true;

app.get("/", (req: Request, res: Response) => {
  res.send("Hello World!");
});

app.post("/upload", (req: Request, res: Response) => {
  try {
    if (
      !req.is("application/json") &&
      !req.is("image/jpeg") &&
      !req.is("image/png") &&
      !req.is("application/octet-stream")
    ) {
      return res.status(400).json({ error: "Unsupported Content-Type" });
    }

    let imageData: string | Buffer;
    const timestamp = Date.now();
    let filename: string;
    let filePath: string;

    if (req.is("application/json")) {
      if (!req.body || !req.body.screenshot) {
        return res
          .status(400)
          .json({ error: "Missing screenshot in JSON payload" });
      }
      imageData = req.body.screenshot;
      if (
        typeof imageData === "string" &&
        imageData.startsWith("data:image/jpeg;base64,")
      ) {
        filename = `image-${timestamp}.jpg`;
        imageData = imageData.replace(/^data:image\/jpeg;base64,/, "");
      } else if (
        typeof imageData === "string" &&
        imageData.startsWith("data:image/png;base64,")
      ) {
        filename = `image-${timestamp}.png`;
        imageData = imageData.replace(/^data:image\/png;base64,/, "");
      } else {
        return res.status(400).json({ error: "Invalid base64 image format" });
      }
    } else if (req.is("image/jpeg") || req.is("application/octet-stream")) {
      filename = `image-${timestamp}.jpg`;
      imageData = req.body;
    } else if (req.is("image/png")) {
      filename = `image-${timestamp}.png`;
      imageData = req.body;
    } else {
      return res.status(400).json({ error: "Invalid image format" });
    }

    const uploadDir = path.join(__dirname, "uploads");
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir);
    }
    filePath = path.join(uploadDir, filename);

    if (typeof imageData === "string") {
      if (!imageData.match(/^[A-Za-z0-9+/=]+$/)) {
        return res.status(400).json({ error: "Invalid base64 string" });
      }
      fs.writeFileSync(filePath, Buffer.from(imageData, "base64"));
    } else if (Buffer.isBuffer(imageData)) {
      fs.writeFileSync(filePath, imageData);
    } else {
      return res.status(400).json({ error: "Invalid image data type" });
    }

    res.json({ message: "Image saved successfully", filename });
  } catch (error) {
    console.error(
      "Error saving image:",
      error instanceof Error ? error.message : error
    );
    res.status(500).json({ error: "Failed to save image" });
  }
});

app.post("/shouldtakess", (req, res) => {
  shouldCapture = true;
  res.json({ message: "Screenshot trigger set", shouldCapture });
});

app.get("/shouldtakess", (req, res) => {
  res.json({ shouldCapture });
});

app.post("/screenshotTaken", (req, res) => {
  console.log("Screenshot taken, capture flag set to false");
  res.json({ message: "Capture flag reset" });
});

app.listen(port, () => {
  console.log(`Server is running at http://localhost:${port}`);
});
