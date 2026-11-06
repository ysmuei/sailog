import { dayStart, shiftDay } from "../../lib/date";
import type { Message, ParsedChat } from "../../types/chat";

/** Deterministic synthetic messages. Every sample KPI uses the real analysis engine. */
export function createSample(): ParsedChat {
  let seed = 727;
  const random = () => {
    seed = (seed * 1664525 + 1013904223) >>> 0;
    return seed / 4294967296;
  };
  const messages: Message[] = [];
  const texts = [
    "오늘 하루 어땠어?",
    "잘 지냈어! 너는?",
    "주말에 같이 산책할까?",
    "좋아. 날씨도 좋대!",
    "이따가 좋아하는 카페에서 만나자. 오늘 있었던 이야기도 들려줘.",
    "응 좋아 :)",
    "점심 맛있게 먹어",
    "고마워! 너도 맛있게 먹어",
  ];
  for (let day = 0; day < 184; day++) {
    if (random() < 0.12) continue;
    const date = shiftDay("2026-05-01", day);
    for (let session = 0; session < (random() > 0.65 ? 2 : 1); session++) {
      let timestamp =
        dayStart(date) +
        (session === 0 ? 10 + Math.floor(random() * 3) : 20) * 3600_000;
      let sender = random() < 0.57 ? 0 : 1;
      const turns = Math.floor(12 + random() * 28 + day / 10);
      for (let t = 0; t < turns; t++) {
        timestamp += Math.floor(random() * 280 + 10) * 1000;
        if (random() > 0.28) sender = 1 - sender;
        messages.push({
          id: `s${messages.length}`,
          senderId: `p${sender + 1}`,
          senderName: sender === 0 ? "서연" : "도윤",
          timestamp,
          content: texts[Math.floor(random() * texts.length)],
          type: "text",
          source: {
            file: "가상 샘플",
            line: messages.length + 1,
            format: "sample",
          },
        });
      }
    }
  }
  return {
    messages: messages.sort((a, b) => a.timestamp - b.timestamp),
    issues: [],
    ignoredSystem: 0,
    format: "가상 샘플",
    encoding: "UTF-8",
  };
}
