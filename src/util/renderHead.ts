import { spinnerAnimation, errorSprite, textureSprite, notFoundSprite, uuidRegex, playerNameRegex } from "../data/head";

interface HeadCacheEntry {
  state: "loading" | "cached" | "error";
  file: string;
  timestamp: number;
  element?: HTMLImageElement;
}

const uuidCache = new Map<string, HeadCacheEntry>();
const usernameCache = new Map<string, string>(); // username: uuid
const fetchTimers = new Map<string, number>();

const ASHCON_API = "https://api.ashcon.app/mojang/v2/user/";
const CACHE_EXPIRY_MS = 20 * 60 * 1000; // 20 minutes

// Request queue for rate limiting
const REQUEST_QUEUE: (() => Promise<void>)[] = [];
let isProcessingQueue = false;

async function processQueue() {
  if (isProcessingQueue || REQUEST_QUEUE.length === 0) return;
  isProcessingQueue = true;

  while (REQUEST_QUEUE.length > 0) {
    const task = REQUEST_QUEUE.shift()!;
    await task();
    await new Promise(resolve => setTimeout(resolve, 200)); // ~5 req/sec
  }

  isProcessingQueue = false;
}

function queueRequest(task: () => Promise<void>) {
  REQUEST_QUEUE.push(task);
  processQueue();
}

export function getHeadElement(identifier: string, showHat = true): HTMLImageElement {
  const img = document.createElement("img");

  img.style.width = "1em";
  img.style.height = "1em";
  img.style.imageRendering = "pixelated";
  img.style.verticalAlign = "middle";

  if (uuidRegex.test(identifier)) {
    renderUUIDHead(identifier, img, showHat);
  } else if (playerNameRegex.test(identifier)) {
    renderUsernameHead(identifier, img, showHat);
  } else if (identifier.includes("/") || identifier.startsWith("minecraft:")) {
    img.src = textureSprite;
  } else {
    img.src = errorSprite;
  }

  return img;
}

function renderUUIDHead(uuid: string, img: HTMLImageElement, showHat: boolean) {
  const existing = uuidCache.get(uuid);

  if (existing && Date.now() - existing.timestamp < CACHE_EXPIRY_MS) {
    if (existing.state === "cached") img.src = existing.file;
    else if (existing.state === "error") img.src = errorSprite;
    else img.src = spinnerAnimation;
    return;
  }

  uuidCache.set(uuid, { state: "loading", file: spinnerAnimation, timestamp: Date.now(), element: img });
  img.src = spinnerAnimation;

  const url = `https://crafatar.com/avatars/${uuid}?size=16${showHat ? "&overlay=true" : ""}`;

  if (fetchTimers.has(uuid)) clearTimeout(fetchTimers.get(uuid));
  const timer = window.setTimeout(() => {
    queueRequest(async () => {
      try {
        const res = await fetchWithRetry(url);
        const blob = await res.blob();
        const localUrl = URL.createObjectURL(blob);
        uuidCache.set(uuid, { state: "cached", file: localUrl, timestamp: Date.now() });
        img.src = localUrl;
        console.info(`[MiniMessage Renderer] Cached skin for ${uuid} (thanks Crafatar.com!)`);
      } catch (e) {
        console.warn(`[MiniMessage Renderer] Failed to load skin for ${uuid}`, e);
        uuidCache.set(uuid, { state: "error", file: errorSprite, timestamp: Date.now() });
        img.src = errorSprite;
      }
    });
  }, 300);
  fetchTimers.set(uuid, timer);
}

function renderUsernameHead(username: string, img: HTMLImageElement, showHat: boolean) {
  const existingUuid = usernameCache.get(username);
  if (existingUuid) {
    renderUUIDHead(existingUuid, img, showHat);
    return;
  }

  img.src = spinnerAnimation;

  if (fetchTimers.has(username)) clearTimeout(fetchTimers.get(username));
  const timer = window.setTimeout(() => {
    queueRequest(async () => {
      try {
        const res = await fetchWithRetry(`${ASHCON_API}${username}`);
        if (res.status === 404) {
          img.src = notFoundSprite;
          usernameCache.set(username, ""); // mark as “not found”
          return;
        }

        const data = await res.json();
        const uuid = data.uuid;
        usernameCache.set(username, uuid);
        renderUUIDHead(uuid, img, showHat);
      } catch (e) {
        console.warn(`[MiniMessage Renderer] Failed to resolve username ${username}`, e);
        img.src = errorSprite;
      }
    });
  }, 300);
  fetchTimers.set(username, timer);
}

async function fetchWithRetry(url: string, retries = 2, delay = 300): Promise<Response> {
  for (let i = 0; i <= retries; i++) {
    try {
      const res = await fetch(url, { cache: "force-cache" });
      return res;
    } catch (e) {
      if (i === retries) throw e;
      await new Promise(r => setTimeout(r, delay * Math.pow(2, i)));
    }
  }
  throw new Error("Failed after retries");
}

export function intArrayToUUID(ints: number[]): string {
  if (ints.length !== 4) return "";
  const bytes = new Uint8Array(16);
  const dataView = new DataView(bytes.buffer);
  ints.forEach((value, i) => dataView.setInt32(i * 4, value));

  const hex = Array.from(bytes, b => b.toString(16).padStart(2, "0")).join("");
  return (
    hex.slice(0, 8) + "-" +
    hex.slice(8, 12) + "-" +
    hex.slice(12, 16) + "-" +
    hex.slice(16, 20) + "-" +
    hex.slice(20)
  );
}
