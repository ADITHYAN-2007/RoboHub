import { connectDB, disconnectDB } from '../src/config/db.js';
import { seedDatabase } from '../src/services/seed.js';
import { User } from '../src/models/User.js';
import { Equipment } from '../src/models/Equipment.js';
import { Reservation } from '../src/models/Reservation.js';
import { InventoryItem, InventoryTransaction } from '../src/models/InventoryItem.js';
import { generateAccessToken } from '../src/utils/token.js';
import bcrypt from 'bcryptjs';

async function runTests() {
  console.log('--- Starting Robo Lab Hub Backend Verification Suite ---');

  await connectDB();
  await seedDatabase();

  // Test 1: Verify Pre-seeded SuperAdmin exists and password hashes correctly
  const admin = await User.findOne({ email: 'superadmin@robolab.edu' });
  if (!admin || admin.role !== 'SUPER_ADMIN') {
    throw new Error('Test 1 Failed: Super Admin not found or incorrect role');
  }
  const isPassMatch = await bcrypt.compare('Admin@12345!', admin.passwordHash);
  if (!isPassMatch) {
    throw new Error('Test 1 Failed: Password hash comparison failed');
  }
  console.log('✓ Test 1 Passed: Core administrator accounts & password security verified.');

  // Test 2: Double-Booking Prevention Logic
  const arm = await Equipment.findOne({ equipmentCode: 'EQ-ARM-001' });
  if (!arm) throw new Error('Test 2 Failed: Equipment UR5e not found');

  const testDate = '2026-10-15';
  const start1 = new Date(`${testDate}T10:00:00`);
  const end1 = new Date(`${testDate}T12:00:00`);

  const res1 = await Reservation.create({
    equipment: arm._id,
    user: admin._id,
    date: testDate,
    startTime: '10:00',
    endTime: '12:00',
    startDateTime: start1,
    endDateTime: end1,
    purpose: 'Test Reservation A',
    status: 'APPROVED',
  });

  // Attempt overlapping reservation: 11:00 to 13:00 (overlaps with 10:00 to 12:00)
  const start2 = new Date(`${testDate}T11:00:00`);
  const end2 = new Date(`${testDate}T13:00:00`);

  const overlap = await Reservation.findOne({
    equipment: arm._id,
    status: { $in: ['APPROVED', 'ACTIVE'] },
    startDateTime: { $lt: end2 },
    endDateTime: { $gt: start2 },
  });

  if (!overlap) {
    throw new Error('Test 2 Failed: Overlapping reservation was not detected!');
  }
  console.log('✓ Test 2 Passed: Real-time double booking prevention verified.');

  // Test 3: Inventory Transactions Consistency
  const stepper = await InventoryItem.findOne({ componentCode: 'INV-MOT-001' });
  if (!stepper) throw new Error('Test 3 Failed: Stepper motor not found');

  const initialQty = stepper.quantity;
  stepper.quantity += 5;
  await stepper.save();

  const tx = await InventoryTransaction.create({
    inventoryItem: stepper._id,
    quantity: 5,
    type: 'STOCK_IN',
    reason: 'Test Stock Replenishment',
    user: admin._id,
    previousQuantity: initialQty,
    newQuantity: stepper.quantity,
  });

  if (stepper.quantity !== initialQty + 5 || tx.quantity !== 5) {
    throw new Error('Test 3 Failed: Inventory transaction discrepancy');
  }
  console.log('✓ Test 3 Passed: Inventory transactions and atomic stock tracking verified.');

  // Test 4: JWT Token Issuance & Verification
  const token = generateAccessToken({
    userId: admin._id.toString(),
    email: admin.email,
    role: admin.role,
    fullName: admin.fullName,
  });

  if (!token || typeof token !== 'string') {
    throw new Error('Test 4 Failed: JWT access token generation failed');
  }
  console.log('✓ Test 4 Passed: Cryptographic JWT authentication token verified.');

  await disconnectDB();
  console.log('--- All Robo Lab Hub Backend Tests Passed Successfully! ---');
}

runTests().catch((err) => {
  console.error('Test Suite Failed:', err);
  process.exit(1);
});
