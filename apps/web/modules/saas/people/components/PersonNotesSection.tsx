"use client";

import { isOrganizationAdmin } from "@repo/auth/lib/helper";
import { Button } from "@repo/ui/components/button";
import {
	Card,
	CardContent,
	CardHeader,
	CardTitle,
} from "@repo/ui/components/card";
import { Textarea } from "@repo/ui/components/textarea";
import { toastError, toastSuccess } from "@repo/ui/components/toast";
import { useSession } from "@saas/auth/hooks/use-session";
import { useActiveOrganization } from "@saas/organizations/hooks/use-active-organization";
import { ChevronDownIcon, PencilIcon, PlusIcon, Trash2Icon } from "lucide-react";
import { useCallback, useRef, useState } from "react";
import {
	useCreatePersonNote,
	useDeletePersonNote,
	useMentionableUsers,
	usePersonNotes,
	useUpdatePersonNote,
} from "../hooks/use-person-notes";

const MENTION_REGEX = /@\[([^\]]+)\]\(([^)]+)\)/g;

function extractMentionIds(body: string): string[] {
	const ids: string[] = [];
	let match: RegExpExecArray | null;
	const re = new RegExp(MENTION_REGEX.source, "g");
	while ((match = re.exec(body)) !== null) {
		ids.push(match[2]);
	}
	return [...new Set(ids)];
}

function renderNoteBody(body: string): React.ReactNode {
	const re = new RegExp(MENTION_REGEX.source, "g");
	const parts: React.ReactNode[] = [];
	let lastIndex = 0;
	let match: RegExpExecArray | null;

	while ((match = re.exec(body)) !== null) {
		if (match.index > lastIndex) {
			parts.push(body.slice(lastIndex, match.index));
		}
		parts.push(
			<span
				key={match.index}
				className="text-primary font-medium bg-primary/10 px-1 rounded text-xs"
			>
				@{match[1]}
			</span>,
		);
		lastIndex = match.index + match[0].length;
	}

	if (lastIndex < body.length) {
		parts.push(body.slice(lastIndex));
	}

	return <>{parts}</>;
}

interface MentionableUser {
	id: string;
	role: string;
	user: { id: string; name: string; image: string | null };
}

interface NoteComposerProps {
	personId: string;
	organizationId: string;
	mentionableUsers: MentionableUser[];
	editingNote?: { id: string; body: string } | undefined;
	onCreate: (body: string, mentionUserIds: string[]) => Promise<void>;
	onUpdate: (id: string, body: string, mentionUserIds: string[]) => Promise<void>;
	onCancel: () => void;
	isSubmitting: boolean;
}

