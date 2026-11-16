import type { Schema } from "@farmery/contract";

export type Address = Schema<"Address">;
export type AddressInput = Schema<"AddressInput">;

export abstract class AddressRepository {
  abstract findByUserId(userId: string): Promise<Address[]>;
  abstract findOne(userId: string, addressId: string): Promise<Address | null>;
  /** Địa chỉ đầu tiên của người dùng tự thành mặc định; `isDefault: true` bỏ mặc định của địa chỉ cũ. */
  abstract create(userId: string, input: AddressInput): Promise<Address>;
}
