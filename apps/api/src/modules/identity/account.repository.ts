import type { Schema } from "@farmery/contract";

export type RoleCode = Schema<"RoleCode">;

export interface Account {
  id: string;
  /** Email đầu tiên là email hiển thị; các email sau là bí danh cùng đăng nhập vào tài khoản này. */
  emails: string[];
  displayName: string;
  phone: string | null;
  roles: RoleCode[];
  supplierId: string | null;
  /** FR7.1: đã từng từ chối nhận hàng COD thì không được chọn COD nữa. */
  refusedCod: boolean;
  totpSecretEnc?: string | null;
}

export abstract class AccountRepository {
  abstract findByEmail(email: string): Promise<Account | null>;
  abstract findById(id: string): Promise<Account | null>;
  abstract register(email: string, displayName: string, verifiedAt: Date): Promise<Account | null>;
  abstract enableTotp(id: string, encryptedSecret: string, step: bigint): Promise<boolean>;
  abstract consumeTotp(id: string, step: bigint): Promise<boolean>;
}
