import { describe, expect, it } from "vitest";

import { MOCK_ADMIN_EMAIL, MOCK_ADMIN_PASSWORD } from "@/mocks/users";
import { authService } from "./auth.service";

describe("authService.login", () => {
  it("allows the demo admin account with its configured credentials", async () => {
    const session = await authService.login({
      email: MOCK_ADMIN_EMAIL,
      password: MOCK_ADMIN_PASSWORD,
    });

    expect(session.user.role).toBe("ADMIN");
  });

  it("rejects other passwords for the demo admin account", async () => {
    await expect(
      authService.login({ email: MOCK_ADMIN_EMAIL, password: "not-the-demo-password" }),
    ).rejects.toThrow("Email sau parolă greșită.");
  });
});
