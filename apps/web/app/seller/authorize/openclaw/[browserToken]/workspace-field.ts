export function getWorkspaceFieldInputProps(
  value: string | string[] | undefined,
  placeholder: string
) {
  return {
    defaultValue: typeof value === "string" ? value : undefined,
    placeholder
  };
}
