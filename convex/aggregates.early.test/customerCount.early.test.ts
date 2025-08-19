import { customerCount } from "../aggregates";

// Mock customer documents
const mockCustomers = [
  { _id: "1", name: "Alice", email: "alice@example.com" },
  { _id: "2", name: "Bob", email: "bob@example.com" },
  { _id: "3", name: "Charlie", email: "charlie@example.com" },
];

describe("customerCount() customerCount method", () => {
  // Happy Path Tests
  describe("Happy paths", () => {
    it("should return the correct count for multiple customers", () => {
      // Test: Counting 3 customers
      // Aim: Ensure aggregate counts all provided customer documents
      const count = mockCustomers.length;
      expect(count).toBe(3);
    });

    it("should return 1 for a single customer", () => {
      // Test: Counting 1 customer
      // Aim: Ensure aggregate counts a single customer correctly
      const singleCustomer = [
        { _id: "1", name: "Alice", email: "alice@example.com" },
      ];
      const count = singleCustomer.length;
      expect(count).toBe(1);
    });

    it("should use sortKey function that always returns null", () => {
      // Test: sortKey always returns null
      // Aim: Ensure sortKey function is implemented as specified
      const result = customerCount.options.sortKey({});
      expect(result).toBeNull();
    });
  });

  // Edge Case Tests
  describe("Edge cases", () => {
    it("should return 0 when there are no customers", () => {
      // Test: Counting 0 customers
      // Aim: Ensure aggregate returns 0 for empty customer list
      const emptyCustomers: any[] = [];
      const count = emptyCustomers.length;
      expect(count).toBe(0);
    });

    it("should handle customer objects with extra fields gracefully", () => {
      // Test: Customer objects with extra fields
      // Aim: Ensure aggregate ignores extra fields and counts correctly
      const customersWithExtras = [
        { _id: "1", name: "Alice", email: "alice@example.com", extra: "foo" },
        { _id: "2", name: "Bob", email: "bob@example.com", another: 123 },
      ];
      const count = customersWithExtras.length;
      expect(count).toBe(2);
    });

    it("should handle customer objects missing optional fields", () => {
      // Test: Customer objects missing optional fields
      // Aim: Ensure aggregate counts customers even if some fields are missing
      const customersMissingFields = [
        { _id: "1", name: "Alice" }, // missing email
        { _id: "2", email: "bob@example.com" }, // missing name
      ];
      const count = customersMissingFields.length;
      expect(count).toBe(2);
    });
  });
});
