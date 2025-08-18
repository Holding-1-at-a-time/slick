
import { Service, PricingMatrix, Upcharge, Checklist, Customer, Vehicle, Job, Appointment, User, Company, Product, Supplier, Promotion } from '../types';

export const initialServices: Service[] = [
  {
    id: 's1',
    name: 'Exterior Hand Wash',
    description: 'A thorough hand wash and dry for the vehicle exterior.',
    basePrice: 50,
    isPackage: false,
    serviceIds: [],
    isDealerPackage: false,
    estimatedDurationHours: 1,
  },
  {
    id: 's2',
    name: 'Interior Vacuum & Wipe',
    description: 'Complete vacuuming of interior and wiping down of all surfaces.',
    basePrice: 75,
    isPackage: false,
    serviceIds: [],
    isDealerPackage: false,
    estimatedDurationHours: 1.5,
  },
  {
    id: 's3',
    name: 'Clay Bar & Wax',
    description: 'Decontamination of paint with a clay bar treatment, followed by a protective wax layer.',
    basePrice: 150,
    isPackage: false,
    serviceIds: [],
    isDealerPackage: true,
    estimatedDurationHours: 2,
  },
  {
    id: 'p1',
    name: 'Basic Detail Package',
    description: 'Combines our exterior hand wash and interior vacuum services for a complete clean.',
    basePrice: 110,
    isPackage: true,
    serviceIds: ['s1', 's2'],
    isDealerPackage: false,
    estimatedDurationHours: 2.5,
  },
  {
    id: 'p2',
    name: 'Premium Detail Package',
    description: 'The ultimate detailing package including wash, interior, clay bar, and wax.',
    basePrice: 250,
    isPackage: true,
    serviceIds: ['s1', 's2', 's3'],
    isDealerPackage: true,
    estimatedDurationHours: 4.5,
  },
];

export const initialPricingMatrices: PricingMatrix[] = [
    {
        id: 'pm1',
        name: 'Vehicle Size Adjustment',
        appliesToServiceIds: ['p1', 'p2', 's1'],
        rules: [
            { id: 'r1', factor: 'Sedan/Coupe', adjustmentType: 'fixedAmount', adjustmentValue: 0 },
            { id: 'r2', factor: 'SUV/Crossover', adjustmentType: 'fixedAmount', adjustmentValue: 25 },
            { id: 'r3', factor: 'Truck/Van', adjustmentType: 'percentage', adjustmentValue: 20 },
        ]
    },
    {
        id: 'pm2',
        name: 'Condition Upcharge',
        appliesToServiceIds: ['p2', 's2'],
        rules: [
            { id: 'r4', factor: 'Light Soiling', adjustmentType: 'fixedAmount', adjustmentValue: 0 },
            { id: 'r5', factor: 'Heavy Soiling', adjustmentType: 'fixedAmount', adjustmentValue: 50 },
            { id: 'r6', factor: 'Excessive Pet Hair', adjustmentType: 'fixedAmount', adjustmentValue: 75 },
        ]
    }
];

export const initialUpcharges: Upcharge[] = [
    {
        id: 'u1',
        name: 'Excessive Pet Hair',
        description: 'For vehicles with a significant amount of pet hair requiring extra time and tools.',
        defaultAmount: 75,
        isPercentage: false,
    },
    {
        id: 'u2',
        name: 'Heavy Tar/Sap Removal',
        description: 'Specialized chemical treatment to safely remove tar and tree sap from paint.',
        defaultAmount: 50,
        isPercentage: false,
    },
    {
        id: 'u3',
        name: 'Biohazard Cleaning',
        description: 'Handling of biohazardous materials like mold, vomit, or blood. Price is a starting point.',
        defaultAmount: 150,
        isPercentage: false,
    }
];

export const initialChecklists: Checklist[] = [
    {
        id: 'c1',
        name: 'Premium Interior Checklist',
        serviceId: 's2',
        tasks: [
            'Remove all floor mats',
            'Thoroughly vacuum all carpets, seats, and trunk',
            'Wipe down all hard surfaces (dashboard, console, door panels)',
            'Clean and condition leather seats',
            'Shampoo cloth seats and floor mats',
            'Clean interior glass and mirrors',
            'Apply UV protectant to dashboard and trim',
        ]
    },
    {
        id: 'c2',
        name: 'Premium Package Final Inspection',
        serviceId: 'p2',
        tasks: [
            'Check for any remaining swirl marks or holograms',
            'Ensure all wax residue is removed from crevices',
            'Verify tire dressing is evenly applied',
            'Final wipe down of all interior and exterior surfaces',
            'Place floor mat protectors',
            'Hang air freshener if requested',
        ]
    }
];

export const initialCustomers: Customer[] = [
    {
        id: 'cust1',
        name: 'John Doe',
        phone: '555-123-4567',
        email: 'john.doe@example.com',
        address: '123 Main St, Anytown, USA',
        internalNotes: 'Regular customer, prefers Wednesdays.'
    },
    {
        id: 'cust2',
        name: 'Jane Smith',
        phone: '555-987-6543',
        email: 'jane.smith@example.com',
        internalNotes: 'New customer, referred by John Doe.'
    }
];

export const initialVehicles: Vehicle[] = [
    {
        id: 'v1',
        customerId: 'cust1',
        vin: '1GKS23D89L123456',
        make: 'Chevrolet',
        model: 'Silverado',
        year: 2022,
        color: 'Black'
    },
    {
        id: 'v2',
        customerId: 'cust1',
        vin: 'JN8AS5CF7L123456',
        make: 'Nissan',
        model: 'Leaf',
        year: 2021,
        color: 'White'
    },
     {
        id: 'v3',
        customerId: 'cust2',
        vin: '5YJSA1E27L123456',
        make: 'Tesla',
        model: 'Model 3',
        year: 2023,
        color: 'Red'
    }
];

