import { db } from "../../../config/db.js";

export async function findUserByIdentifier(identifier, type) {
  const column = type === "EMAIL" ? "email" : "mobile";

  const result = await db.query(
    `SELECT * FROM users WHERE ${column} = $1 LIMIT 1`,
    [identifier]
  );

  return result.rows[0] || null;
}

export async function createUser(identifier, type) {
  const column = type === "EMAIL" ? "email" : "mobile";

  const result = await db.query(
    `INSERT INTO users (${column})
     VALUES ($1)
     RETURNING *`,
    [identifier]
  );

  return result.rows[0];
}
