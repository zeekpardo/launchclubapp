import { Document } from "@shared/components/Document";
import { getLocale, getMessages } from "next-intl/server";
import { NextIntlClientProvider } from "next-intl";
import type { PropsWithChildren } from "react";

export default async function ApplyLayout({ children }: PropsWithChildren) {
	const locale = await getLocale();
	const messages = await getMessages();

	return (
		<Document locale={locale}>
			<NextIntlClientProvider messages={messages}>
				{children}
			</NextIntlClientProvider>
		</Document>
	);
}
