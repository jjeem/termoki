import type { Shell } from "src/ui";
import { registerAPI } from "./index";

declare global {
  interface Window {
    id: number;
    api: ReturnType<typeof registerAPI>;
  }
}
