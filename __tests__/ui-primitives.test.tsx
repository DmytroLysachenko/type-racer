import { fireEvent, render, screen } from "@testing-library/react";
import { Button, TextField } from "@/components/ui";

test("shared button exposes busy state and blocks duplicate actions", () => {
  const onClick = jest.fn();
  const { rerender } = render(<Button onClick={onClick}>Save name</Button>);
  fireEvent.click(screen.getByRole("button", { name: "Save name" }));
  expect(onClick).toHaveBeenCalledTimes(1);

  rerender(
    <Button onClick={onClick} pending>
      Saving…
    </Button>,
  );
  const button = screen.getByRole("button", { name: "Saving…" });
  expect(button).toBeDisabled();
  expect(button).toHaveAttribute("aria-busy", "true");
  fireEvent.click(button);
  expect(onClick).toHaveBeenCalledTimes(1);
});

test("shared text field connects its label and help text to the input", () => {
  render(
    <TextField label="Display name" description="Shown to other racers" />,
  );
  const input = screen.getByRole("textbox", { name: "Display name" });
  expect(input).toHaveAccessibleDescription("Shown to other racers");
});
