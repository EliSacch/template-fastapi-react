import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { AxiosError, type AxiosResponse, type InternalAxiosRequestConfig } from "axios";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { api } from "./api/client";
import { SessionProvider } from "./context/SessionContext";
import { useSessionContext } from "./hooks/useSessionContext";
import { setLocale } from "./i18n";

import App from "./App";
import Profile from "./routes/Profile";

import { en } from "./i18n/locales/en";

function axiosFailure(status: number, data: unknown) {
  return new AxiosError("Request failed", String(status), undefined, undefined, {
    data,
    status,
    statusText: "",
    headers: {},
    config: {} as InternalAxiosRequestConfig,
  });
}

function axiosResponse<T>(data: T): AxiosResponse<T> {
  return {
    data,
    status: 200,
    statusText: "OK",
    headers: {},
    config: {} as InternalAxiosRequestConfig,
  };
}

function deferred<T>() {
  let resolve: (value: T) => void;
  let reject: (reason?: unknown) => void;
  const promise = new Promise<T>((res, rej) => {
    resolve = res;
    reject = rej;
  });
  return { promise, resolve: resolve!, reject: reject! };
}

describe("App", () => {
  beforeEach(() => {
    setLocale("en");
  });

  afterEach(() => {
    cleanup();
    window.history.pushState({}, "", "/");
    vi.restoreAllMocks();
  });

  it("sends the session cookie on API requests", () => {
    expect(api.defaults.withCredentials).toBe(true);
  });

  it("shows the Google button when there is no session", async () => {
    const pending = deferred<AxiosResponse>();
    const getProfile = vi.spyOn(api, "get").mockReturnValue(pending.promise);

    render(<App />);

    expect(screen.getByText("Checking your session…")).toBeTruthy();
    pending.reject(axiosFailure(401, { code: "UNAUTHORIZED" }));

    const link = await screen.findByRole("link", { name: "Sign in with Google" });
    expect(link.getAttribute("href")).toBe("/auth/google");
    expect(getProfile.mock.calls[0]?.[0]).toBe("/api/profile");
    expect(getProfile.mock.calls[0]?.[1]?.signal).toBeInstanceOf(AbortSignal);
  });

  it("hides the Google button on home when signed in", async () => {
    vi.spyOn(api, "get").mockResolvedValue(axiosResponse({ id: 1, email: "ada@example.com" }));

    render(<App />);

    expect(await screen.findByRole("heading", { name: "Home" })).toBeTruthy();
    expect(screen.queryByRole("link", { name: "Sign in with Google" })).toBeNull();
    expect(screen.queryByText("ada@example.com")).toBeNull();
    expect(screen.queryByRole("button", { name: "Sign out" })).toBeNull();
  });

  it("shows the signed-in email and returns to the Google button after sign out", async () => {
    window.history.pushState({}, "", "/profile");
    vi.spyOn(api, "get").mockResolvedValue(axiosResponse({ id: 1, email: "ada@example.com" }));
    const logout = vi.spyOn(api, "post").mockResolvedValue(axiosResponse(undefined));

    render(<App />);

    expect(await screen.findByRole("heading", { name: "Profile" })).toBeTruthy();
    expect(screen.getByText("ada@example.com")).toBeTruthy();

    fireEvent.click(screen.getByRole("button", { name: "Sign out" }));

    expect(await screen.findByRole("link", { name: "Sign in with Google" })).toBeTruthy();
    expect(logout.mock.calls[0]?.[0]).toBe("/auth/logout");
  });

  it("shows the catalog message when the profile request fails", async () => {
    vi.spyOn(api, "get").mockRejectedValue(axiosFailure(500, { code: "INTERNAL_ERROR" }));

    render(<App />);

    expect(await screen.findByRole("alert")).toHaveProperty(
      "textContent",
      en.errors.INTERNAL_ERROR,
    );
  });

  it("shows the unknown message when a failed response has no problem body", async () => {
    vi.spyOn(api, "get").mockRejectedValue(axiosFailure(500, ""));

    render(<App />);

    expect(await screen.findByRole("alert")).toHaveProperty("textContent", en.errors.UNKNOWN);
  });

  it("shows an error message when the profile request rejects with an Error", async () => {
    vi.spyOn(api, "get").mockRejectedValue(new Error("The request was blocked."));

    render(<App />);

    expect(await screen.findByRole("alert")).toHaveProperty(
      "textContent",
      "The request was blocked.",
    );
  });

  it("shows an unknown error when the profile request rejects with a non-error", async () => {
    vi.spyOn(api, "get").mockRejectedValue("nope");

    render(<App />);

    expect(await screen.findByRole("alert")).toHaveProperty("textContent", "Unknown error");
  });

  it("ignores an aborted profile request", async () => {
    vi.spyOn(api, "get").mockImplementation((_url, config) => {
      return new Promise((_resolve, reject) => {
        config?.signal?.addEventListener?.("abort", () => {
          reject(new AxiosError("canceled", AxiosError.ERR_CANCELED));
        });
      });
    });

    const { unmount } = render(<App />);
    unmount();

    await Promise.resolve();
    expect(screen.queryByRole("alert")).toBeNull();
  });

  it("shows the catalog message when sign out fails", async () => {
    window.history.pushState({}, "", "/profile");
    vi.spyOn(api, "get").mockResolvedValue(axiosResponse({ id: 1, email: "ada@example.com" }));
    vi.spyOn(api, "post").mockRejectedValue(axiosFailure(500, { code: "INTERNAL_ERROR" }));

    render(<App />);
    fireEvent.click(await screen.findByRole("button", { name: "Sign out" }));

    expect(await screen.findByRole("alert")).toHaveProperty(
      "textContent",
      en.errors.INTERNAL_ERROR,
    );
    expect(screen.queryByRole("heading", { name: "Home" })).toBeNull();
  });

  it("shows an unknown error when sign out rejects with a non-error", async () => {
    window.history.pushState({}, "", "/profile");
    vi.spyOn(api, "get").mockResolvedValue(axiosResponse({ id: 1, email: "ada@example.com" }));
    vi.spyOn(api, "post").mockRejectedValue("nope");

    render(<App />);
    fireEvent.click(await screen.findByRole("button", { name: "Sign out" }));

    expect(await screen.findByRole("alert")).toHaveProperty("textContent", "Unknown error");
  });

  it("shows the profile page when signed in", async () => {
    window.history.pushState({}, "", "/profile");
    vi.spyOn(api, "get").mockResolvedValue(axiosResponse({ id: 1, email: "ada@example.com" }));

    render(<App />);

    expect(screen.getByText("Checking your session…")).toBeTruthy();
    expect(await screen.findByRole("heading", { name: "Profile" })).toBeTruthy();
    expect(screen.getByText("ada@example.com")).toBeTruthy();
    expect(screen.getByRole("button", { name: "Sign out" })).toBeTruthy();
  });

  it("redirects /profile home when signed out", async () => {
    window.history.pushState({}, "", "/profile");
    vi.spyOn(api, "get").mockRejectedValue(axiosFailure(401, { code: "UNAUTHORIZED" }));

    render(<App />);

    expect(await screen.findByRole("link", { name: "Sign in with Google" })).toBeTruthy();
    expect(screen.queryByRole("heading", { name: "Profile" })).toBeNull();
  });

  it("renders nothing on the profile page until the session is signed in", () => {
    const pending = deferred<AxiosResponse>();
    vi.spyOn(api, "get").mockReturnValue(pending.promise);

    render(
      <QueryClientProvider client={new QueryClient()}>
        <SessionProvider>
          <Profile />
        </SessionProvider>
      </QueryClientProvider>,
    );

    expect(screen.queryByRole("heading", { name: "Profile" })).toBeNull();
  });

  it("throws when useSessionContext is used outside SessionProvider", () => {
    function Probe() {
      useSessionContext();
      return null;
    }

    expect(() => render(<Probe />)).toThrow(
      "useSessionContext must be used within SessionProvider",
    );
  });
});
