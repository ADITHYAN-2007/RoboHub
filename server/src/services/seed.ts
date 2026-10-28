import bcrypt from 'bcryptjs';
import QRCode from 'qrcode';
import { User } from '../models/User.js';
import { Laboratory, Room } from '../models/Laboratory.js';
import { Equipment } from '../models/Equipment.js';
import { Reservation } from '../models/Reservation.js';
import { Checkout } from '../models/Checkout.js';
import { InventoryItem, InventoryTransaction, ComponentRequest } from '../models/InventoryItem.js';
import { Maintenance, IssueReport } from '../models/Maintenance.js';
import { Project, ProjectMilestone } from '../models/Project.js';
import { SafetyDocument, SafetyAcknowledgement, SystemSetting } from '../models/SafetyAndAudit.js';

export async function seedDatabase(): Promise<void> {
  const existingUsers = await User.countDocuments();
  if (existingUsers > 0) {
    console.log('[Seed] Database already contains records. Skipping seed.');
    return;
  }

  console.log('[Seed] Seeding realistic robotics university laboratory database...');

  const salt = await bcrypt.genSalt(10);
  const adminPasswordHash = await bcrypt.hash('Admin@12345!', salt);
  const facultyPasswordHash = await bcrypt.hash('Faculty@12345!', salt);
  const techPasswordHash = await bcrypt.hash('Tech@12345!', salt);
  const studentPasswordHash = await bcrypt.hash('Student@12345!', salt);

  // 1. Create Core Users
  const superAdmin = await User.create({
    fullName: 'Dr. Evelyn Vance',
    email: 'superadmin@robolab.edu',
    collegeId: 'FAC-DIR-001',
    passwordHash: adminPasswordHash,
    role: 'SUPER_ADMIN',
    department: 'Robotics & Autonomous Systems',
    year: 'Faculty Director',
    phone: '+1 (555) 019-2831',
    isVerified: true,
    isActive: true,
  });

  const labAdmin = await User.create({
    fullName: 'Marcus Sterling',
    email: 'labadmin@robolab.edu',
    collegeId: 'ADM-ROBO-002',
    passwordHash: adminPasswordHash,
    role: 'LAB_ADMIN',
    department: 'School of Engineering',
    year: 'Lab Manager',
    phone: '+1 (555) 019-4422',
    isVerified: true,
    isActive: true,
  });

  const faculty = await User.create({
    fullName: 'Prof. Anita Sharma',
    email: 'prof.sharma@robolab.edu',
    collegeId: 'FAC-ROBO-104',
    passwordHash: facultyPasswordHash,
    role: 'FACULTY',
    department: 'Electrical & Computer Engineering',
    year: 'Associate Professor',
    phone: '+1 (555) 019-7788',
    isVerified: true,
    isActive: true,
  });

  const labTech = await User.create({
    fullName: 'Alexander Hayes',
    email: 'tech.alex@robolab.edu',
    collegeId: 'TECH-MECH-015',
    passwordHash: techPasswordHash,
    role: 'LAB_TECHNICIAN',
    department: 'Robotics Engineering',
    year: 'Senior Technician',
    phone: '+1 (555) 019-9911',
    isVerified: true,
    isActive: true,
  });

  const studentMaya = await User.create({
    fullName: 'Maya Lin',
    email: 'student.maya@robolab.edu',
    collegeId: 'STU-2026-8841',
    passwordHash: studentPasswordHash,
    role: 'STUDENT',
    department: 'Robotics & Mechatronics',
    year: '4th Year Senior',
    phone: '+1 (555) 019-3344',
    isVerified: true,
    isActive: true,
  });

  const studentLiam = await User.create({
    fullName: 'Liam Chen',
    email: 'student.liam@robolab.edu',
    collegeId: 'STU-2026-9923',
    passwordHash: studentPasswordHash,
    role: 'STUDENT',
    department: 'Computer Science & AI',
    year: '3rd Year Junior',
    phone: '+1 (555) 019-5566',
    isVerified: true,
    isActive: true,
  });

  // 2. Safety Documents
  const safetyDoc1 = await SafetyDocument.create({
    code: 'RIL-SOP-001',
    title: 'General Robotics Laboratory Protocol & Personal Protective Equipment',
    category: 'General Safety',
    version: '2.1',
    summary: 'Standard operating safety guidelines for all engineering students and researchers.',
    rules: [
      'Safety glasses and closed-toe shoes are mandatory across all laboratory zones.',
      'Tie back long hair and avoid loose clothing or dangling lanyards near rotating machinery.',
      'Always maintain physical clearance outside the yellow perimeter line of active robotic cells.',
      'Emergency stop (E-STOP) push buttons must remain unobstructed at all times.',
    ],
    emergencyProcedures: [
      'In the event of uncontrolled arm motion, hit the nearest emergency E-STOP button immediately.',
      'Report any spark, burning odor, or thermal runaway immediately to technician Alex Hayes.',
      'Eye wash station is located beside Door B-101.',
    ],
    requiredForCategories: ['Robotic Arms', 'CNC', 'Drones', 'Mobile Robots'],
    isActive: true,
  });

  const safetyDoc2 = await SafetyDocument.create({
    code: 'RIL-SOP-002',
    title: 'Lithium Polymer (LiPo) Battery Charging and Safety Standard',
    category: 'Electrical Safety',
    version: '1.4',
    summary: 'Safe handling, balancing, storage, and disposal of high-discharge LiPo battery packs.',
    rules: [
      'All LiPo batteries must be charged inside fireproof charging bags on the designated ceramic bench.',
      'Never leave charging batteries unattended or charge overnight.',
      'Check cell voltage balance before and after flight test runs.',
    ],
    emergencyProcedures: [
      'If battery swells, disconnect charger, use sand bucket located adjacent to charging dock.',
    ],
    requiredForCategories: ['Batteries', 'Drones', 'Mobile Robots'],
    isActive: true,
  });

  // Acknowledge safety for Maya
  await SafetyAcknowledgement.create({
    user: studentMaya._id,
    safetyDocument: safetyDoc1._id,
    version: '2.1',
  });
  studentMaya.safetyAcknowledgedDocs.push(safetyDoc1._id as any);
  await studentMaya.save();

  // 3. Laboratories & Rooms
  const lab1 = await Laboratory.create({
    name: 'Robotics Innovation & Mechatronics Lab',
    code: 'RIL-100',
    building: 'Hall of Engineering Science',
    description: 'Premier university facility for autonomous robotic manipulation, ROS2 research, and kinematics.',
    manager: labAdmin._id,
    status: 'ACTIVE',
  });

  const lab2 = await Laboratory.create({
    name: 'Autonomous Systems & Flight Testing Arena',
    code: 'ASA-200',
    building: 'Robotics Complex Annex',
    description: 'High-ceiling netting arena equipped with optical Vicon motion capture for UAVs and UGVs.',
    manager: labAdmin._id,
    status: 'ACTIVE',
  });

  const room1 = await Room.create({
    roomNumber: 'ENG-101',
    name: 'Robotic Manipulation Workcell',
    building: 'Hall of Engineering Science',
    capacity: 25,
    openingHours: '08:00 AM - 10:00 PM',
    status: 'AVAILABLE',
    laboratory: lab1._id,
  });

  const room2 = await Room.create({
    roomNumber: 'ENG-104',
    name: 'Rapid Mechatronics Prototyping Bay',
    building: 'Hall of Engineering Science',
    capacity: 18,
    openingHours: '08:00 AM - 09:00 PM',
    status: 'AVAILABLE',
    laboratory: lab1._id,
  });

  const room3 = await Room.create({
    roomNumber: 'RC-Arena-A',
    name: 'UAV Flight Arena & Mobile Grid',
    building: 'Robotics Complex Annex',
    capacity: 30,
    openingHours: '07:30 AM - 11:00 PM',
    status: 'AVAILABLE',
    laboratory: lab2._id,
  });

  // 4. Realistic Equipment
  async function generateQR(code: string, tag: string, name: string) {
    return QRCode.toDataURL(JSON.stringify({ code, tag, name }), { width: 250, margin: 1 });
  }

  const armQR = await generateQR('EQ-ARM-001', 'TAG-9021', 'Universal Robots UR5e 6-Axis Arm');
  const eqArm = await Equipment.create({
    equipmentCode: 'EQ-ARM-001',
    assetTag: 'TAG-9021',
    name: 'Universal Robots UR5e 6-Axis Robotic Arm',
    category: 'Robotic Arms',
    manufacturer: 'Universal Robots',
    model: 'UR5e Collaborative',
    serialNumber: 'UR-2025-6610-E',
    description: 'Precision 6-degree-of-freedom robotic arm with 5kg payload, 850mm reach, and force/torque sensor.',
    purchaseCost: 35000,
    purchaseDate: new Date('2024-08-15'),
    warrantyExpiry: new Date('2027-08-15'),
    laboratory: lab1._id,
    room: room1._id,
    status: 'AVAILABLE',
    condition: 'EXCELLENT',
    specifications: {
      Payload: '5 kg (11 lbs)',
      Reach: '850 mm',
      Repeatability: '+/- 0.03 mm',
      DegreesOfFreedom: '6 rotating joints',
      Interface: 'TCP/IP, Modbus, ROS2 Driver',
    },
    image: '/src/assets/images/hero_robotics_arm_1790831579039.jpg',
    maintenanceIntervalDays: 90,
    lastMaintenanceDate: new Date('2026-08-01'),
    nextMaintenanceDate: new Date('2026-11-01'),
    safetyDocumentRequired: safetyDoc1._id,
    qrCodeData: armQR,
    createdBy: superAdmin._id,
  });

  const amrQR = await generateQR('EQ-AMR-002', 'TAG-4819', 'Clearpath Jackal Autonomous Mobile Robot');
  const eqAmr = await Equipment.create({
    equipmentCode: 'EQ-AMR-002',
    assetTag: 'TAG-4819',
    name: 'Clearpath Jackal Autonomous Mobile Robot (AMR)',
    category: 'Mobile Robots',
    manufacturer: 'Clearpath Robotics',
    model: 'Jackal UGV Rev 3',
    serialNumber: 'CP-JK-88231',
    description: 'Compact all-terrain mobile robot platform with onboard Jetson Orin compute, Velodyne LiDAR, and GPS.',
    purchaseCost: 18500,
    purchaseDate: new Date('2025-01-20'),
    warrantyExpiry: new Date('2028-01-20'),
    laboratory: lab2._id,
    room: room3._id,
    status: 'IN_USE',
    condition: 'GOOD',
    specifications: {
      DriveType: '4WD Skid Steer',
      MaxSpeed: '2.0 m/s',
      Sensors: 'Velodyne Puck LiDAR, IMU, Intel D435i',
      Compute: 'NVIDIA Jetson AGX Orin 64GB',
      OperatingSystem: 'Ubuntu 22.04 LTS / ROS2 Humble',
    },
    image: '/src/assets/images/autonomous_mobile_robot_1790831590956.jpg',
    maintenanceIntervalDays: 60,
    safetyDocumentRequired: safetyDoc1._id,
    qrCodeData: amrQR,
    createdBy: superAdmin._id,
  });

  const droneQR = await generateQR('EQ-DRN-003', 'TAG-7712', 'Holybro S500 Optical Research Quadcopter');
  const eqDrone = await Equipment.create({
    equipmentCode: 'EQ-DRN-003',
    assetTag: 'TAG-7712',
    name: 'Holybro S500 Optical Research Quadcopter',
    category: 'Drones',
    manufacturer: 'Holybro / PX4 Autopilot',
    model: 'S500 V2 Autonomous',
    serialNumber: 'HB-S500-449',
    description: 'Carbon fiber development quadcopter frame equipped with Pixhawk 6C autopilot, optical flow, and telemetry.',
    purchaseCost: 4200,
    purchaseDate: new Date('2025-03-10'),
    laboratory: lab2._id,
    room: room3._id,
    status: 'AVAILABLE',
    condition: 'GOOD',
    specifications: {
      FlightController: 'Pixhawk 6C',
      Motors: '2216 880KV Brushless',
      Propellers: '1045 Carbon Fiber',
      PayloadCapacity: '1.2 kg',
      FlightTime: '18 minutes',
    },
    image: '/src/assets/images/drone_fleet_station_1790831604331.jpg',
    maintenanceIntervalDays: 45,
    safetyDocumentRequired: safetyDoc2._id,
    qrCodeData: droneQR,
    createdBy: superAdmin._id,
  });

  const printerQR = await generateQR('EQ-3DP-004', 'TAG-3110', 'Prusa MK4 Rapid Prototyping 3D Printer');
  const eqPrinter = await Equipment.create({
    equipmentCode: 'EQ-3DP-004',
    assetTag: 'TAG-3110',
    name: 'Prusa MK4 Rapid Prototyping 3D Printer',
    category: '3D Printers',
    manufacturer: 'Prusa Research',
    model: 'Original Prusa MK4',
    serialNumber: 'PR-MK4-9021',
    description: 'High-speed FDM 3D printer with 32-bit architecture and Nextruder for rapid robotics bracket fabrication.',
    purchaseCost: 1200,
    purchaseDate: new Date('2024-11-05'),
    laboratory: lab1._id,
    room: room2._id,
    status: 'AVAILABLE',
    condition: 'EXCELLENT',
    specifications: {
      BuildVolume: '250 x 210 x 220 mm',
      NozzleTemp: 'Up to 300 C',
      SupportedFilaments: 'PLA, PETG, ASA, PC, Carbon-Fiber Nylon',
    },
    image: '/src/assets/images/lab_facility_overview_1790831615988.jpg',
    maintenanceIntervalDays: 90,
    qrCodeData: printerQR,
    createdBy: superAdmin._id,
  });

  const lidarQR = await generateQR('EQ-SEN-005', 'TAG-1194', 'Velodyne Puck VLP-16 LiDAR');
  await Equipment.create({
    equipmentCode: 'EQ-SEN-005',
    assetTag: 'TAG-1194',
    name: 'Velodyne Puck VLP-16 Real-Time 3D LiDAR',
    category: 'LiDAR',
    manufacturer: 'Velodyne',
    model: 'VLP-16 Puck',
    serialNumber: 'VLP-16-0922',
    description: '16-channel 3D LiDAR sensor with 100m range and 300,000 points/sec data rate for autonomous SLAM.',
    purchaseCost: 4500,
    laboratory: lab1._id,
    room: room1._id,
    status: 'UNDER_MAINTENANCE',
    condition: 'FAIR',
    specifications: {
      Channels: '16 Channels',
      Range: '100 meters',
      FieldOfView: '360 Horizontal, 30 Vertical',
      Weight: '830 grams',
    },
    maintenanceIntervalDays: 120,
    qrCodeData: lidarQR,
    createdBy: superAdmin._id,
  });

  const plcQR = await generateQR('EQ-PLC-006', 'TAG-5520', 'Omron Sysmac NJ-Series Industrial PLC Bench');
  await Equipment.create({
    equipmentCode: 'EQ-PLC-006',
    assetTag: 'TAG-5520',
    name: 'Omron Sysmac NJ-Series Industrial PLC Bench',
    category: 'PLC',
    manufacturer: 'Omron Automation',
    model: 'NJ101-1020',
    serialNumber: 'OM-NJ-7731',
    description: 'Machine automation controller bench with EtherCAT I/O, servo axis control, and HMI display.',
    purchaseCost: 9500,
    laboratory: lab1._id,
    room: room1._id,
    status: 'AVAILABLE',
    condition: 'EXCELLENT',
    specifications: {
      Protocol: 'EtherCAT, EtherNet/IP',
      MotionAxes: '2 axes of synchronized motion',
      InputsOutputs: '32 Digital In, 32 Digital Out',
    },
    maintenanceIntervalDays: 180,
    qrCodeData: plcQR,
    createdBy: superAdmin._id,
  });

  // 5. Inventory Items
  const inv1 = await InventoryItem.create({
    componentCode: 'INV-MOT-001',
    name: 'NEMA 17 Bipolar Stepper Motor (1.8 deg, 45Ncm)',
    category: 'Motors',
    partNumber: '17HS4401',
    manufacturer: 'StepperOnline',
    quantity: 34,
    minimumStock: 10,
    maximumStock: 100,
    unit: 'pcs',
    storageLocation: 'Cabinet A - Bin 03',
    cost: 14.5,
    condition: 'NEW',
  });

  const inv2 = await InventoryItem.create({
    componentCode: 'INV-BAT-002',
    name: 'Tattu 3S 11.1V 2200mAh 45C LiPo Battery Pack',
    category: 'Batteries',
    partNumber: 'TA-45C-2200-3S1P',
    manufacturer: 'Tattu GensAce',
    quantity: 6, // Low stock trigger!
    minimumStock: 10,
    maximumStock: 40,
    unit: 'packs',
    storageLocation: 'LiPo Fire Safe Cabinet 2',
    cost: 29.99,
    condition: 'TESTED',
  });

  const inv3 = await InventoryItem.create({
    componentCode: 'INV-SEN-003',
    name: 'HC-SR04 Ultrasonic Distance Sensor Module',
    category: 'Sensors',
    partNumber: 'HC-SR04-V2',
    manufacturer: 'SparkFun / Generic',
    quantity: 75,
    minimumStock: 15,
    maximumStock: 150,
    unit: 'pcs',
    storageLocation: 'Drawer B-12',
    cost: 2.8,
    condition: 'NEW',
  });

  const inv4 = await InventoryItem.create({
    componentCode: 'INV-IC-004',
    name: 'L298N Dual H-Bridge Motor Driver Module',
    category: 'Motor Drivers',
    partNumber: 'L298N-RED-BRD',
    manufacturer: 'Elegoo',
    quantity: 42,
    minimumStock: 12,
    maximumStock: 80,
    unit: 'pcs',
    storageLocation: 'Drawer C-04',
    cost: 5.5,
    condition: 'NEW',
  });

  // Inventory transaction record
  await InventoryTransaction.create({
    inventoryItem: inv1._id,
    quantity: 20,
    type: 'STOCK_IN',
    reason: 'Department grant restocking batch',
    user: labTech._id,
    previousQuantity: 14,
    newQuantity: 34,
  });

  // 6. Robotics Projects
  const project1 = await Project.create({
    projectCode: 'ROBO-PRJ-0001',
    projectName: 'Autonomous Hospital Pharmacy Delivery Rover',
    problemStatement: 'Automate transport of medications and lab specimens between intensive care units without human intervention.',
    description: 'A differential drive mobile robot using 2D LiDAR SLAM, ROS2 navigation stack (Nav2), and automated compartment unlocking via RFID.',
    objectives: [
      'Implement real-time SLAM using Cartographer and Velodyne Puck LiDAR.',
      'Navigate dynamic crowded hospital hallways with collision avoidance under 500ms latency.',
      'Integrate RFID badge reader for nurse compartment access.',
    ],
    category: 'Autonomous Mobile Robotics',
    status: 'IN_PROGRESS',
    facultyMentor: faculty._id,
    budget: 2500,
    progress: 65,
    repositoryUrl: 'https://github.com/robolab-university/hospital-delivery-rover',
    createdBy: studentMaya._id,
    teamMembers: [
      { user: studentMaya._id, role: 'TEAM_LEAD', joinedAt: new Date('2026-01-10') },
      { user: studentLiam._id, role: 'SOFTWARE', joinedAt: new Date('2026-01-12') },
    ],
    feedback: [
      {
        faculty: faculty._id,
        text: 'Excellent trajectory tracking on the test grid. Please ensure fail-safe emergency deceleration parameters are tested next.',
        date: new Date('2026-02-14'),
      },
    ],
  });

  await ProjectMilestone.create([
    {
      project: project1._id,
      title: 'Chassis Fabrication & Motor Integration',
      description: 'Mount brushless hub motors and calibrate PID velocity controller.',
      dueDate: new Date('2026-02-01'),
      status: 'COMPLETED',
      progress: 100,
      assignedMembers: [studentMaya._id],
    },
    {
      project: project1._id,
      title: 'ROS2 Nav2 Stack Hallway Waypoint Tuning',
      description: 'Tune costmaps and inflation layers for obstacle avoidance.',
      dueDate: new Date('2026-03-15'),
      status: 'IN_PROGRESS',
      progress: 60,
      assignedMembers: [studentLiam._id],
    },
    {
      project: project1._id,
      title: 'Full Autonomous Mission Stress Test',
      description: 'Run 10 continuous delivery loops across Building Eng-100.',
      dueDate: new Date('2026-04-20'),
      status: 'PENDING',
      progress: 0,
      assignedMembers: [studentMaya._id, studentLiam._id],
    },
  ]);

  const project2 = await Project.create({
    projectCode: 'ROBO-PRJ-0002',
    projectName: 'Vision-Guided Robotic Arm Electronic Waste Sorter',
    problemStatement: 'Sort discarded circuit boards and lithium batteries accurately on a conveyor belt using YOLOv8 vision detection.',
    description: 'Uses the UR5e collaborative arm with pneumatic suction gripper and RealSense D435i camera to segment and sort e-waste.',
    objectives: [
      'Train YOLOv8 custom model on 5,000 PCB component images.',
      'Achieve pick-and-place cycle time under 2.5 seconds per object.',
    ],
    category: 'Industrial Automation & AI',
    status: 'APPROVED',
    facultyMentor: faculty._id,
    budget: 1800,
    progress: 30,
    createdBy: studentLiam._id,
    teamMembers: [
      { user: studentLiam._id, role: 'TEAM_LEAD', joinedAt: new Date('2026-02-01') },
      { user: studentMaya._id, role: 'HARDWARE', joinedAt: new Date('2026-02-05') },
    ],
  });

  // 7. Reservations & Checkouts
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const tomorrowStr = tomorrow.toISOString().split('T')[0];

  const reservation1 = await Reservation.create({
    equipment: eqArm._id,
    user: studentMaya._id,
    date: tomorrowStr,
    startTime: '14:00',
    endTime: '17:00',
    startDateTime: new Date(`${tomorrowStr}T14:00:00`),
    endDateTime: new Date(`${tomorrowStr}T17:00:00`),
    purpose: 'Kinematics trajectory calibration for e-waste pick and place experiment.',
    project: project2._id,
    status: 'APPROVED',
    approvedBy: labAdmin._id,
    approvedAt: new Date(),
  });

  // Active checkout for Jackal AMR
  const checkout1 = await Checkout.create({
    equipment: eqAmr._id,
    user: studentMaya._id,
    issuedBy: labTech._id,
    checkoutTime: new Date(Date.now() - 3 * 3600 * 1000), // 3 hours ago
    expectedReturnTime: new Date(Date.now() + 5 * 3600 * 1000), // in 5 hours
    conditionBefore: 'GOOD',
    notes: 'Checked out with 2 battery packs and wireless gamepad controller.',
    status: 'CHECKED_OUT',
  });

  // 8. Maintenance Records
  await Maintenance.create({
    equipment: eqArm._id,
    maintenanceType: 'CALIBRATION',
    description: 'Quarterly zero-point joint calibration and safety boundary check.',
    technician: labTech._id,
    startDate: new Date('2026-08-01'),
    completionDate: new Date('2026-08-01'),
    cost: 250,
    partsUsed: ['Calibration pin set', 'Silicone joint lubricant'],
    notes: 'All 6 joints within +/- 0.02mm tolerance.',
    status: 'COMPLETED',
  });

  // 9. Issue Reports
  await IssueReport.create({
    equipment: eqPrinter._id,
    reporter: studentLiam._id,
    category: 'Nozzle Clog',
    description: '0.4mm brass nozzle is clogged with carbon fiber PETG filament during high-speed extrusion.',
    severity: 'MEDIUM',
    status: 'RESOLVED',
    assignedTechnician: labTech._id,
    resolutionNotes: 'Cold pull performed, nozzle swapped with hardened steel 0.4mm nozzle.',
    resolvedAt: new Date(),
  });

  // 10. System Settings
  await SystemSetting.create([
    {
      key: 'MAX_RESERVATION_HOURS_PER_DAY',
      value: '4',
      category: 'Reservations',
      description: 'Maximum reservation hours permitted per student per day.',
    },
    {
      key: 'REQUIRE_SAFETY_ACKNOWLEDGE_BEFORE_RESERVE',
      value: 'true',
      category: 'Safety',
      description: 'Require students to review and acknowledge safety SOPs before submitting reservation.',
    },
    {
      key: 'LAB_CONTACT_EMAIL',
      value: 'support@robolab.edu',
      category: 'General',
      description: 'Official support dispatch email for robotics laboratory assistance.',
    },
  ]);

  console.log('[Seed] Database seeded successfully with real university robotics assets!');
}
