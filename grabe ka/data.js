// === PRE-CREATED ACCOUNTS ===
const users = [
    {
        username: "admin",
        password: "admin123",
        role: "admin"
    },
    {
        username: "staff",
        password: "staff123",
        role: "staff"
    }
];

// === INITIAL SAMPLE INVENTORY (optional) ===
const sampleInventory = [
    { id: 1, name: "Milk", quantity: 3, expiry: "2025-01-10" },
    { id: 2, name: "Eggs", quantity: 12, expiry: "2024-12-20" },
    { id: 3, name: "Paracetamol", quantity: 5, expiry: "2026-03-15" }
];

// Save only if first time
if (!localStorage.getItem("inventory")) {
    localStorage.setItem("inventory", JSON.stringify(sampleInventory));
}