function NoteComposer({
	mentionableUsers,
	editingNote,
	onCreate,
	onUpdate,
	onCancel,
	isSubmitting,
}: NoteComposerProps) {
	const [body, setBody] = useState(editingNote?.body ?? "");
	const [mentionQuery, setMentionQuery] = useState<string | null>(null);
	const textareaRef = useRef<HTMLTextAreaElement>(null);

	const handleChange = useCallback(
		(e: React.ChangeEvent<HTMLTextAreaElement>) => {
			const value = e.target.value;
			setBody(value);

			// Detect @mention trigger: check if the last token (split on whitespace/newline) starts with @
			const tokens = value.split(/[\s\n]/);
			const lastToken = tokens[tokens.length - 1];
			if (lastToken.startsWith("@") && lastToken.length >= 1) {
				setMentionQuery(lastToken.slice(1));
			} else {
				setMentionQuery(null);
			}
		},
		[],
	);

	const handleSelectUser = useCallback(
		(mentionUser: MentionableUser) => {
			// Replace the last @query token with @[Name](id) followed by a space
			const tokens = body.split(/(\s|\n)/);
			// Find the last token index that starts with @
			let lastAtIndex = -1;
			for (let i = tokens.length - 1; i >= 0; i--) {
				if (tokens[i].startsWith("@")) {
					lastAtIndex = i;
					break;
				}
			}

			let newBody = body;
			if (lastAtIndex !== -1) {
				tokens[lastAtIndex] = `@[${mentionUser.user.name}](${mentionUser.user.id}) `;
				newBody = tokens.join("");
			} else {
				// Fallback: replace last occurrence of @mentionQuery
				const query = mentionQuery ?? "";
				const idx = body.lastIndexOf(`@${query}`);
				if (idx !== -1) {
					newBody =
						body.slice(0, idx) +
						`@[${mentionUser.user.name}](${mentionUser.user.id}) ` +
						body.slice(idx + query.length + 1);
				}
			}

			setBody(newBody);
			setMentionQuery(null);
			textareaRef.current?.focus();
		},
		[body, mentionQuery],
	);

	async function handleSubmit() {
		if (!body.trim()) return;
		const mentionUserIds = extractMentionIds(body);
		if (editingNote) {
			await onUpdate(editingNote.id, body, mentionUserIds);
		} else {
			await onCreate(body, mentionUserIds);
		}
	}

	const filteredUsers =
		mentionQuery !== null
			? mentionableUsers.filter((mu) =>
					mu.user.name.toLowerCase().includes(mentionQuery.toLowerCase()),
				)
			: [];

	return (
		<div className="space-y-2 rounded-lg border p-3 bg-muted/30">
			<div className="relative">
				<Textarea
					ref={textareaRef}
					value={body}
					onChange={handleChange}
					placeholder="Write a note... Use @ to mention someone"
					className="min-h-[80px] resize-none bg-background"
					disabled={isSubmitting}
				/>
				{mentionQuery !== null && filteredUsers.length > 0 && (
					<div className="absolute left-0 right-0 top-full z-50 mt-1 rounded-md border bg-popover shadow-md">
						{filteredUsers.map((mu) => (
							<button
								key={mu.user.id}
								type="button"
								className="flex w-full items-center gap-2 px-3 py-2 text-sm hover:bg-accent hover:text-accent-foreground"
								onMouseDown={(e) => {
									// Prevent textarea blur before click registers
									e.preventDefault();
									handleSelectUser(mu);
								}}
							>
								<div className="size-5 rounded-full bg-muted flex items-center justify-center text-xs font-medium shrink-0">
									{mu.user.name?.[0]?.toUpperCase() ?? "?"}
								</div>
								<span>{mu.user.name}</span>
								<span className="text-xs text-muted-foreground capitalize ml-auto">
									{mu.role.toLowerCase()}
								</span>
							</button>
						))}
					</div>
				)}
			</div>
			<div className="flex justify-end gap-2">
				<Button
					type="button"
					size="sm"
					variant="ghost"
					onClick={onCancel}
					disabled={isSubmitting}
					className="h-7 text-xs"
				>
					Cancel
				</Button>
				<Button
					type="button"
					size="sm"
					onClick={handleSubmit}
					disabled={isSubmitting || !body.trim()}
					className="h-7 text-xs"
				>
					{isSubmitting ? "Saving..." : editingNote ? "Update" : "Add Note"}
				</Button>
			</div>
		</div>
	);
}

interface PersonNotesSectionProps {
	personId: string;
}

