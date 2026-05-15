import pkg from "xlsx";
const { readFile, utils } = pkg;
import { writeFile, readFile as fsReadFile, mkdir } from "fs/promises";
import { existsSync } from "fs";
import type { Contact } from "../types.js";

export class FileService {
  static async parseExcelFile(filePath: string): Promise<Contact[]> {
    try {
      console.log(`Parsing Excel file: ${filePath}`);

      if (!existsSync(filePath)) {
        throw new Error("File does not exist");
      }

      const workbook = readFile(filePath);
      const sheetName = workbook.SheetNames[0];

      if (!sheetName) {
        throw new Error("No sheets found in Excel file");
      }

      const worksheet = workbook.Sheets[sheetName];

      // Convert to JSON with header option (raw 2D array)
      const data = utils.sheet_to_json(worksheet, {
        header: 1,
        defval: "",
      }) as any[][];

      if (data.length < 1) {
        throw new Error("Excel file is empty");
      }

      // SMART HEADER DETECTION
      let headerRowIndex = -1;
      let emailColumnIndex = -1;
      const potentialHeaderKeywords = ["email", "e-mail", "mail", "assigned to", "recipient", "to", "contact"];

      for (let i = 0; i < Math.min(data.length, 50); i++) {
        const row = data[i];
        if (!row || !Array.isArray(row)) continue;

        const index = row.findIndex(
          (cell) =>
            cell &&
            typeof cell === "string" &&
            potentialHeaderKeywords.some(keyword => cell.toLowerCase().includes(keyword))
        );

        if (index !== -1) {
          headerRowIndex = i;
          emailColumnIndex = index;
          break;
        }
      }

      if (headerRowIndex === -1) {
        const firstRow = data[0] || [];
        throw new Error(
          `No "Email" or recipient column found. Columns detected in first row: ${JSON.stringify(firstRow)}. Please ensure your Excel file has a column named "Email".`
        );
      }

      const headers = data[headerRowIndex];
      console.log(`✅ Found headers at row ${headerRowIndex + 1}:`, headers);

      // Convert data rows to contact objects
      const contacts: Contact[] = [];

      for (let i = headerRowIndex + 1; i < data.length; i++) {
        const row = data[i];
        if (!row || row.length === 0) continue;

        const isRowEmpty = row.every(cell => !cell || String(cell).trim() === "");
        if (isRowEmpty) continue;

        const contact: Contact = {
          Email: "",
        };

        headers.forEach((header: any, index: number) => {
          if (header && typeof header === "string" && header.trim() !== "") {
            const cleanHeader = header.trim();
            const value = row[index] !== undefined ? String(row[index]).trim() : "";
            const lowerHeader = cleanHeader.toLowerCase();

            // Prioritize Email
            if (lowerHeader.includes("email") || lowerHeader === "e-mail" || lowerHeader === "mail") {
              contact.Email = value;
            } else if (lowerHeader.includes("assigned to") || lowerHeader === "recipient" || lowerHeader === "to") {
              // Only use as email if we don't have one yet
              if (!contact.Email) contact.Email = value;
            } else if (
              lowerHeader.includes("firstname") ||
              lowerHeader.includes("first_name") ||
              lowerHeader === "first" ||
              lowerHeader === "name"
            ) {
              contact.FirstName = value;
            } else if (
              lowerHeader.includes("lastname") ||
              lowerHeader.includes("last_name") ||
              lowerHeader === "last"
            ) {
              contact.LastName = value;
            } else if (lowerHeader.includes("company")) {
              contact.Company = value;
            } else if (lowerHeader.includes("subject")) {
              contact.Subject = value;
            } else {
              contact[cleanHeader] = value;
            }
          }
        });

        if (contact.Email && this.isValidEmail(contact.Email)) {
          contacts.push(contact);
        }
      }

      console.log(`Successfully parsed ${contacts.length} valid contacts`);

      if (contacts.length === 0) {
        throw new Error(`No valid email addresses found. Columns were: ${JSON.stringify(headers)}. Check if your data row contains valid emails.`);
      }

      return contacts;
    } catch (error) {
      console.error("Excel parsing error:", error);
      throw new Error(error instanceof Error ? error.message : "Failed to parse Excel file");
    }
  }

  static async saveUploadedFile(
    file: Uint8Array,
    filename: string
  ): Promise<string> {
    try {
      const uploadDir = "./uploads";
      if (!existsSync(uploadDir)) {
        await mkdir(uploadDir, { recursive: true });
      }

      const uploadPath = `${uploadDir}/${filename}`;
      await writeFile(uploadPath, file);
      return uploadPath;
    } catch (error) {
      throw new Error(`Failed to save uploaded file`);
    }
  }

  static async readHTMLTemplate(filePath: string): Promise<string> {
    try {
      if (!existsSync(filePath)) throw new Error("HTML template file does not exist");
      return await fsReadFile(filePath, "utf-8");
    } catch (error) {
      throw new Error(`Failed to read HTML template`);
    }
  }

  static isValidEmail(email: string): boolean {
    if (!email || typeof email !== "string") return false;
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email.trim());
  }

  static replacePlaceholders(template: string, contact: Contact): string {
    if (!template || !contact) return template || "";
    let result = template;
    result = result.replace(/\{\{FirstName\}\}/g, contact.FirstName || "");
    result = result.replace(/\{\{LastName\}\}/g, contact.LastName || "");
    result = result.replace(/\{\{Company\}\}/g, contact.Company || "");
    result = result.replace(/\{\{Email\}\}/g, contact.Email || "");
    result = result.replace(/\{\{Subject\}\}/g, contact.Subject || "");

    Object.keys(contact).forEach((key) => {
      if (!["Email", "FirstName", "LastName", "Company", "Subject"].includes(key)) {
        const placeholder = new RegExp(`\\{\\{${key}\\}\\}`, "g");
        result = result.replace(placeholder, String(contact[key] || ""));
      }
    });
    return result;
  }
}
