import { formidable } from "formidable";
import { ApiError } from "./http.js";
import { getConfig } from "./config.js";

export function parseMultipart(req) {
  const config = getConfig();
  const form = formidable({
    multiples: false,
    maxFileSize: config.uploadMaxSize,
    allowEmptyFiles: false,
  });

  return new Promise((resolve, reject) => {
    form.parse(req, (error, fields, files) => {
      if (error) return reject(new ApiError(400, "Upload invalido.", error.message));
      const normalizedFields = {};
      for (const [key, value] of Object.entries(fields)) {
        normalizedFields[key] = Array.isArray(value) ? value[0] : value;
      }
      const normalizedFiles = {};
      for (const [key, value] of Object.entries(files)) {
        normalizedFiles[key] = Array.isArray(value) ? value[0] : value;
      }
      return resolve({ fields: normalizedFields, files: normalizedFiles });
    });
  });
}
