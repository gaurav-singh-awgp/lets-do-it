import { http, HttpResponse } from "msw";
import { setupServer } from "msw/node";

const defaultListHandler = http.get("*/api/v1/todos", () =>
  HttpResponse.json([]),
);

export const server = setupServer(defaultListHandler);