export function PersonNotesSection({ personId }: PersonNotesSectionProps) {
	const { user } = useSession();
	const { activeOrganization } = useActiveOrganization();
	const { data: notes = [] } = usePersonNotes(personId);
	const { data: mentionableUsers = [] } = useMentionableUsers(
		activeOrganization?.id ?? "",
	);
	const createNote = useCreatePersonNote();
	const updateNote = useUpdatePersonNote();
	const deleteNote = useDeletePersonNote();
	const isAdmin = isOrganizationAdmin(activeOrganization, user);

	const [collapsed, setCollapsed] = useState(true);
	const [composerOpen, setComposerOpen] = useState(false);
	const [editingNoteId, setEditingNoteId] = useState<string | null>(null);

	return (
		<Card>
			<CardHeader className="pb-3">
				<div className="flex items-center justify-between">
					<CardTitle className="text-base">Internal Notes</CardTitle>
					<div className="flex items-center gap-1">
						{!composerOpen && (
							<Button
								size="sm"
								variant="ghost"
								onClick={() => {
									setEditingNoteId(null);
									setComposerOpen(true);
									setCollapsed(false);
								}}
								className="h-7 gap-1 text-xs"
							>
								<PlusIcon className="size-3" />
								Add Note
							</Button>
						)}
						<Button size="icon" variant="ghost" className="size-7" onClick={() => setCollapsed((c) => !c)}>
							<ChevronDownIcon className={`size-4 transition-transform ${collapsed ? "" : "rotate-180"}`} />
						</Button>
					</div>
				</div>
			</CardHeader>
			{!collapsed && <CardContent className="space-y-3">
				{composerOpen && (
					<NoteComposer
						personId={personId}
						organizationId={activeOrganization?.id ?? ""}
						mentionableUsers={mentionableUsers as MentionableUser[]}
						editingNote={
							editingNoteId
								? (notes as Array<{ id: string; body: string }>).find(
										(n) => n.id === editingNoteId,
									)
								: undefined
						}
						onCreate={async (body, mentionUserIds) => {
							try {
								await createNote.mutateAsync({ personId, body, mentionUserIds });
								toastSuccess("Note added");
								setComposerOpen(false);
							} catch {
								toastError("Failed to add note");
							}
						}}
						onUpdate={async (id, body, mentionUserIds) => {
							try {
								await updateNote.mutateAsync({
									id,
									personId,
									body,
									mentionUserIds,
								});
								toastSuccess("Note updated");
								setComposerOpen(false);
								setEditingNoteId(null);
							} catch {
								toastError("Failed to update note");
							}
						}}
						onCancel={() => {
							setComposerOpen(false);
							setEditingNoteId(null);
						}}
						isSubmitting={createNote.isPending || updateNote.isPending}
					/>
				)}
				{notes.length === 0 && !composerOpen ? (
					<p className="text-sm text-muted-foreground">No notes yet.</p>
				) : (
					(
						notes as Array<{
							id: string;
							body: string;
							createdAt: string | Date;
							author: { id: string; name: string; image: string | null };
						}>
					).map((note) => {
						const canEdit =
							note.author.id === user?.id || isAdmin;
						return (
							<div
								key={note.id}
								className="rounded-lg border p-3 space-y-2"
							>
								<div className="flex items-center justify-between">
									<div className="flex items-center gap-2">
										<div className="size-6 rounded-full bg-muted flex items-center justify-center text-xs font-medium">
											{note.author.name?.[0]?.toUpperCase() ?? "?"}
										</div>
										<span className="text-sm font-medium">
											{note.author.name}
										</span>
										<span className="text-xs text-muted-foreground">
											{new Date(note.createdAt).toLocaleDateString()}
										</span>
									</div>
									{canEdit && (
										<div className="flex gap-1">
											<Button
												size="sm"
												variant="ghost"
												className="h-6 px-2 text-xs"
												onClick={() => {
													setEditingNoteId(note.id);
													setComposerOpen(true);
												}}
											>
												<PencilIcon className="size-3" />
											</Button>
											<Button
												size="sm"
												variant="ghost"
												className="h-6 px-2 text-xs text-destructive hover:text-destructive"
												onClick={async () => {
													try {
														await deleteNote.mutateAsync({
															id: note.id,
															personId,
														});
														toastSuccess("Note deleted");
													} catch {
														toastError("Failed to delete note");
													}
												}}
											>
												<Trash2Icon className="size-3" />
											</Button>
										</div>
									)}
								</div>
								<div className="text-sm leading-relaxed">
									{renderNoteBody(note.body)}
								</div>
							</div>
						);
					})
				)}
			</CardContent>}
		</Card>
	);
}
