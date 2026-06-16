import { cleanup, render } from "@testing-library/react";
import { afterEach, describe, expect, test, vi } from "vitest";
import { UsernameForm } from "./username-form";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn() }),
}));

vi.mock("next-intl", () => ({
  useTranslations: () => (key: string) => key,
}));

vi.mock("@/lib/server/loginname", () => ({
  sendLoginname: vi.fn(),
}));

describe("UsernameForm", () => {
  afterEach(cleanup);

  test("should autofocus the loginName input on mount", () => {
    const { getByTestId } = render(
      <UsernameForm loginName="" requestId={undefined} loginSettings={undefined} submit={false} allowRegister={false} />,
    );
    expect(getByTestId("username-text-input")).toHaveFocus();
  });

  test("should render register button when registration is allowed", () => {
    const { getByTestId } = render(
      <UsernameForm loginName="" requestId={undefined} loginSettings={undefined} submit={false} allowRegister={true} />,
    );
    expect(getByTestId("register-button")).toBeInTheDocument();
  });

  test("should hide register button when registration is not allowed", () => {
    const { queryByTestId } = render(
      <UsernameForm loginName="" requestId={undefined} loginSettings={undefined} submit={false} allowRegister={false} />,
    );
    expect(queryByTestId("register-button")).not.toBeInTheDocument();
  });
});
