import { expect, test } from "@playwright/test";
import { config } from "@/config";

test.describe("home page", () => {
	if (config.marketing.enabled) {
		test("should load", async ({ page }) => {
			await page.goto("/");

			await expect(
				page.getByRole("heading", {
					name: "Run your youth programs, from sign-up to sign-off",
				}),
			).toBeVisible();
		});
	} else {
		test("should be redirected to app", async ({ page }) => {
			await page.goto("/");

			await expect(page).toHaveURL(/\.*\/auth\/login/);
		});
	}
});
