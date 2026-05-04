import { expect, test } from "@playwright/test";

test.describe("people active/inactive", () => {
	test("people page redirects unauthenticated users to login", async ({
		page,
	}) => {
		await page.goto("/app/launchclub/people");
		await expect(page).toHaveURL(/\/auth\/login/);
	});
});
