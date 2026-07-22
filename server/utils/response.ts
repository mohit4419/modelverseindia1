/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Response } from 'express';

export class ApiResponse {
  static success(res: Response, data: any, message: string = 'Operation successful', statusCode: number = 200) {
    return res.status(statusCode).json({
      success: true,
      message,
      data,
    });
  }

  static error(res: Response, error: string, details: any = null, statusCode: number = 400) {
    return res.status(statusCode).json({
      success: false,
      error,
      details,
    });
  }
}
