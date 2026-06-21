import type { ErrorRequestHandler, RequestHandler } from "express";
import { ZodError } from "zod";
import { AppError } from "../errors/appError";

export const notFoundHandler: RequestHandler = (_request, _response, next) => {
  next(new AppError(404, "NOT_FOUND", "The requested resource was not found."));
};

export const errorHandler: ErrorRequestHandler = (
  error,
  _request,
  response,
  _next,
) => {
  if (
    error instanceof SyntaxError &&
    (error as SyntaxError & { type?: string }).type === "entity.parse.failed"
  ) {
    response.status(400).json({
      error: {
        code: "INVALID_JSON",
        message: "The request body must contain valid JSON.",
      },
    });
    return;
  }
  if (error?.type === "entity.too.large") {
    response.status(413).json({
      error: {
        code: "REQUEST_TOO_LARGE",
        message: "The request is too large.",
      },
    });
    return;
  }
  if (error instanceof ZodError) {
    response.status(400).json({
      error: {
        code: "INVALID_INPUT",
        message: error.issues[0]?.message ?? "Invalid request.",
      },
    });
    return;
  }

  if (error instanceof AppError) {
    response
      .status(error.status)
      .json({ error: { code: error.code, message: error.message } });
    return;
  }

  console.error("Unhandled request error", error);
  response.status(500).json({
    error: {
      code: "INTERNAL_ERROR",
      message: "Something went wrong. Please try again.",
    },
  });
};
