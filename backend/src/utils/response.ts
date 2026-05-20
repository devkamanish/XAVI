import { Response } from "express";

// Standardized API response format
export const sendSuccess = (res: Response, data: any, message = "Success", statusCode = 200) => {
  return res.status(statusCode).json({
    success: true,
    message,
    data,
  });
};

export const sendError = (res: Response, message = "Something went wrong", statusCode = 500, errors?: any) => {
  return res.status(statusCode).json({
    success: false,
    message,
    errors: errors || null,
  });
};

export const sendPaginated = (
  res: Response,
  data: any[],
  total: number,
  page: number,
  limit: number,
  message = "Success"
) => {
  return res.status(200).json({
    success: true,
    message,
    data,
    pagination: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    },
  });
};
