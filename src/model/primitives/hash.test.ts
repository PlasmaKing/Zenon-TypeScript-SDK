import { assertEquals, assertThrows } from "@std/assert";
import { emptyHash, Hash } from "./hash.ts";

Deno.test("Hash Class Tests", async (t) => {
  const ZEROS_64 = "0".repeat(64);
  const TEST_HEX_1 = ZEROS_64.slice(0, -1) + "1";
  const TEST_HEX_2 = ZEROS_64.slice(0, -1) + "2";

  await t.step("Creation and Constants", async (t) => {
    await t.step("emptyHash has correct value", () => {
      assertEquals(emptyHash.toString(), ZEROS_64);
      assertEquals(emptyHash.getBytes(), new Uint8Array(32));
    });

    await t.step("Hash.parse() handles valid and invalid hex", () => {
      assertEquals(Hash.parse(TEST_HEX_1).toString(), TEST_HEX_1);
      assertEquals(Hash.parse("0x" + TEST_HEX_1).toString(), TEST_HEX_1);
      assertThrows(() => Hash.parse("1234"), Error, "expected 32 bytes");
      assertThrows(() => Hash.parse(ZEROS_64.slice(0, -1) + "g"));
    });

    await t.step("Hash.fromBytes() handles valid and invalid bytes", () => {
      const bytes = new Uint8Array(32);
      bytes[31] = 1;
      assertEquals(Hash.fromBytes(bytes).getBytes(), bytes);
      assertThrows(
        () => Hash.fromBytes(new Uint8Array(33)),
        Error,
        "expected 32 bytes",
      );
    });

    await t.step("Hash.digest() produces correct hash", async () => {
      const expected =
        "3338be694f50c5f338814986cdf0686453a888b84f424d792af4b9202398f392";
      const data = new TextEncoder().encode("hello");
      assertEquals((await Hash.digest(data)).toString(), expected);
    });
  });

  await t.step("Instance Methods", async (t) => {
    const h1 = Hash.parse(TEST_HEX_1);
    const h1_copy = Hash.parse(TEST_HEX_1);
    const h2 = Hash.parse(TEST_HEX_2);

    await t.step(".getBytes() returns an immutable copy", () => {
      const originalBytes = h1.getBytes();
      const copy = h1.getBytes();
      copy[0] = 99;
      assertEquals(h1.getBytes(), originalBytes);
    });

    await t.step(".toString() and .toShortString() format correctly", () => {
      assertEquals(h1.toString(), TEST_HEX_1);
      assertEquals(h1.toShortString(), "000000...000001");
    });

    await t.step(".equals() compares correctly", () => {
      assertEquals(h1.equals(h1_copy), true);
      assertEquals(h1.equals(h2), false);
      assertEquals(h1.equals(null as unknown as Hash), false);
    });

    await t.step(".compareTo() sorts correctly", () => {
      assertEquals(h1.compareTo(h1_copy), 0);
      assertEquals(h1.compareTo(h2), -1);
      assertEquals(h2.compareTo(h1), 1);
    });

    await t.step(".toJSON() serializes to a hex string", () => {
      assertEquals(JSON.stringify({ hash: h1 }), `{"hash":"${TEST_HEX_1}"}`);
    });
  });
});
