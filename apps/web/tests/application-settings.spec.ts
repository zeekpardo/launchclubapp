import { expect, test } from "@playwright/test";

test.describe("application settings", () => {
	test("org settings page redirects unauthenticated users to login", async ({
		page,
	}) => {
		await page.goto("/app/launchclub/settings/applications");
		await expect(page).toHaveURL(/\/auth\/login/);
	});
});
