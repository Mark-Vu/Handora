"use client";

import { useCallback, useEffect, useRef, useState } from "react";

// ✅ Nordic UART Service (NUS)
const NUS_SERVICE = "6e400001-b5a3-f393-e0a9-e50e24dcca9e";
const NUS_TX_CHAR = "6e400003-b5a3-f393-e0a9-e50e24dcca9e"; // Notify (device -> browser)

export type Angles2D = [number[], number[], number[], number[], number[]];
type Status =
  | "idle" | "requesting" | "connecting" | "subscribing"
  | "connected" | "receiving" | "no-data" | "error";

// --- helper: nice hex dump for raw bytes -----------------------------------
function hexDump(u8: Uint8Array, max = 64) {
  const view = u8.length > max ? u8.slice(0, max) : u8;
  return Array.from(view).map(b => b.toString(16).padStart(2, "0")).join(" ");
}

export function useBluetoothHand({
  maxSamplesPerFinger = 2000,
  throttleMs = 20,
  firstPacketTimeoutMs = 3000,
}: {
  maxSamplesPerFinger?: number;
  throttleMs?: number;
  firstPacketTimeoutMs?: number;
}) {
  const [status, setStatus] = useState<Status>("idle");
  const [connected, setConnected] = useState(false);
  const [angles2D, setAngles2D] = useState<Angles2D>([[], [], [], [], []]);
  const [packets, setPackets] = useState(0);
  const [lastError, setLastError] = useState<string | null>(null);

  const deviceRef = useRef<BluetoothDevice | null>(null);
  const txCharRef = useRef<BluetoothRemoteGATTCharacteristic | null>(null);

  // --- text decode + line buffering (kept, even if you’re not parsing now) ---
  const decoderRef = useRef(new TextDecoder("utf-8"));
  const lineBufRef = useRef<string>("");

  // --- UI throttling + first-packet watchdog --------------------------------
  const lastEmitRef = useRef<number>(0);
  const firstPacketTimer = useRef<number | null>(null);
  const clearFirstPacketTimer = () => {
    if (firstPacketTimer.current) {
      window.clearTimeout(firstPacketTimer.current);
      firstPacketTimer.current = null;
    }
  };

  // --- RAW + TEXT LOGGING: fires on every notification ----------------------
  const onNotify = useCallback((e: Event) => {
    const dv = (e.target as BluetoothRemoteGATTCharacteristic).value!;
    if (!dv || dv.byteLength === 0) {
      console.log("[RAW NOTIFICATION] (empty)");
      return;
    }

    const u8 = new Uint8Array(dv.buffer, dv.byteOffset, dv.byteLength);

    // 1) RAW BYTES (length, hex, and first few decimals)
    console.log("[RAW NOTIFICATION]", {
      length: dv.byteLength,
      hex: hexDump(u8, 128),
      previewDec: Array.from(u8.slice(0, 16)),
      ts: Date.now(),
    });

    // 2) AS TEXT (streaming decode; may be partial line)
    const chunk = decoderRef.current.decode(u8, { stream: true });
    console.log("[AS TEXT]", chunk);

    // Optionally keep your line buffer if you’ll parse later:
    lineBufRef.current += chunk;

    // If you still want to mark "receiving" on first packet:
    if (firstPacketTimer.current) {
      clearFirstPacketTimer();
      setStatus("receiving");
    }

    // If you *also* still want to keep angles2D ticking (not parsing now):
    // (comment out if you truly want zero processing)
    const now = performance.now();
    if (now - lastEmitRef.current >= throttleMs) {
      lastEmitRef.current = now;
      setPackets(p => p + 1);
    }
  }, [throttleMs]);

  // Helpful enumerator when UUIDs don’t match the firmware
  async function enumerateAll(server: BluetoothRemoteGATTServer) {
    try {
      const services = await server.getPrimaryServices();
      const lines: string[] = [];
      for (const s of services) {
        lines.push(`service: ${s.uuid}`);
        const chars = await s.getCharacteristics();
        for (const c of chars) lines.push(`  char: ${c.uuid}`);
      }
      console.log("[GATT ENUMERATION]\n" + lines.join("\n"));
      setLastError("Found services/chars:\n" + lines.join("\n"));
    } catch (e: any) {
      setLastError("Enumeration failed: " + (e?.message || String(e)));
    }
  }

  const connect = useCallback(async () => {
    try {
      setLastError(null);
      setStatus("requesting");

      const device = await navigator.bluetooth.requestDevice({
        acceptAllDevices: true,
        optionalServices: [NUS_SERVICE],
      });

      deviceRef.current = device;
      device.addEventListener("gattserverdisconnected", () => {
        console.log("[BLE] Disconnected");
        // Flush any pending decoder bytes as a final string:
        const tail = decoderRef.current.decode(); // flush
        if (tail) console.log("[AS TEXT][flush]", tail);
        setConnected(false);
        setStatus("idle");
      });

      setStatus("connecting");
      const server = await device.gatt!.connect();
      console.log("[BLE] GATT connected to", device.name || "(unnamed)");

      setStatus("subscribing");
      let service: BluetoothRemoteGATTService;
      let txChar: BluetoothRemoteGATTCharacteristic;

      try {
        service = await server.getPrimaryService(NUS_SERVICE);
      } catch {
        await enumerateAll(server);
        throw new Error("NUS service not found on device");
      }

      try {
        txChar = await service.getCharacteristic(NUS_TX_CHAR); // Notify path (device→browser)
      } catch {
        await enumerateAll(server);
        throw new Error("NUS TX (notify) characteristic not found");
      }

      txCharRef.current = txChar;

      // Reset buffers/log timers on a new connection
      lineBufRef.current = "";
      lastEmitRef.current = 0;

      await txChar.startNotifications();
      console.log("[BLE] Notifications started on", txChar.uuid);
      txChar.addEventListener("characteristicvaluechanged", onNotify);

      setConnected(true);
      setStatus("connected");

      // Start watchdog: flip to "no-data" if nothing arrives
      clearFirstPacketTimer();
      firstPacketTimer.current = window.setTimeout(() => {
        if (packets === 0) setStatus("no-data");
      }, firstPacketTimeoutMs) as unknown as number;
    } catch (err: any) {
      console.error("[BLE ERROR]", err);
      setLastError(err?.message || String(err));
      setConnected(false);
      setStatus("error");
    }
  }, [onNotify, firstPacketTimeoutMs, packets]);

  const disconnect = useCallback(async () => {
    clearFirstPacketTimer();
    try {
      const ch = txCharRef.current;
      if (ch) {
        ch.removeEventListener("characteristicvaluechanged", onNotify as any);
        try { await ch.stopNotifications(); } catch {}
      }
      const dev = deviceRef.current;
      if (dev?.gatt?.connected) dev.gatt.disconnect();
    } finally {
      // Flush decoder
      const tail = decoderRef.current.decode();
      if (tail) console.log("[AS TEXT][flush]", tail);
      setConnected(false);
      setStatus("idle");
    }
  }, [onNotify]);

  const reconnect = useCallback(async () => {
    const dev = deviceRef.current;
    if (!dev) return connect();
    if (dev.gatt && !dev.gatt.connected) {
      try {
        setStatus("connecting");
        const server = await dev.gatt.connect();
        console.log("[BLE] Reconnected");
        setStatus("subscribing");
        const service = await server.getPrimaryService(NUS_SERVICE);
        const txChar = await service.getCharacteristic(NUS_TX_CHAR);
        txCharRef.current = txChar;
        lineBufRef.current = "";
        lastEmitRef.current = 0;
        await txChar.startNotifications();
        console.log("[BLE] Notifications restarted");
        txChar.addEventListener("characteristicvaluechanged", onNotify);
        setConnected(true);
        setStatus("connected");
        clearFirstPacketTimer();
        firstPacketTimer.current = window.setTimeout(() => {
          if (packets === 0) setStatus("no-data");
        }, firstPacketTimeoutMs) as unknown as number;
      } catch (err: any) {
        console.error("[BLE ERROR]", err);
        setLastError(err?.message || String(err));
        setConnected(false);
        setStatus("error");
      }
    }
  }, [connect, onNotify, firstPacketTimeoutMs, packets]);

  const resetData = useCallback(() => {
    setAngles2D([[], [], [], [], []]);
    setPackets(0);
  }, []);

  useEffect(() => () => clearFirstPacketTimer(), []);

  return {
    status,
    lastError,
    connected,
    packets,
    angles2D,
    connect,
    disconnect,
    reconnect,
    resetData,
  };
}
