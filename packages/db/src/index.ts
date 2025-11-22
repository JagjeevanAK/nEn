import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import pg from "pg";

export  type{ CredentialsI,PropertiesI, CredentialSubmitPayload , UserCredentials,IEdge,INode, Measured,NodeData,Position,Workflow } from "./types"

const connectionString = process.env.DATABASE_URL || "postgresql://nen_user:nen_password@localhost:5432/nen_db";
const pool = new pg.Pool({ connectionString });
const adapter = new PrismaPg(pool);

export const prisma = new PrismaClient({ adapter });

async function connectPrismaClient() {
    try {
        await prisma.$connect()
    } catch (error) {
        console.log("PRISMA CLIENT COULD NOT CONNECT", error)
    }
}

connectPrismaClient();