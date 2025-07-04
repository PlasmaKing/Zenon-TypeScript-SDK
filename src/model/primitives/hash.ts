/**
 * Hash utilities for 32-byte SHA3-256 digests.
 *
 * This module exposes the {@link Hash} value object for representing an
 * immutable 256-bit hash as well as helpers to compute or parse hashes.
 */
import { crypto } from "@std/crypto";
import { decodeHex, encodeHex } from "@std/encoding";

/**
 * An immutable 32-byte (256-bit) hash value.
 *
 * Instances can be created in several ways:
 *  • {@link Hash.fromBytes} – from a raw 32-byte buffer.
 *  • {@link Hash.parse}     – from a hexadecimal string.
 *  • {@link Hash.digest}    – by hashing arbitrary data.
 *
 * The internal bytes are *never* exposed mutably.
 */
export class Hash {
  /** Number of bytes in a {@link Hash}. */
  public static readonly LENGTH: number = 32;
  private readonly hash: Uint8Array;

  private constructor(hash: Uint8Array) {
    if (hash.length !== Hash.LENGTH) {
      throw new Error(
        `Hash validation failed: expected ${Hash.LENGTH} bytes, but got ${hash.length}.`,
      );
    }
    this.hash = new Uint8Array(hash);
  }

  /**
   * Construct a {@link Hash} from a 32-byte buffer.
   *
   * @param bytes A 32-byte `Uint8Array`. The buffer is copied – mutating the
   *              original array will **not** affect the created {@link Hash}.
   * @throws {Error} If `bytes.length !== Hash.LENGTH`.
   */
  public static fromBytes(bytes: Uint8Array): Hash {
    return new Hash(bytes);
  }

  /**
   * Parse a 64-character hexadecimal string into a {@link Hash}.
   * The string may optionally be prefixed with `0x`.
   *
   * @param hex The hexadecimal representation.
   * @throws {Error} If the string is not valid hex or has the wrong length.
   */
  public static parse(hex: string): Hash {
    const cleanHex = hex.startsWith("0x") ? hex.slice(2) : hex;
    const bytes = decodeHex(cleanHex);
    return new Hash(bytes);
  }

  /**
   * Compute the SHA3-256 digest of arbitrary data.
   *
   * @example
   * ```ts
   * const digest = await Hash.digest(new TextEncoder().encode("hello"));
   * console.log(digest.toString());
   * ```
   *
   * @param data Data to hash.
   * @returns A new {@link Hash} containing the digest.
   */
  public static async digest(data: Uint8Array): Promise<Hash> {
    const arrayBuffer = await crypto.subtle.digest("SHA3-256", data);
    return new Hash(new Uint8Array(arrayBuffer));
  }

  /**
   * @returns A new `Uint8Array` of length {@link Hash.LENGTH}.
   */
  public getBytes(): Uint8Array {
    return new Uint8Array(this.hash);
  }

  /**
   * Return the lowercase hexadecimal representation of this hash (no `0x`).
   */
  public toString(): string {
    return encodeHex(this.hash);
  }

  /**
   * Abbreviated representation – first 6 + last 6 hex characters separated
   * by an ellipsis (e.g. `deadbe…beef42`). Useful for logs and UIs.
   */
  public toShortString(): string {
    const hex = this.toString();
    return `${hex.substring(0, 6)}...${hex.substring(hex.length - 6)}`;
  }

  /**
   * Lexicographically compare two hashes without allocations.
   *
   * @param other The hash to compare against.
   * @returns `-1` if *this* < *other*, `1` if *this* > *other*, `0` if equal.
   */
  public compareTo(other: Hash): number {
    for (let i = 0; i < Hash.LENGTH; i++) {
      const a = this.hash[i];
      const b = other.hash[i];
      if (a !== b) {
        return a < b ? -1 : 1;
      }
    }
    return 0;
  }

  /**
   * Constant-time equality check.
   *
   * @param other The hash to compare against.
   * @returns `true` if the two hashes are identical.
   */
  public equals(other: Hash | null): boolean {
    if (!other) {
      return false;
    }

    let diff = 0;
    for (let i = 0; i < Hash.LENGTH; i++) {
      diff |= this.hash[i] ^ other.hash[i];
    }
    return diff === 0;
  }

  /**
   * Custom JSON serialization – returns the same value as {@link toString} so
   * that `JSON.stringify()` embeds hashes as plain hex strings.
   */
  public toJSON(): string {
    return this.toString();
  }
}

/**
 * The all-zero hash (`0x00…00`).
 */
export const emptyHash = Hash.parse(
  "0000000000000000000000000000000000000000000000000000000000000000",
);
