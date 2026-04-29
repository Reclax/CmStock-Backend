process.env.NODE_ENV = "test";

after(async () => {
  try {
    const { sequelize } = await import("../config/database.js");
    await sequelize.close();
  } catch {
    // ignore
  }
});
