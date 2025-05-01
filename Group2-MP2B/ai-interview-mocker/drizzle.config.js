/** @type { import("drizzle-kit").config } */
export default {
    schema: "./utils/schema.js",
    dialect: 'postgresql',
    dbCredentials: {
        url: 'postgresql://accounts:npg_3x2MwtgQJjZi@ep-divine-tree-a8hp9b0b-pooler.eastus2.azure.neon.tech/AI%20Interview%20Mocker?sslmode=require',
    }
}