/* eslint-disable @typescript-eslint/no-explicit-any */
import { Inject, Injectable } from "@nestjs/common";
import { PRISMA_CLIENT, type PrismaClient } from "../../core/prisma";
import {
  SupplierRepository,
  type CertificationRecord,
  type SupplierProfile,
} from "./supplier.repository";

function toProfile(row: any): SupplierProfile {
  return {
    id: row.id.toString(),
    displayName: row.displayName,
    description: row.description ?? "",
    growingRegion: row.growingRegion,
    certifications: (row.certifications || []).map((c: any) => ({
      type: c.type,
      certificateNumber: c.certificateNumber,
      issuingAuthority: c.issuingAuthority,
      issuedDate: c.issuedDate instanceof Date ? c.issuedDate.toISOString().slice(0, 10) : String(c.issuedDate),
      expiryDate: c.expiryDate instanceof Date ? c.expiryDate.toISOString().slice(0, 10) : String(c.expiryDate),
      valid: c.approvalStatus === "approved",
    })),
    products: [],
  };
}

function toCertRecord(c: any): CertificationRecord {
  return {
    id: c.id.toString(),
    supplierId: c.supplierId.toString(),
    type: c.type,
    certificateNumber: c.certificateNumber,
    issuingAuthority: c.issuingAuthority,
    issuedDate: c.issuedDate instanceof Date ? c.issuedDate.toISOString().slice(0, 10) : String(c.issuedDate),
    expiryDate: c.expiryDate instanceof Date ? c.expiryDate.toISOString().slice(0, 10) : String(c.expiryDate),
    status: c.approvalStatus,
    rejectReason: c.approvalStatus === "rejected" ? "Chứng nhận không đạt yêu cầu kiểm định." : null,
    createdAt: c.reviewedAt instanceof Date ? c.reviewedAt.toISOString() : new Date().toISOString(),
    documentUrl: c.evidenceFileId ? `http://localhost:4000/api/media/${c.evidenceFileId}` : null,
  };
}

@Injectable()
export class PrismaSupplierRepository extends SupplierRepository {
  constructor(@Inject(PRISMA_CLIENT) private readonly prisma: PrismaClient) {
    super();
  }

  async findById(id: string): Promise<SupplierProfile | null> {
    try {
      const row = await this.prisma.supplier.findUnique({
        where: { id: BigInt(id) },
        include: { certifications: true },
      });
      return row ? toProfile(row) : null;
    } catch {
      return null;
    }
  }

  async list(): Promise<SupplierProfile[]> {
    try {
      const rows = await this.prisma.supplier.findMany({
        where: { status: "active" },
        include: { certifications: true },
        orderBy: { id: "asc" },
      });
      return rows.map(toProfile);
    } catch {
      return [];
    }
  }

  async listCertifications(supplierId: string): Promise<CertificationRecord[]> {
    try {
      const rows = await this.prisma.certification.findMany({
        where: { supplierId: BigInt(supplierId) },
        orderBy: { id: "desc" },
      });
      return rows.map(toCertRecord);
    } catch {
      return [];
    }
  }

  async findCertification(id: string): Promise<CertificationRecord | null> {
    try {
      const row = await this.prisma.certification.findUnique({
        where: { id: BigInt(id) },
      });
      return row ? toCertRecord(row) : null;
    } catch {
      return null;
    }
  }

  async addCertification(record: Omit<CertificationRecord, "id">): Promise<CertificationRecord> {
    const created = await this.prisma.certification.create({
      data: {
        supplierId: BigInt(record.supplierId),
        type: record.type as any,
        certificateNumber: record.certificateNumber,
        issuingAuthority: record.issuingAuthority,
        evidenceFileId: BigInt(1),
        issuedDate: new Date(record.issuedDate),
        expiryDate: new Date(record.expiryDate),
        approvalStatus: (record.status ?? "pending") as any,
      },
    });
    return toCertRecord(created);
  }

  async updateCertification(id: string, patch: Partial<CertificationRecord>): Promise<CertificationRecord | null> {
    try {
      const data: any = {};
      if (patch.status !== undefined) data.approvalStatus = patch.status;
      if (patch.certificateNumber !== undefined) data.certificateNumber = patch.certificateNumber;
      if (patch.issuingAuthority !== undefined) data.issuingAuthority = patch.issuingAuthority;

      const updated = await this.prisma.certification.update({
        where: { id: BigInt(id) },
        data,
      });
      return toCertRecord(updated);
    } catch {
      return null;
    }
  }
}
