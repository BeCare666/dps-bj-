import { Injectable } from "@nestjs/common";
import { v2 as cloudinary } from "cloudinary";

export interface ResultatUploadCloudinary {
  url: string;
  cloudinaryId: string;
}

@Injectable()
export class CloudinaryService {
  constructor() {
    cloudinary.config({
      cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
      api_key: process.env.CLOUDINARY_API_KEY,
      api_secret: process.env.CLOUDINARY_API_SECRET,
    });
  }

  // 8.13 — pièces jointes EI par défaut. Un dossier par usage pour retrouver et
  // nettoyer facilement les uploads (formations, évaluations externes...).
  async uploadBuffer(
    buffer: Buffer,
    mimeType: string,
    nomFichier: string,
    dossier = "dps-bj/evenements-indesirables",
  ): Promise<ResultatUploadCloudinary> {
    const dataUri = `data:${mimeType};base64,${buffer.toString("base64")}`;
    const resultat = await cloudinary.uploader.upload(dataUri, {
      folder: dossier,
      resource_type: "auto",
      filename_override: nomFichier,
      use_filename: true,
      unique_filename: true,
    });
    return { url: resultat.secure_url, cloudinaryId: resultat.public_id };
  }

  async supprimer(cloudinaryId: string): Promise<void> {
    await cloudinary.uploader.destroy(cloudinaryId);
  }
}
