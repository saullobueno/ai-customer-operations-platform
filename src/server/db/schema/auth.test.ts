import { describe, expect, it } from "vitest";
import { createTestDb } from "../test-utils";
import { member, organization, user } from "./auth";

describe("schema multi-tenant (organization/user/member)", () => {
  it("cria uma organização, um usuário e vincula via membership", async () => {
    const db = await createTestDb();

    const [org] = await db
      .insert(organization)
      .values({ id: "org_1", name: "Econform", slug: "econform", createdAt: new Date() })
      .returning();

    const [owner] = await db
      .insert(user)
      .values({ id: "user_1", name: "Edivan", email: "edivan@econform.com.br" })
      .returning();

    await db.insert(member).values({
      id: "member_1",
      organizationId: org.id,
      userId: owner.id,
      role: "owner",
      createdAt: new Date(),
    });

    const rows = await db.query.member.findMany({
      with: { organization: true, user: true },
    });

    expect(rows).toHaveLength(1);
    expect(rows[0].role).toBe("owner");
    expect(rows[0].organization.slug).toBe("econform");
    expect(rows[0].user.email).toBe("edivan@econform.com.br");
  });

  it("impede dois membros com o mesmo slug de organização", async () => {
    const db = await createTestDb();

    await db
      .insert(organization)
      .values({ id: "org_1", name: "Econform", slug: "econform", createdAt: new Date() });

    await expect(
      db
        .insert(organization)
        .values({ id: "org_2", name: "Outra", slug: "econform", createdAt: new Date() }),
    ).rejects.toThrow();
  });
});
