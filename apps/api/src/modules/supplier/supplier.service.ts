import { forwardRef, HttpStatus, Inject, Injectable } from "@nestjs/common";
import type { Schema } from "@farmery/contract";
import { Clock } from "../../core/clock";
import { ProblemException } from "../../core/problem";
import { vnClock } from "../../core/vn-time";
import { IdentityService } from "../identity/identity.service";
import { OperationsService } from "../operations/operations.service";
import {
  SupplierRepository,
  type Certification,
  type CertificationRecord,
  type SellerCertification,
  type SupplierProfile,
} from "./supplier.repository";

@Injectable()
export class SupplierService {
  constructor(
    private readonly supplierRepo: SupplierRepository,
    private readonly identity: IdentityService,
    private readonly clock: Clock,
    @Inject(forwardRef(() => OperationsService))
    private readonly operations: OperationsService,
  ) {}

  private today(): string {
    return vnClock(this.clock.now()).date;
  }

  /** Còn hiệu lực = đã duyệt và chưa qua ngày hết hiệu lực (FR3.3). */
  private toSeller(record: CertificationRecord): SellerCertification {
    const { id, type, certificateNumber, issuingAuthority, issuedDate, expiryDate, status, rejectReason, createdAt } = record;
    const valid = status === "approved" && expiryDate >= this.today();
    return { id, type, certificateNumber, issuingAuthority, issuedDate, expiryDate, status, rejectReason, createdAt, valid };
  }

  private toPublic(record: CertificationRecord): Certification {
    const { type, certificateNumber, issuingAuthority, issuedDate, expiryDate, valid } = this.toSeller(record);
    return { type, certificateNumber, issuingAuthority, issuedDate, expiryDate, valid };
  }

  async getSupplierProfile(id: string): Promise<SupplierProfile> {
    const profile = await this.supplierRepo.findById(id);
    if (!profile) {
      throw new ProblemException(HttpStatus.NOT_FOUND, "NOT_FOUND", `Không tìm thấy nhà cung cấp với ID: ${id}`);
    }
    return { ...profile, certifications: await this.getSupplierCertifications(id) };
  }

  /** Chứng nhận công khai: chỉ bản đã duyệt. */
  async getSupplierCertifications(id: string): Promise<Certification[]> {
    const records = await this.supplierRepo.listCertifications(id);
    return records.filter((c) => c.status === "approved").map((c) => this.toPublic(c));
  }

  async requireSupplierId(userId: string | undefined): Promise<string> {
    const supplierId = userId ? await this.identity.supplierIdOf(userId) : null;
    if (!supplierId) {
      throw new ProblemException(HttpStatus.FORBIDDEN, "FORBIDDEN_ROLE", "Tài khoản không gắn với nhà cung cấp nào.");
    }
    return supplierId;
  }

  async listSellerCertifications(userId: string | undefined): Promise<SellerCertification[]> {
    const supplierId = await this.requireSupplierId(userId);
    const records = await this.supplierRepo.listCertifications(supplierId);
    return records.sort((a, b) => b.createdAt.localeCompare(a.createdAt)).map((c) => this.toSeller(c));
  }

  async createCertification(
    userId: string | undefined,
    input: Schema<"CertificationInput">,
  ): Promise<SellerCertification> {
    const supplierId = await this.requireSupplierId(userId);
    if (input.expiryDate <= input.issuedDate) {
      throw new ProblemException(
        HttpStatus.UNPROCESSABLE_ENTITY,
        "VALIDATION_FAILED",
        "Ngày hết hiệu lực phải sau ngày cấp.",
      );
    }
    if (input.issuedDate > this.today()) {
      throw new ProblemException(HttpStatus.UNPROCESSABLE_ENTITY, "VALIDATION_FAILED", "Ngày cấp không được ở tương lai.");
    }
    const created = await this.supplierRepo.addCertification({
      supplierId,
      type: input.type,
      certificateNumber: input.certificateNumber.trim(),
      issuingAuthority: input.issuingAuthority.trim(),
      issuedDate: input.issuedDate,
      expiryDate: input.expiryDate,
      status: "pending_review",
      rejectReason: null,
      createdAt: this.clock.now().toISOString(),
      documentUrl: input.documentId ? `http://localhost:4000/api/media/${input.documentId}` : null,
    });
    const profile = await this.supplierRepo.findById(supplierId);
    await this.operations.createReviewTask(
      "certification",
      created.id,
      `Chứng nhận ${input.type} — ${profile?.displayName ?? "nhà cung cấp"}`,
    );
    return this.toSeller(created);
  }

  /** Dữ liệu cho màn duyệt chứng nhận (ReviewTaskDetail.certification). */
  async getCertificationReview(id: string): Promise<NonNullable<Schema<"ReviewTaskDetail">["certification"]> | null> {
    const record = await this.supplierRepo.findCertification(id);
    if (!record) return null;
    const profile = await this.supplierRepo.findById(record.supplierId);
    if (!profile) return null;
    return {
      supplier: { id: profile.id, displayName: profile.displayName, growingRegion: profile.growingRegion },
      certification: this.toPublic(record),
      documentUrl: record.documentUrl,
    };
  }

  async decideCertification(id: string, approved: boolean, reason?: string): Promise<void> {
    await this.supplierRepo.updateCertification(id, {
      status: approved ? "approved" : "rejected",
      rejectReason: approved ? null : (reason ?? null),
    });
  }
}
