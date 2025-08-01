import axios from "axios";
import fs from "fs";
import path from "path";

// Interface for server response
interface ServerResponse {
  message: string;
  filename?: string;
  error?: string;
}

// Function to convert cat.jpg to base64
function getMockImage(): string {
  try {
    const imagePath = path.join(__dirname, "cat.jpg");
    if (!fs.existsSync(imagePath)) {
      throw new Error(
        "cat.jpg not found. Place cat.jpg in the project directory."
      );
    }
    const imageBuffer = fs.readFileSync(imagePath);
    const base64Image = imageBuffer.toString("base64");
    return `data:image/jpeg;base64,${base64Image}`;
  } catch (error) {
    console.error(
      "Error reading cat.jpg:",
      error instanceof Error ? error.message : error
    );
    throw error;
  }
}

// Function to send image to the server
async function testUploadImage(
  url: string,
  useBinary: boolean = false
): Promise<void> {
  try {
    if (useBinary) {
      // Send as binary (image/jpeg)
      const imagePath = path.join(__dirname, "cat.jpg");
      const imageBuffer = fs.readFileSync(imagePath);

      const response = await axios.post<ServerResponse>(
        `${url}/upload`,
        imageBuffer,
        {
          headers: { "Content-Type": "image/jpeg" },
          responseType: "json",
        }
      );

      console.log("Server Response (Binary):", response.data);
    } else {
      // Send as base64 JSON
      const image = getMockImage();
      const response = await axios.post<ServerResponse>(
        `${url}/upload`,
        { screenshot: image }, // Keep 'screenshot' key to match server expectation
        {
          headers: { "Content-Type": "application/json" },
        }
      );

      console.log("Server Response (Base64):", response.data);
    }
  } catch (error) {
    console.error(
      "Error sending image:",
      (error as any).response?.data ||
        (error instanceof Error ? error.message : error)
    );
  }
}

// Run the test
const SERVER_URL = "http://localhost:3000";
async function main() {
  console.log("Testing image upload (Base64)...");
  await testUploadImage(SERVER_URL, false);

  console.log("\nTesting image upload (Binary)...");
  await testUploadImage(SERVER_URL, true);
}

main().catch((err) => console.error("Test failed:", err));
