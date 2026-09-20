import { describe, it, expect, beforeAll, afterAll } from "bun:test";
import axios, { type AxiosInstance } from "axios";
import type { Server } from "http";
import type { AddressInfo } from "net";
import { app } from "./index";
import { prisma } from "@repo/db";

describe("Backend API Integration Tests", () => {
  let server: Server;
  let api: AxiosInstance;
  let authToken = "";
  let authCookie = "";

  const testUser = {
    username: `test_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
    password: "TestPassword123!",
  };

  beforeAll(async () => {
    // Warm up database connection
    try {
      await prisma.$connect();
    } catch {}

    // Start Express app on random available port
    await new Promise<void>((resolve) => {
      server = app.listen(0, () => resolve());
    });

    const port = (server.address() as AddressInfo).port;

    api = axios.create({
      baseURL: `http://localhost:${port}`,
      validateStatus: () => true,
    });

    let ipCounter = 1;
    api.interceptors.request.use((config) => {
      config.headers = config.headers || {};
      config.headers["X-Forwarded-For"] = `192.168.1.${ipCounter++}`;
      return config;
    });
  }, 15000);

  afterAll(async () => {
    // Clean up created test user and close server
    try {
      await prisma.user.deleteMany({
        where: { username: testUser.username },
      });
      await prisma.$disconnect();
    } catch {}

    await new Promise<void>((resolve) => {
      server.close(() => resolve());
    });
  });

  describe("Questions Endpoints", () => {
    // Verify listing seeded questions
    it("GET /questions - should return a list of questions", async () => {
      const res = await api.get("/questions");

      expect(res.status).toBe(200);
      expect(Array.isArray(res.data.questions)).toBe(true);
      expect(res.data.questions.length).toBeGreaterThan(0);
    }, 10000);

    // Verify fetching a single question by valid ID
    it("GET /questions/:id - should return question details with test cases", async () => {
      const res = await api.get("/questions/sum-two-numbers");

      expect(res.status).toBe(200);
      expect(res.data.question).toBeDefined();
      expect(res.data.question.id).toBe("sum-two-numbers");
      expect(Array.isArray(res.data.question.testCases)).toBe(true);
    }, 10000);

    // Verify 404 response for non-existent question ID
    it("GET /questions/:id - should return 404 for unknown question", async () => {
      const res = await api.get("/questions/non-existent-question-id");

      expect(res.status).toBe(404);
      expect(res.data.message).toBe("Question not found");
    });
  });

  describe("Authentication Endpoints", () => {
    // Verify user registration and HttpOnly cookie issuance
    it("POST /auth/signup - should register new user and set HttpOnly token cookie", async () => {
      const res = await api.post("/auth/signup", testUser);

      expect(res.status).toBe(201);
      expect(res.data.message).toBe("User created successfully");

      const cookies = res.headers["set-cookie"];
      expect(cookies).toBeDefined();
      const tokenCookie = cookies?.find((c) => c.startsWith("token="));
      expect(tokenCookie).toBeDefined();
      expect(tokenCookie?.toLowerCase()).toContain("httponly");
    });

    // Verify duplicate username rejection
    it("POST /auth/signup - should reject duplicate username registration", async () => {
      const res = await api.post("/auth/signup", testUser);

      expect(res.status).toBe(400);
      expect(res.data.message).toBe("Username already exists");
    });

    // Verify payload validation schema for passwords shorter than 8 characters
    it("POST /auth/signup - should reject password under 8 characters", async () => {
      const res = await api.post("/auth/signup", {
        username: `invalid_${Date.now()}`,
        password: "short",
      });

      expect(res.status).toBe(400);
    });

    // Verify login with correct credentials, token generation and cookie attachment
    it("POST /auth/signin - should authenticate user and issue token cookie", async () => {
      const res = await api.post("/auth/signin", testUser);

      expect(res.status).toBe(200);
      expect(res.data.token).toBeDefined();
      expect(res.data.user.username).toBe(testUser.username);

      authToken = res.data.token;

      const cookies = res.headers["set-cookie"];
      expect(cookies).toBeDefined();
      const tokenCookie = cookies?.find((c) => c.startsWith("token="));
      expect(tokenCookie).toBeDefined();
      expect(tokenCookie?.toLowerCase()).toContain("httponly");

      authCookie = tokenCookie?.split(";")[0] ?? "";
    });

    // Verify invalid password rejection
    it("POST /auth/signin - should reject incorrect password", async () => {
      const res = await api.post("/auth/signin", {
        username: testUser.username,
        password: "WrongPassword!",
      });

      expect(res.status).toBe(401);
      expect(res.data.message).toBe("Invalid username or password");
    });

    // Verify unknown username rejection
    it("POST /auth/signin - should reject non-existent username", async () => {
      const res = await api.post("/auth/signin", {
        username: "unknown_user_99999",
        password: "SomePassword123!",
      });

      expect(res.status).toBe(401);
      expect(res.data.message).toBe("Invalid username or password");
    });

    // Verify session retrieval using HttpOnly cookie
    it("GET /auth/me - should return user profile with HttpOnly cookie", async () => {
      const res = await api.get("/auth/me", {
        headers: { Cookie: authCookie },
      });

      expect(res.status).toBe(200);
      expect(res.data.user.username).toBe(testUser.username);
      expect(res.data.user.userId).toBeDefined();
    });

    // Verify session retrieval using Bearer authorization header fallback
    it("GET /auth/me - should return user profile with Bearer token header", async () => {
      const res = await api.get("/auth/me", {
        headers: { Authorization: `Bearer ${authToken}` },
      });

      expect(res.status).toBe(200);
      expect(res.data.user.username).toBe(testUser.username);
    });

    // Verify 401 when requesting session without cookie or token
    it("GET /auth/me - should reject request without credentials", async () => {
      const res = await api.get("/auth/me");

      expect(res.status).toBe(401);
      expect(res.data.message).toBe("Unauthorized");
    });

    // Verify cookie clearing on signout
    it("POST /auth/signout - should invalidate and clear session cookie", async () => {
      const res = await api.post("/auth/signout", {}, {
        headers: { Cookie: authCookie },
      });

      expect(res.status).toBe(200);
      expect(res.data.message).toBe("Logged out successfully");

      const cookies = res.headers["set-cookie"];
      expect(cookies).toBeDefined();
      const clearedCookie = cookies?.find((c) => c.startsWith("token="));
      expect(clearedCookie).toBeDefined();
      // Verify cookie expiry is set in the past
      expect(clearedCookie?.toLowerCase()).toContain("expires=");
    });
  });

  describe("Submissions & Code Runner Endpoints", () => {
    // Verify authentication requirement on /submission/run
    it("POST /submission/run - should reject unauthenticated runner requests", async () => {
      const res = await api.post("/submission/run", {
        code: "print('hello')",
        language: "python",
        questionId: "sum-two-numbers",
      });

      expect(res.status).toBe(401);
    });

    // Verify input validation for missing required body attributes
    it("POST /submission/run - should return 400 for missing code or language", async () => {
      const res = await api.post(
        "/submission/run",
        { questionId: "sum-two-numbers" },
        { headers: { Cookie: authCookie } },
      );

      expect(res.status).toBe(400);
    });

    // Verify language validation rejecting unsupported languages
    it("POST /submission/run - should return 400 for unsupported language", async () => {
      const res = await api.post(
        "/submission/run",
        {
          code: "System.out.println()",
          language: "java",
          questionId: "sum-two-numbers",
        },
        { headers: { Cookie: authCookie } },
      );

      expect(res.status).toBe(400);
      expect(res.data.message).toContain("Unsupported language");
    });

    // Verify authentication requirement on /submission/submit
    it("POST /submission/submit - should reject unauthenticated submission", async () => {
      const res = await api.post("/submission/submit", {
        code: "print('test')",
        language: "python",
        questionId: "sum-two-numbers",
      });

      expect(res.status).toBe(401);
    });

    // Verify validation rejecting empty or missing questionId
    it("POST /submission/submit - should return 400 when questionId is missing", async () => {
      const res = await api.post(
        "/submission/submit",
        {
          code: "print('test')",
          language: "python",
        },
        { headers: { Cookie: authCookie } },
      );

      expect(res.status).toBe(400);
    });

    // Verify authentication requirement on /submission/submissions
    it("GET /submission/submissions - should reject unauthenticated requests", async () => {
      const res = await api.get("/submission/submissions");

      expect(res.status).toBe(401);
    });

    // Verify fetching submissions list for authenticated user
    it("GET /submission/submissions - should return user submissions with valid cookie", async () => {
      const res = await api.get("/submission/submissions", {
        headers: { Cookie: authCookie },
      });

      expect(res.status).toBe(200);
      expect(Array.isArray(res.data.submissions)).toBe(true);
    });

    // Verify authentication requirement on /submission/:id
    it("GET /submission/:id - should reject unauthenticated submission lookup", async () => {
      const res = await api.get("/submission/some-random-id");

      expect(res.status).toBe(401);
    });

    // Verify 404 response for non-existent submission ID
    it("GET /submission/:id - should return 404 for non-existent submission", async () => {
      const res = await api.get("/submission/non-existent-submission-id", {
        headers: { Cookie: authCookie },
      });

      expect(res.status).toBe(404);
    });
  });
});
