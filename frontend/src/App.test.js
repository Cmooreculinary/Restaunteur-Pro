import { getAccessToken, setAccessToken } from "./lib/sessionAuth";


describe("session bearer storage", () => {
  beforeEach(() => {
    window.sessionStorage.clear();
  });

  test("stores and clears the production access token", () => {
    expect(getAccessToken()).toBeNull();
    setAccessToken("sess_test_token");
    expect(getAccessToken()).toBe("sess_test_token");
    setAccessToken(null);
    expect(getAccessToken()).toBeNull();
  });
});
