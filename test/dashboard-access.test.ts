import assert from "node:assert/strict";
import { describe, test } from "node:test";

import { getDashboardAccessError } from "../lib/dashboard-access";
import { getCredentialRegisterError } from "../lib/auth";

describe("dashboard access gating", () => {
  test("returns unauthorized for missing users", () => {
    assert.equal(getDashboardAccessError(null), "Unauthorized");
  });

  test("blocks pending non-admin users", () => {
    const result = getDashboardAccessError({
      id: "user_1",
      role: "artist",
      status: "pending",
    });

    assert.equal(result, "Account pending approval");
  });

  test("blocks rejected non-admin users", () => {
    const result = getDashboardAccessError({
      id: "user_1",
      role: "artist",
      status: "rejected",
    });

    assert.equal(result, "Account not approved");
  });

  test("allows approved artists and admins", () => {
    assert.equal(
      getDashboardAccessError({ id: "artist_1", role: "artist", status: "approved" }),
      null,
    );
    assert.equal(
      getDashboardAccessError({ id: "ar_1", role: "a&r", status: "approved" }),
      null,
    );
    assert.equal(
      getDashboardAccessError({ id: "admin_1", role: "admin", status: "pending" }),
      null,
    );
  });

  test("does not let pending management users bypass approval", () => {
    assert.equal(
      getDashboardAccessError({ id: "ar_1", role: "a&r", status: "pending" }),
      "Account pending approval",
    );
  });
});

describe("legacy credential registration", () => {
  test("stays disabled even when registrations are open and password is valid", () => {
    const result = getCredentialRegisterError("very-secure-pass", true);
    assert.equal(result, "REGISTRATION FLOW DISABLED");
  });

  test("preserves existing closed-registration and weak-password guards", () => {
    assert.equal(getCredentialRegisterError("whatever123", false), "REGISTRATIONS CLOSED");
    assert.match(
      getCredentialRegisterError("123", true) || "",
      /PASSWORD MUST BE AT LEAST/i,
    );
  });

  test("prefers closed-registration error over password validation", () => {
    assert.equal(getCredentialRegisterError("123", false), "REGISTRATIONS CLOSED");
  });
});
