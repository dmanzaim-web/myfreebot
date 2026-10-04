"use strict";

const net = require("net");
const dns = require("dns").promises;

/**
 * Encode a number as a Minecraft VarInt Buffer
 */
function writeVarInt(value) {
  const bytes = [];
  let v = value;
  while (true) {
    if ((v & ~0x7f) === 0) {
      bytes.push(v);
      break;
    }
    bytes.push((v & 0x7f) | 0x80);
    v >>>= 7;
  }
  return Buffer.from(bytes);
}

/**
 * Read a Minecraft VarInt from a buffer at offset
 */
function readVarInt(buffer, offset = 0) {
  let result = 0;
  let shift = 0;
  let cursor = offset;

  while (cursor < buffer.length) {
    const byte = buffer[cursor++];
    result |= (byte & 0x7f) << shift;
    if ((byte & 0x80) === 0) {
      return { value: result, bytesRead: cursor - offset };
    }
    shift += 7;
    if (shift >= 35) {
      throw new Error("VarInt exceeds 35 bits");
    }
  }
  return null; // Incomplete VarInt
}

/**
 * Encode a string packet field
 */
function writeString(str) {
  const strBuf = Buffer.from(str, "utf8");
  const lenBuf = writeVarInt(strBuf.length);
  return Buffer.concat([lenBuf, strBuf]);
}

/**
 * Resolve Minecraft SRV record if present (e.g. _minecraft._tcp.domain.com)
 */
async function resolveMinecraftHost(host, port = 25565) {
  try {
    const srvRecords = await dns.resolveSrv(`_minecraft._tcp.${host}`);
    if (srvRecords && srvRecords.length > 0) {
      // Pick highest priority / weight
      const best = srvRecords[0];
      return { host: best.name, port: best.port };
    }
  } catch (e) {
    // No SRV record found, fallback to standard host & port
  }
  return { host, port: Number(port) || 25565 };
}

/**
 * Strip Minecraft color codes (§0-§f, §l, etc.) from MOTD
 */
function cleanMotd(desc) {
  if (!desc) return "";
  let raw = "";
  if (typeof desc === "string") {
    raw = desc;
  } else if (desc.text) {
    raw = desc.text;
    if (Array.isArray(desc.extra)) {
      raw += desc.extra.map((e) => (typeof e === "string" ? e : e.text || "")).join("");
    }
  } else {
    raw = JSON.stringify(desc);
  }
  return raw.replace(/§[0-9a-fk-or]/gi, "").trim();
}

/**
 * Real Minecraft Server List Ping (SLP) over TCP
 */
async function pingMinecraftServer(rawHost, rawPort = 25565, timeoutMs = 6000) {
  const startTime = Date.now();
  const { host, port } = await resolveMinecraftHost(rawHost, rawPort);

  return new Promise((resolve) => {
    let resolved = false;
    const socket = new net.Socket();

    const finish = (result) => {
      if (resolved) return;
      resolved = true;
      try {
        socket.destroy();
      } catch {}
      resolve(result);
    };

    const timer = setTimeout(() => {
      finish({
        online: false,
        host,
        port,
        error: "Connection timed out. Server may be offline, starting up, or protected by a firewall.",
        code: "ETIMEDOUT",
        latency: Date.now() - startTime
      });
    }, timeoutMs);

    socket.setTimeout(timeoutMs);

    socket.connect(port, host, () => {
      // Step 1: Handshake Packet (ID 0x00)
      // Protocol version: 767 (Minecraft 1.21) or -1 for generic
      const packetId = writeVarInt(0x00);
      const protocolVersion = writeVarInt(767);
      const serverAddress = writeString(host);
      const serverPort = Buffer.alloc(2);
      serverPort.writeUInt16BE(port, 0);
      const nextState = writeVarInt(1); // 1 = Status

      const handshakePayload = Buffer.concat([
        packetId,
        protocolVersion,
        serverAddress,
        serverPort,
        nextState
      ]);
      const handshakePacket = Buffer.concat([
        writeVarInt(handshakePayload.length),
        handshakePayload
      ]);

      // Step 2: Status Request Packet (ID 0x00)
      const requestPacket = Buffer.concat([writeVarInt(1), writeVarInt(0x00)]);

      socket.write(Buffer.concat([handshakePacket, requestPacket]));
    });

    let incomingData = Buffer.alloc(0);

    socket.on("data", (chunk) => {
      incomingData = Buffer.concat([incomingData, chunk]);

      try {
        let offset = 0;
        const packetLen = readVarInt(incomingData, offset);
        if (!packetLen) return;
        offset += packetLen.bytesRead;

        if (incomingData.length < offset + packetLen.value) {
          // Packet still arriving
          return;
        }

        const packetId = readVarInt(incomingData, offset);
        if (!packetId || packetId.value !== 0x00) return;
        offset += packetId.bytesRead;

        const stringLen = readVarInt(incomingData, offset);
        if (!stringLen) return;
        offset += stringLen.bytesRead;

        if (incomingData.length < offset + stringLen.value) {
          return;
        }

        const jsonStr = incomingData.slice(offset, offset + stringLen.value).toString("utf8");
        clearTimeout(timer);

        const latency = Math.max(1, Date.now() - startTime);
        const data = JSON.parse(jsonStr);

        finish({
          online: true,
          host,
          port,
          latency,
          version: {
            name: data.version?.name || "Unknown",
            protocol: data.version?.protocol || 0
          },
          players: {
            online: Number(data.players?.online || 0),
            max: Number(data.players?.max || 0),
            sample: Array.isArray(data.players?.sample)
              ? data.players.sample.map((p) => p.name)
              : []
          },
          motd: cleanMotd(data.description),
          favicon: data.favicon || null
        });
      } catch (err) {
        // Continue accumulating data until timeout or complete parse
      }
    });

    socket.on("error", (err) => {
      clearTimeout(timer);
      let errorMsg = err.message;
      if (err.code === "ECONNREFUSED") {
        errorMsg = "Connection refused — Minecraft server is offline or unreachable.";
      } else if (err.code === "ENOTFOUND") {
        errorMsg = "Server hostname could not be resolved. Please verify the address.";
      } else if (err.code === "EHOSTUNREACH") {
        errorMsg = "Host is unreachable.";
      }

      finish({
        online: false,
        host,
        port,
        error: errorMsg,
        code: err.code || "UNKNOWN",
        latency: Date.now() - startTime
      });
    });

    socket.on("timeout", () => {
      clearTimeout(timer);
      finish({
        online: false,
        host,
        port,
        error: "Connection timed out. Server may be offline or unreachable.",
        code: "ETIMEDOUT",
        latency: Date.now() - startTime
      });
    });
  });
}

module.exports = {
  pingMinecraftServer,
  resolveMinecraftHost
};
