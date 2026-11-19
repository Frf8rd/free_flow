const { AppError } = require("./errors");

const SCAN_URL = "https://api.cloudmersive.com/virus/scan/file";

async function scanBuffer(buffer, fileName = "project-image.webp") {
  const apiKey = (process.env.CLOUDMERSIVE_API_KEY || "").trim();
  if (!apiKey) {
    throw new AppError(503, "MALWARE_SCAN_NOT_CONFIGURED", "Cloudmersive nu este configurat; imaginea nu a fost publicată.");
  }

  const form = new FormData();
  form.append("inputFile", new Blob([buffer]), fileName);

  let response;
  try {
    response = await fetch(SCAN_URL, {
      method: "POST",
      headers: { Apikey: apiKey },
      body: form,
      signal: AbortSignal.timeout(15000),
    });
  } catch (error) {
    const timedOut = error?.name === "TimeoutError" || error?.name === "AbortError";
    throw new AppError(503, timedOut ? "MALWARE_SCAN_TIMEOUT" : "MALWARE_SCAN_UNAVAILABLE",
      timedOut ? "Scanarea Cloudmersive a depășit timpul permis." : "Serviciul Cloudmersive nu este disponibil.");
  }

  if (!response.ok) {
    console.error("Cloudmersive scan request failed.", { status: response.status });
    throw new AppError(503, "MALWARE_SCAN_FAILED", "Cloudmersive nu a putut verifica imaginea.");
  }

  let result;
  try { result = await response.json(); }
  catch {
    throw new AppError(503, "MALWARE_SCAN_FAILED", "Cloudmersive a returnat un rezultat invalid.");
  }

  if (result.CleanResult === false) {
    throw new AppError(422, "IMAGE_REJECTED", "Imaginea a fost respinsă de scanarea antivirus.");
  }
  if (result.CleanResult !== true) {
    throw new AppError(503, "MALWARE_SCAN_FAILED", "Cloudmersive nu a confirmat că imaginea este curată.");
  }
  return true;
}

module.exports = { scanBuffer };
