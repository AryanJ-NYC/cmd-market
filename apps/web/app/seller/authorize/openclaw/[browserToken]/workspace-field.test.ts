import { describe, expect, it } from "vitest";
import { getWorkspaceFieldInputProps } from "./workspace-field";

describe("getWorkspaceFieldInputProps", () => {
  it("uses the suggested workspace values as placeholders instead of autofilling them", () => {
    expect(
      getWorkspaceFieldInputProps(undefined, "OpenClaw Seller Studio")
    ).toEqual({
      defaultValue: undefined,
      placeholder: "OpenClaw Seller Studio"
    });
    expect(
      getWorkspaceFieldInputProps(undefined, "openclaw-seller-studio")
    ).toEqual({
      defaultValue: undefined,
      placeholder: "openclaw-seller-studio"
    });
  });

  it("preserves the submitted value after a validation redirect", () => {
    expect(
      getWorkspaceFieldInputProps("Custom Studio", "OpenClaw Seller Studio")
    ).toEqual({
      defaultValue: "Custom Studio",
      placeholder: "OpenClaw Seller Studio"
    });
  });
});