export const initialJobs: Job[] = [
    {
        id: 'job1',
        customerId: 'cust1',
        vehicleId: 'v1',
        status: 'estimate',
        estimateDate: Date.now() - 86400000 * 2, // 2 days ago
        totalAmount: 345,
        discountAmount: 0,
        paymentReceived: 0,
        paymentStatus: 'unpaid',
        jobItems: [
            { id: 'item1', serviceId: 'p2', quantity: 1, unitPrice: 250, appliedPricingRuleIds: ['r3'], addedUpchargeIds: [], total: 300 },
            { id: 'item2', serviceId: 's2', quantity: 1, unitPrice: 75, appliedPricingRuleIds: [], addedUpchargeIds: ['u1'], total: 45 },
        ],
        notes: 'Customer wants extra attention on the truck bed.',
        assignedTechnicianIds: ['user2'],
        customerApprovalStatus: 'pending',
        publicLinkKey: 'e4d8c9a0-7b1e-4f5c-8a3d-2f6b1e9c4a0b',
    },
    {
        id: 'job2',
        customerId: 'cust2',
        vehicleId: 'v3',
        status: 'invoice',
        estimateDate: Date.now() - 86400000, // 1 day ago
        workOrderDate: Date.now() - 43200000, // 12 hours ago
        invoiceDate: Date.now(),
        totalAmount: 110,
        discountAmount: 0,
        paymentReceived: 50,
        paymentStatus: 'partial',
        jobItems: [
            { id: 'item3', serviceId: 'p1', quantity: 1, unitPrice: 110, appliedPricingRuleIds: ['r1'], addedUpchargeIds: [], total: 110 },
        ],
        payments: [
            { id: 'pay1', amount: 50, paymentDate: Date.now(), method: 'Cash', notes: 'Deposit paid upfront.'}
        ],
        assignedTechnicianIds: ['user2'],
        customerApprovalStatus: 'approved',
        publicLinkKey: 'a1b2c3d4-e5f6-7g8h-9i0j-k1l2m3n4o5p6',
    }
];

const today = new Date();
const getTodayAtTime = (hour: number, minute: number = 0) => {
    return new Date(today.getFullYear(), today.getMonth(), today.getDate(), hour, minute).getTime();
};
const getTomorrowAtTime = (hour: number, minute: number = 0) => {
    return new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1, hour, minute).getTime();
};

export const initialAppointments: Appointment[] = [
    {
        id: 'appt1',
        jobId: 'job2',
        startTime: getTodayAtTime(9),
        endTime: getTodayAtTime(12),
        title: 'Tesla Model 3 - Basic Package',
        status: 'scheduled',
    },
    {
        id: 'appt2',
        jobId: 'job1',
        startTime: getTomorrowAtTime(10),
        endTime: getTomorrowAtTime(15),
        description: 'Premium package on a large truck. Block extra time.',
        status: 'scheduled',
    },
];

export const initialUsers: User[] = [
    {
        id: 'user1',
        name: 'Admin User',
        email: 'admin@detailingpro.com',
        role: 'admin',
    },
    {
        id: 'user2',
        name: 'Technician Tom',
        email: 'tom@detailingpro.com',
        role: 'technician',
    },
    {
        id: 'user3',
        name: 'Technician Sarah',
        email: 'sarah@detailingpro.com',
        role: 'technician',
    },
];

export const initialCompany: Company = {
    id: 'comp1',
    name: 'Detailing Pro HQ',
    defaultLaborRate: 65.00,
    stripeConnectAccountId: undefined,
};

export const initialSuppliers: Supplier[] = [
    { id: 'sup1', name: 'CarChem Supplies', contactEmail: 'sales@carchem.com' },
    { id: 'sup2', name: 'Microfiber World', contactEmail: 'orders@mfworld.com' },
    { id: 'sup3', name: 'Detailing Equipment Inc.', contactEmail: 'info@detailingequip.com' },
];

export const initialProducts: Product[] = [
    { id: 'prod1', name: 'All-Purpose Cleaner (1 Gal)', category: 'Chemicals', supplierId: 'sup1', stockLevel: 12, reorderPoint: 5 },
    { id: 'prod2', name: 'Premium Carnauba Wax (16 oz)', category: 'Waxes & Sealants', supplierId: 'sup1', stockLevel: 8, reorderPoint: 10 },
    { id: 'prod3', name: 'Plush Microfiber Towels (12-pack)', category: 'Towels & Applicators', supplierId: 'sup2', stockLevel: 25, reorderPoint: 20 },
    { id: 'prod4', name: 'Foam Cannon Attachment', category: 'Equipment', supplierId: 'sup3', stockLevel: 3, reorderPoint: 2 },
    { id: 'prod5', name: 'Tire Shine (1 Gal)', category: 'Chemicals', supplierId: 'sup1', stockLevel: 4, reorderPoint: 5 },
];

export const initialPromotions: Promotion[] = [
    { id: 'promo1', code: 'SPRING20', type: 'percentage', value: 20, isActive: true },
    { id: 'promo2', code: 'NEWCUSTOMER', type: 'fixedAmount', value: 25, isActive: true },
    { id: 'promo3', code: 'EXPIRED', type: 'percentage', value: 15, isActive: false },
];