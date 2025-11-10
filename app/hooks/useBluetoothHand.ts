"use client";

import { useCallback, useEffect, useRef, useState } from "react";

// ✅ Nordic UART Service (NUS)
const NUS_SERVICE = "6e400001-b5a3-f393-e0a9-e50e24dcca9e";
const NUS_TX_CHAR = "6e400003-b5a3-f393-e0a9-e50e24dcca9e"; // Notify (device -> browser)

export type Angles2D = [number[], number[], number[], number[], number[]];
type Status =
  | "idle" | "requesting" | "connecting" | "subscribing"
  | "connected" | "receiving" | "no-data" | "error";

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
  const lastEmitRef = useRef<number>(0);
  const firstPacketTimer = useRef<number | null>(null);

  const clearFirstPacketTimer = () => {
    if (firstPacketTimer.current) {
      window.clearTimeout(firstPacketTimer.current);
      firstPacketTimer.current = null;
    }
  };

  const parseAndAppend = useCallback((dv: DataView) => {
    const now = performance.now();
    if (now - lastEmitRef.current < throttleMs) return;
    lastEmitRef.current = now;

    if (dv.byteLength < 10) return;

    const s0 = dv.getUint16(0, true) / 100;
    const s1 = dv.getUint16(2, true) / 100;
    const s2 = dv.getUint16(4, true) / 100;
    const s3 = dv.getUint16(6, true) / 100;
    const s4 = dv.getUint16(8, true) / 100;

    setAngles2D(prev => {
      const next: Angles2D = [
        [...prev[0], s0],
        [...prev[1], s1],
        [...prev[2], s2],
        [...prev[3], s3],
        [...prev[4], s4],
      ];
      for (let i = 0; i < 5; i++) {
        if (next[i].length > maxSamplesPerFinger) {
          next[i] = next[i].slice(next[i].length - maxSamplesPerFinger);
        }
      }
      return next;
    });

    setPackets(p => p + 1);

    if (firstPacketTimer.current) {
      clearFirstPacketTimer();
      setStatus("receiving");
    }
  }, [throttleMs, maxSamplesPerFinger]);

  const onNotify = useCallback((e: Event) => {
    const dv = (e.target as BluetoothRemoteGATTCharacteristic).value!;
    if (dv) parseAndAppend(dv);
  }, [parseAndAppend]);

  // Helper: if UUIDs are wrong, enumerate available services/chars for debugging
  async function enumerateAll(server: BluetoothRemoteGATTServer) {
    try {
      const services = await server.getPrimaryServices();
      const lines: string[] = [];
      for (const s of services) {
        lines.push(`service: ${s.uuid}`);
        const chars = await s.getCharacteristics();
        for (const c of chars) lines.push(`  char: ${c.uuid}`);
      }
      setLastError(
        "Could not find expected service/characteristic.\nFound:\n" + lines.join("\n")
      );
    } catch (e: any) {
      setLastError("Enumeration failed: " + (e?.message || String(e)));
    }
  }

  const connect = useCallback(async () => {
    try {
      setLastError(null);
      setStatus("requesting");

      // ✅ Show EVERYTHING; rely on optionalServices to access NUS later
      const device = await navigator.bluetooth.requestDevice({
        acceptAllDevices: true,
        optionalServices: [NUS_SERVICE],
      });

      deviceRef.current = device;
      device.addEventListener("gattserverdisconnected", () => {
        setConnected(false);
        setStatus("idle");
      });

      setStatus("connecting");
      const server = await device.gatt!.connect();

      setStatus("subscribing");
      let service: BluetoothRemoteGATTService;
      let txChar: BluetoothRemoteGATTCharacteristic;

      try {
        service = await server.getPrimaryService(NUS_SERVICE);
      } catch (e) {
        await enumerateAll(server);
        throw new Error("NUS service not found on device");
      }

      try {
        txChar = await service.getCharacteristic(NUS_TX_CHAR); // Notify path (device→browser)
      } catch (e) {
        await enumerateAll(server);
        throw new Error("NUS TX (notify) characteristic not found");
      }

      txCharRef.current = txChar;
      await txChar.startNotifications();
      txChar.addEventListener("characteristicvaluechanged", onNotify);

      setConnected(true);
      setStatus("connected");

      clearFirstPacketTimer();
      firstPacketTimer.current = window.setTimeout(() => {
        if (packets === 0) setStatus("no-data");
      }, firstPacketTimeoutMs) as unknown as number;
    } catch (err: any) {
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
        setStatus("subscribing");
        const service = await server.getPrimaryService(NUS_SERVICE);
        const txChar = await service.getCharacteristic(NUS_TX_CHAR);
        txCharRef.current = txChar;
        await txChar.startNotifications();
        txChar.addEventListener("characteristicvaluechanged", onNotify);
        setConnected(true);
        setStatus("connected");
        clearFirstPacketTimer();
        firstPacketTimer.current = window.setTimeout(() => {
          if (packets === 0) setStatus("no-data");
        }, firstPacketTimeoutMs) as unknown as number;
      } catch (err: any) {
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