import "dotenv/config";

export default {
  schema: {
    datasourceUrl: process.env.DATABASE_URL,
  },
};
