export const config = {
	bucketNames: {
		avatars: process.env.NEXT_PUBLIC_AVATARS_BUCKET_NAME ?? "avatars",
		customFields: process.env.CUSTOM_FIELDS_BUCKET_NAME ?? "custom-fields",
	},
} as const;
