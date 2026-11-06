// Kept separate so the landing bundle does not import ZIP/CSV dependencies.
export function validateFile(file: Pick<File, "name" | "size">) {
  if (!/\.(txt|csv|zip)$/i.test(file.name))
    throw new Error("TXT, CSV, ZIP 파일을 선택해 주세요.");
  if (!file.size)
    throw new Error("빈 파일이에요. 대화가 담긴 파일을 선택해 주세요.");
  if (file.size > 20 * 1024 * 1024)
    throw new Error(
      "파일은 20 MB까지 업로드할 수 있어요. 대화 기간을 나눠 주세요.",
    );
}
