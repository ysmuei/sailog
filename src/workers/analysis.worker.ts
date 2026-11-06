/// <reference lib="webworker" />
import { readChatFile } from "../features/chat-parser/file";
import { createSample } from "../features/chat-parser/sample";
import { analyze } from "../features/statistics/engine";
import { dayKey } from "../lib/date";
import type { AnalysisOptions, ChatInfo, ParsedChat } from "../types/chat";

let chat: ParsedChat | null = null;
type Request = { id: number } & (
  | { action: "file"; file: File }
  | { action: "sample" }
  | { action: "analyze"; options: AnalysisOptions }
);
self.onmessage = async ({ data }: MessageEvent<Request>) => {
  const { id } = data;
  try {
    if (data.action === "analyze") {
      if (!chat) throw new Error("먼저 대화 파일을 선택해 주세요.");
      self.postMessage({
        id,
        type: "report",
        report: analyze(chat.messages, data.options),
      });
      return;
    }
    chat =
      data.action === "sample"
        ? createSample()
        : await readChatFile(data.file, (progress, stage) =>
            self.postMessage({ id, type: "progress", progress, stage }),
          );
    const participants = new Map<
      string,
      { id: string; name: string; count: number }
    >();
    for (const msg of chat.messages) {
      if (!participants.has(msg.senderId))
        participants.set(msg.senderId, {
          id: msg.senderId,
          name: msg.senderName,
          count: 0,
        });
      participants.get(msg.senderId)!.count++;
    }
    const info: ChatInfo = {
      participants: [...participants.values()],
      start: dayKey(chat.messages[0].timestamp),
      end: dayKey(chat.messages.at(-1)!.timestamp),
      messageCount: chat.messages.length,
      issues: chat.issues,
      ignoredSystem: chat.ignoredSystem,
      format: chat.format,
      encoding: chat.encoding,
      sample: data.action === "sample",
    };
    self.postMessage({ id, type: "info", info });
  } catch (error) {
    // Never log source data or propagate library errors that could contain conversation text.
    self.postMessage({
      id,
      type: "error",
      error:
        error instanceof Error &&
        !/JSZip|Unexpected|Invalid|Cannot/.test(error.message)
          ? error.message
          : "파일을 처리하지 못했어요. 지원 형식과 파일 상태를 확인해 주세요.",
    });
  }
};
