"use client";

import {
	FormControl,
	FormField,
	FormItem,
	FormLabel,
	FormMessage,
} from "@repo/ui/components/form";
import { Input } from "@repo/ui/components/input";
import { Textarea } from "@repo/ui/components/textarea";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@repo/ui/components/select";
import { type Control } from "react-hook-form";

export interface ResourceFormValues {
	name: string;
	url: string;
	description?: string;
	eventId?: string;
}

interface ResourceEvent {
	id: string;
	name: string;
	startsAt: Date | string;
}

interface ResourceDialogFieldsProps {
	control: Control<ResourceFormValues>;
	events: ResourceEvent[];
}

export function ResourceDialogFields({ control, events }: ResourceDialogFieldsProps) {
	return (
		<>
			<FormField
				control={control}
				name="name"
				render={({ field }) => (
					<FormItem>
						<FormLabel>Resource Name</FormLabel>
						<FormControl>
							<Input {...field} placeholder="Enter resource name" />
						</FormControl>
						<FormMessage />
					</FormItem>
				)}
			/>

			<FormField
				control={control}
				name="url"
				render={({ field }) => (
					<FormItem>
						<FormLabel>URL</FormLabel>
						<FormControl>
							<Input {...field} type="url" placeholder="https://example.com" />
						</FormControl>
						<FormMessage />
					</FormItem>
				)}
			/>

			<FormField
				control={control}
				name="description"
				render={({ field }) => (
					<FormItem>
						<FormLabel>Description</FormLabel>
						<FormControl>
							<Textarea
								{...field}
								value={field.value ?? ""}
								placeholder="Enter a brief description"
								rows={3}
							/>
						</FormControl>
						<FormMessage />
					</FormItem>
				)}
			/>

			<FormField
				control={control}
				name="eventId"
				render={({ field }) => (
					<FormItem>
						<FormLabel>Linked Event (Optional)</FormLabel>
						<Select
							onValueChange={(val) => field.onChange(val === "none" ? undefined : val)}
							value={field.value ?? "none"}
						>
							<FormControl>
								<SelectTrigger>
									<SelectValue placeholder="Select an event" />
								</SelectTrigger>
							</FormControl>
							<SelectContent>
								<SelectItem value="none">No linked event</SelectItem>
								{events.map((event) => (
									<SelectItem key={event.id} value={event.id}>
										{event.name} &mdash;{" "}
										{new Date(event.startsAt).toLocaleDateString()}
									</SelectItem>
								))}
							</SelectContent>
						</Select>
						<FormMessage />
					</FormItem>
				)}
			/>
		</>
	);
}
