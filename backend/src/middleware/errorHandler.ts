import { Request, Response, NextFunction } from "express";


export const errorHandler = (err: any, req: Request, res: Response, next: NextFunction) => {
  console.error("❌ Error:", err.message || err);

  
  if (err.name === "ValidationError") {
    return res.status(400).json({
      success: false,
      message: "Validation error",
      errors: Object.values(err.errors).map((e: any) => e.message),
    });
  }

  
  if (err.code === 11000) {
    const field = Object.keys(err.keyPattern)[0];
    return res.status(409).json({
      success: false,
      message: `Duplicate value for ${field}`,
    });
  }

  
  if (err.name === "CastError") {
    return res.status(400).json({
      success: false,
      message: "Invalid ID format",
    });
  }

  
  return res.status(err.statusCode || 500).json({
    success: false,
    message: err.message || "Internal server error",
  });
};
