// DigiLocker provider abstraction — mock today, real issuer API later.
// Never stores real Aadhaar numbers; only last-4 + verificationId.

export type DigiLockerDoc = {
  type: "ID_PROOF" | "ADDRESS_PROOF" | "PHOTO";
  fileName: string;
  mimeType: string;
  dataUrl: string;
  verificationId: string;
};

export type DigiLockerProvider = {
  pullDocuments(aadhaarLast4: string): Promise<DigiLockerDoc[]>;
};

export const mockDigiLockerProvider: DigiLockerProvider = {
  async pullDocuments(aadhaarLast4) {
    // Simulate network latency + issuer response
    await new Promise((r) => setTimeout(r, 900));
    if (!/^\d{4}$/.test(aadhaarLast4)) throw new Error("Enter last 4 digits of Aadhaar");
    const stamp = Date.now().toString(36);
    return [
      {
        type: "ID_PROOF",
        fileName: `aadhaar-${aadhaarLast4}.pdf`,
        mimeType: "application/pdf",
        dataUrl: `data:application/pdf;base64,JVBERi0xLjQKMSAwIG9iago8PC9UeXBlL0NhdGFsb2cvUGFnZXMgMiAwIFI+PgplbmRvYmoKMiAwIG9iago8PC9UeXBlL1BhZ2VzL0tpZHNbMyAwIFJdL0NvdW50IDE+PgplbmRvYmoKMyAwIG9iago8PC9UeXBlL1BhZ2UvUGFyZW50IDIgMCBSL01lZGlhQm94WzAgMCA2MTIgNzkyXT4+CmVuZG9iagp4cmVmCjAgNAowMDAwMDAwMDAwIDY1NTM1IGYgCjAwMDAwMDAwMDEwIDAwMDAwIG4gCjAwMDAwMDAwMDYyIDAwMDAwIG4gCjAwMDAwMDAwMTE3IDAwMDAwIG4gCnRyYWlsZXI8PC9TaXplIDQvUm9vdCAxIDAgUj4+CnN0YXJ0eHJlZgoxOTAKJSVFT0Y=`,
        verificationId: `DL-MOCK-${aadhaarLast4}-${stamp}`,
      },
      {
        type: "ADDRESS_PROOF",
        fileName: `address-${aadhaarLast4}.pdf`,
        mimeType: "application/pdf",
        dataUrl: `data:application/pdf;base64,JVBERi0xLjQKMSAwIG9iago8PC9UeXBlL0NhdGFsb2cvUGFnZXMgMiAwIFI+PgplbmRvYmoKMiAwIG9iago8PC9UeXBlL1BhZ2VzL0tpZHNbMyAwIFJdL0NvdW50IDE+PgplbmRvYmoKMyAwIG9iago8PC9UeXBlL1BhZ2UvUGFyZW50IDIgMCBSL01lZGlhQm94WzAgMCA2MTIgNzkyXT4+CmVuZG9iagp4cmVmCjAgNAowMDAwMDAwMDAwIDY1NTM1IGYgCjAwMDAwMDAwMDEwIDAwMDAwIG4gCjAwMDAwMDAwMDYyIDAwMDAwIG4gCjAwMDAwMDAwMTE3IDAwMDAwIG4gCnRyYWlsZXI8PC9TaXplIDQvUm9vdCAxIDAgUj4+CnN0YXJ0eHJlZgoxOTAKJSVFT0Y=`,
        verificationId: `DL-MOCK-${aadhaarLast4}-${stamp}-2`,
      },
      {
        type: "PHOTO",
        fileName: `photo-${aadhaarLast4}.png`,
        mimeType: "image/png",
        dataUrl: `data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==`,
        verificationId: `DL-MOCK-${aadhaarLast4}-${stamp}-3`,
      },
    ];
  },
};

// Swap to real provider when MoU is in place:
// export const realDigiLockerProvider: DigiLockerProvider = { ... issuer API calls ... }
