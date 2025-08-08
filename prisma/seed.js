"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = require("@prisma/client");
const bcrypt = __importStar(require("bcrypt"));
const dotenv = __importStar(require("dotenv"));
dotenv.config();
const prisma = new client_1.PrismaClient();
const seedOrganizationAndAdmin = async () => {
    try {
        const adminEmail = process.env.ADMIN_EMAIL || "raj@gmail.com";
        const adminPassword = process.env.ADMIN_PASSWORD || "Test@123";
        const adminUsername = process.env.ADMIN_USERNAME || "raj";
        const existingAdmin = await prisma.user.findUnique({
            where: { username: adminUsername },
            include: { organization: true },
        });
        if (existingAdmin) {
            console.log(`👤 Admin user already exists: ${adminUsername}`);
            return existingAdmin;
        }
        const saltRounds = 10;
        const passwordHash = await bcrypt.hash(adminPassword, saltRounds);
        const adminUser = await prisma.user.create({
            data: {
                username: adminUsername,
                passwordHash: passwordHash,
                role: client_1.UserRole.owner,
                isActive: true,
            },
        });
        console.log(`✅ Admin user created: ${adminUsername}`);
        const organization = await prisma.organization.create({
            data: {
                name: "CrusherMate Operations",
                ownerId: adminUser.id,
            },
        });
        console.log(`✅ Organization created: ${organization.name}`);
        const updatedAdminUser = await prisma.user.update({
            where: { id: adminUser.id },
            data: { organizationId: organization.id },
        });
        return updatedAdminUser;
    }
    catch (error) {
        console.error("❌ Error creating admin user:", error);
        throw error;
    }
};
const seedMaterialRates = async (adminUser) => {
    try {
        const defaultRates = [
            {
                materialType: "M-Sand",
                currentRate: 22000,
                notes: "Market rate for M-Sand per unit",
            },
            {
                materialType: "P-Sand",
                currentRate: 20000,
                notes: "Market rate for P-Sand per unit",
            },
            {
                materialType: "Blue Metal 0.5in",
                currentRate: 24000,
                notes: "Market rate for Blue Metal 0.5in per unit",
            },
            {
                materialType: "Blue Metal 0.75in",
                currentRate: 25000,
                notes: "Market rate for Blue Metal 0.75in per unit",
            },
            {
                materialType: "Jally",
                currentRate: 18000,
                notes: "Market rate for Jally per unit",
            },
            {
                materialType: "Kurunai",
                currentRate: 16000,
                notes: "Market rate for Kurunai per unit",
            },
            {
                materialType: "Mixed",
                currentRate: 20000,
                notes: "Market rate for Mixed materials per unit",
            },
        ];
        for (const rate of defaultRates) {
            const existingRate = await prisma.materialRate.findFirst({
                where: {
                    materialType: rate.materialType,
                    organizationId: adminUser.organizationId,
                },
            });
            if (!existingRate) {
                await prisma.materialRate.create({
                    data: {
                        materialType: rate.materialType,
                        ratePerUnit: rate.currentRate,
                        unitType: "Load",
                        organizationId: adminUser.organizationId,
                        isActive: true,
                    },
                });
                console.log(`✅ Created rate for ${rate.materialType}: ₹${rate.currentRate}`);
            }
            else {
                console.log(`📝 Rate already exists for ${rate.materialType}: ₹${existingRate.ratePerUnit}`);
            }
        }
    }
    catch (error) {
        console.error("❌ Error seeding material rates:", error);
        throw error;
    }
};
async function main() {
    try {
        console.log("🌱 Starting production database seeding...");
        console.log(`📊 Database URL: ${process.env.DATABASE_URL?.replace(/\/\/.*@/, "//***:***@")}`);
        await prisma.$connect();
        console.log("✅ Connected to production PostgreSQL database");
        const adminUser = await seedOrganizationAndAdmin();
        await seedMaterialRates(adminUser);
        console.log("🎉 Production database seeding completed successfully!");
        console.log("\n📋 Summary:");
        console.log(`👤 Admin User: ${adminUser.username} (role: ${adminUser.role})`);
        console.log(`🏢 Organization ID: ${adminUser.organizationId}`);
        console.log("\n🔐 Login Credentials:");
        console.log(`Username: ${adminUser.username} / Password: ${process.env.ADMIN_PASSWORD || "Test@123"}`);
        const totalUsers = await prisma.user.count();
        const totalOrganizations = await prisma.organization.count();
        const totalRates = await prisma.materialRate.count();
        console.log("\n📊 Database Statistics:");
        console.log(`Users: ${totalUsers}`);
        console.log(`Organizations: ${totalOrganizations}`);
        console.log(`Material Rates: ${totalRates}`);
    }
    catch (error) {
        console.error("❌ Production database seeding failed:", error);
        process.exit(1);
    }
}
main()
    .then(async () => {
    await prisma.$disconnect();
})
    .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
});
//# sourceMappingURL=seed.js.map