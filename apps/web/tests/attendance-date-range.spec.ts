import { expect, test } from "@playwright/test";

test.describe("attendance date range", () => {
	test("group attendance page redirects unauthenticated users to login", async ({
		page,
	}) => {
		await page.goto("/app/launchclub/groups/some-group-id");
		await expect(page).toHaveURL(/\/auth\/login/);
	});
});
