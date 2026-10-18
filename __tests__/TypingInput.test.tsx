import { fireEvent, render, screen } from "@testing-library/react";
import { useState } from "react";
import { TypingInput } from "@/components/TypingInput";

test("composition stays local until commit and native paste is allowed", () => {
  const commits: Array<{ value: string; composed?: boolean }> = [];
  function Harness() {
    const [value, setValue] = useState("");
    return (
      <>
        <p id="target">Target text</p>
        <TypingInput
          id="test-input"
          label="Type"
          value={value}
          onInput={(next, composed) => {
            commits.push({ value: next, composed });
            setValue(next);
          }}
          disabled={false}
          placeholder="Start"
          description="Type the target"
          describedBy="target"
        />
      </>
    );
  }
  render(<Harness />);
  const input = screen.getByRole("textbox", { name: "Type" });
  fireEvent.compositionStart(input);
  fireEvent.change(input, { target: { value: "漢" } });
  expect(commits).toEqual([]);
  fireEvent.compositionEnd(input);
  expect(commits).toEqual([{ value: "漢", composed: true }]);
  expect(input).toHaveValue("漢");
  expect(fireEvent.paste(input)).toBe(true);
  expect(fireEvent.drop(input)).toBe(false);
  expect(input).toHaveValue("漢");
});
