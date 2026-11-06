import { fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { expect, it, vi } from "vitest";
import { Upload } from "./Upload";
it("provides keyboard sample access and a native file input", async () => {
  const sample = vi.fn(),
    file = vi.fn();
  render(<Upload onSample={sample} onFile={file} />);
  await userEvent.click(
    screen.getByRole("button", { name: /샘플로 체험하기/ }),
  );
  expect(sample).toHaveBeenCalledOnce();
  const input = screen.getByLabelText("카카오톡 대화 파일");
  await userEvent.upload(
    input,
    new File(["synthetic"], "sample.txt", { type: "text/plain" }),
  );
  expect(file).toHaveBeenCalledOnce();
  expect(input).toHaveValue("");
});
it("explains that multiple dropped files need to be selected separately", () => {
  const onFile = vi.fn();
  const { container } = render(<Upload onSample={() => {}} onFile={onFile} />);
  fireEvent.drop(container.querySelector(".drop-zone")!, {
    dataTransfer: {
      files: [new File(["x"], "a.txt"), new File(["y"], "b.txt")],
    },
  });
  expect(screen.getByRole("alert")).toHaveTextContent("한 번에 하나씩");
  expect(onFile).not.toHaveBeenCalled();
});
