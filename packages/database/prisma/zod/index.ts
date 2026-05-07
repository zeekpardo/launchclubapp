/**
 * Prisma Zod Generator - Single File (inlined)
 * Auto-generated. Do not edit.
 */

import * as z from 'zod';
import { Prisma } from '../generated/client';
// File: TransactionIsolationLevel.schema.ts

export const TransactionIsolationLevelSchema = z.enum(['ReadUncommitted', 'ReadCommitted', 'RepeatableRead', 'Serializable'])

export type TransactionIsolationLevel = z.infer<typeof TransactionIsolationLevelSchema>;

// File: UserScalarFieldEnum.schema.ts

export const UserScalarFieldEnumSchema = z.enum(['id', 'name', 'email', 'emailVerified', 'image', 'createdAt', 'updatedAt', 'username', 'role', 'banned', 'banReason', 'banExpires', 'onboardingComplete', 'paymentsCustomerId', 'locale', 'displayUsername', 'twoFactorEnabled'])

export type UserScalarFieldEnum = z.infer<typeof UserScalarFieldEnumSchema>;

// File: SessionScalarFieldEnum.schema.ts

export const SessionScalarFieldEnumSchema = z.enum(['id', 'expiresAt', 'ipAddress', 'userAgent', 'userId', 'impersonatedBy', 'activeOrganizationId', 'token', 'createdAt', 'updatedAt'])

export type SessionScalarFieldEnum = z.infer<typeof SessionScalarFieldEnumSchema>;

// File: AccountScalarFieldEnum.schema.ts

export const AccountScalarFieldEnumSchema = z.enum(['id', 'accountId', 'providerId', 'userId', 'accessToken', 'refreshToken', 'idToken', 'expiresAt', 'password', 'accessTokenExpiresAt', 'refreshTokenExpiresAt', 'scope', 'createdAt', 'updatedAt'])

export type AccountScalarFieldEnum = z.infer<typeof AccountScalarFieldEnumSchema>;

// File: VerificationScalarFieldEnum.schema.ts

export const VerificationScalarFieldEnumSchema = z.enum(['id', 'identifier', 'value', 'expiresAt', 'createdAt', 'updatedAt'])

export type VerificationScalarFieldEnum = z.infer<typeof VerificationScalarFieldEnumSchema>;

// File: PasskeyScalarFieldEnum.schema.ts

export const PasskeyScalarFieldEnumSchema = z.enum(['id', 'name', 'publicKey', 'userId', 'credentialID', 'counter', 'deviceType', 'backedUp', 'transports', 'aaguid', 'createdAt'])

export type PasskeyScalarFieldEnum = z.infer<typeof PasskeyScalarFieldEnumSchema>;

// File: TwoFactorScalarFieldEnum.schema.ts

export const TwoFactorScalarFieldEnumSchema = z.enum(['id', 'secret', 'backupCodes', 'userId'])

export type TwoFactorScalarFieldEnum = z.infer<typeof TwoFactorScalarFieldEnumSchema>;

// File: OrganizationScalarFieldEnum.schema.ts

export const OrganizationScalarFieldEnumSchema = z.enum(['id', 'name', 'slug', 'logo', 'createdAt', 'metadata', 'paymentsCustomerId'])

export type OrganizationScalarFieldEnum = z.infer<typeof OrganizationScalarFieldEnumSchema>;

// File: MemberScalarFieldEnum.schema.ts

export const MemberScalarFieldEnumSchema = z.enum(['id', 'organizationId', 'userId', 'role', 'createdAt'])

export type MemberScalarFieldEnum = z.infer<typeof MemberScalarFieldEnumSchema>;

// File: InvitationScalarFieldEnum.schema.ts

export const InvitationScalarFieldEnumSchema = z.enum(['id', 'organizationId', 'email', 'role', 'status', 'expiresAt', 'inviterId', 'createdAt'])

export type InvitationScalarFieldEnum = z.infer<typeof InvitationScalarFieldEnumSchema>;

// File: InvitationRoleAssignmentScalarFieldEnum.schema.ts

export const InvitationRoleAssignmentScalarFieldEnumSchema = z.enum(['invitationId', 'lcRole', 'siteIds', 'groupIds', 'createdAt'])

export type InvitationRoleAssignmentScalarFieldEnum = z.infer<typeof InvitationRoleAssignmentScalarFieldEnumSchema>;

// File: PurchaseScalarFieldEnum.schema.ts

export const PurchaseScalarFieldEnumSchema = z.enum(['id', 'organizationId', 'userId', 'type', 'customerId', 'subscriptionId', 'productId', 'status', 'createdAt', 'updatedAt'])

export type PurchaseScalarFieldEnum = z.infer<typeof PurchaseScalarFieldEnumSchema>;

// File: AreaScalarFieldEnum.schema.ts

export const AreaScalarFieldEnumSchema = z.enum(['id', 'organizationId', 'name', 'description', 'createdAt', 'updatedAt'])

export type AreaScalarFieldEnum = z.infer<typeof AreaScalarFieldEnumSchema>;

// File: SiteScalarFieldEnum.schema.ts

export const SiteScalarFieldEnumSchema = z.enum(['id', 'areaId', 'name', 'slug', 'addressLine1', 'city', 'stateProvince', 'postalCode', 'country', 'phone', 'email', 'acceptApplications', 'applicationDeadline', 'createdAt', 'updatedAt'])

export type SiteScalarFieldEnum = z.infer<typeof SiteScalarFieldEnumSchema>;

// File: UserSiteScalarFieldEnum.schema.ts

export const UserSiteScalarFieldEnumSchema = z.enum(['userId', 'siteId', 'createdAt'])

export type UserSiteScalarFieldEnum = z.infer<typeof UserSiteScalarFieldEnumSchema>;

// File: HouseholdScalarFieldEnum.schema.ts

export const HouseholdScalarFieldEnumSchema = z.enum(['id', 'organizationId', 'name', 'addressLine1', 'city', 'stateProvince', 'postalCode', 'country', 'phone', 'email', 'createdAt', 'updatedAt'])

export type HouseholdScalarFieldEnum = z.infer<typeof HouseholdScalarFieldEnumSchema>;

// File: PersonScalarFieldEnum.schema.ts

export const PersonScalarFieldEnumSchema = z.enum(['id', 'organizationId', 'householdId', 'firstName', 'lastName', 'email', 'phone', 'dateOfBirth', 'gender', 'personType', 'isActive', 'grade', 'studentId', 'notes', 'allergies', 'medicalNotes', 'avatarUrl', 'createdAt', 'updatedAt'])

export type PersonScalarFieldEnum = z.infer<typeof PersonScalarFieldEnumSchema>;

// File: GuardianScalarFieldEnum.schema.ts

export const GuardianScalarFieldEnumSchema = z.enum(['personId', 'kidId', 'relation'])

export type GuardianScalarFieldEnum = z.infer<typeof GuardianScalarFieldEnumSchema>;

// File: PersonNoteScalarFieldEnum.schema.ts

export const PersonNoteScalarFieldEnumSchema = z.enum(['id', 'organizationId', 'personId', 'authorId', 'body', 'createdAt', 'updatedAt'])

export type PersonNoteScalarFieldEnum = z.infer<typeof PersonNoteScalarFieldEnumSchema>;

// File: PersonNoteMentionScalarFieldEnum.schema.ts

export const PersonNoteMentionScalarFieldEnumSchema = z.enum(['id', 'noteId', 'userId'])

export type PersonNoteMentionScalarFieldEnum = z.infer<typeof PersonNoteMentionScalarFieldEnumSchema>;

// File: GroupScalarFieldEnum.schema.ts

export const GroupScalarFieldEnumSchema = z.enum(['id', 'siteId', 'name', 'description', 'gradeLevel', 'startDate', 'endDate', 'meetingDay', 'meetingTime', 'meetingEndTime', 'meetingRecurrence', 'image', 'createdAt', 'updatedAt'])

export type GroupScalarFieldEnum = z.infer<typeof GroupScalarFieldEnumSchema>;

// File: UserGroupScalarFieldEnum.schema.ts

export const UserGroupScalarFieldEnumSchema = z.enum(['userId', 'groupId', 'createdAt'])

export type UserGroupScalarFieldEnum = z.infer<typeof UserGroupScalarFieldEnumSchema>;

// File: PersonGroupScalarFieldEnum.schema.ts

export const PersonGroupScalarFieldEnumSchema = z.enum(['personId', 'groupId', 'role', 'joinedAt'])

export type PersonGroupScalarFieldEnum = z.infer<typeof PersonGroupScalarFieldEnumSchema>;

// File: EventScalarFieldEnum.schema.ts

export const EventScalarFieldEnumSchema = z.enum(['id', 'groupId', 'name', 'description', 'eventType', 'guestName', 'guestCompany', 'guestIndustry', 'startsAt', 'endsAt', 'createdAt', 'updatedAt'])

export type EventScalarFieldEnum = z.infer<typeof EventScalarFieldEnumSchema>;

// File: EventGroupScalarFieldEnum.schema.ts

export const EventGroupScalarFieldEnumSchema = z.enum(['id', 'eventId', 'groupId'])

export type EventGroupScalarFieldEnum = z.infer<typeof EventGroupScalarFieldEnumSchema>;

// File: AttendanceScalarFieldEnum.schema.ts

export const AttendanceScalarFieldEnumSchema = z.enum(['id', 'eventId', 'personId', 'status', 'notes', 'createdAt'])

export type AttendanceScalarFieldEnum = z.infer<typeof AttendanceScalarFieldEnumSchema>;

// File: ApplicationScalarFieldEnum.schema.ts

export const ApplicationScalarFieldEnumSchema = z.enum(['id', 'siteId', 'parentFirstName', 'parentLastName', 'parentEmail', 'parentPhone', 'parentAddressLine1', 'parentCity', 'parentStateProvince', 'parentPostalCode', 'parentCountry', 'spouseFirstName', 'spouseLastName', 'spouseEmail', 'spousePhone', 'status', 'reviewedAt', 'reviewedBy', 'createdAt', 'updatedAt'])

export type ApplicationScalarFieldEnum = z.infer<typeof ApplicationScalarFieldEnumSchema>;

// File: ApplicationChildScalarFieldEnum.schema.ts

export const ApplicationChildScalarFieldEnumSchema = z.enum(['id', 'applicationId', 'firstName', 'lastName', 'birthday', 'grade', 'isPartOfChurch', 'emergencyContactName', 'emergencyContactPhone', 'emergencyContactEmail', 'photoUrl', 'observationConsent', 'termsConsent', 'photoVideoConsent', 'observationConsentFileUrl', 'termsConsentFileUrl', 'photoVideoConsentFileUrl', 'createdAt'])

export type ApplicationChildScalarFieldEnum = z.infer<typeof ApplicationChildScalarFieldEnumSchema>;

// File: ApplicationChildCustomFieldValueScalarFieldEnum.schema.ts

export const ApplicationChildCustomFieldValueScalarFieldEnumSchema = z.enum(['id', 'applicationChildId', 'customFieldId', 'value', 'createdAt', 'updatedAt'])

export type ApplicationChildCustomFieldValueScalarFieldEnum = z.infer<typeof ApplicationChildCustomFieldValueScalarFieldEnumSchema>;

// File: ApplicationChildFormFieldValueScalarFieldEnum.schema.ts

export const ApplicationChildFormFieldValueScalarFieldEnumSchema = z.enum(['id', 'applicationChildId', 'formFieldId', 'value', 'createdAt'])

export type ApplicationChildFormFieldValueScalarFieldEnum = z.infer<typeof ApplicationChildFormFieldValueScalarFieldEnumSchema>;

// File: GroupResourceScalarFieldEnum.schema.ts

export const GroupResourceScalarFieldEnumSchema = z.enum(['id', 'groupId', 'eventId', 'name', 'url', 'description', 'createdAt', 'updatedAt'])

export type GroupResourceScalarFieldEnum = z.infer<typeof GroupResourceScalarFieldEnumSchema>;

// File: PurchaseRequestScalarFieldEnum.schema.ts

export const PurchaseRequestScalarFieldEnumSchema = z.enum(['id', 'groupId', 'name', 'description', 'dueDate', 'status', 'requestedById', 'reviewedById', 'reviewedAt', 'reviewNote', 'createdAt', 'updatedAt'])

export type PurchaseRequestScalarFieldEnum = z.infer<typeof PurchaseRequestScalarFieldEnumSchema>;

// File: PurchaseRequestItemScalarFieldEnum.schema.ts

export const PurchaseRequestItemScalarFieldEnumSchema = z.enum(['id', 'purchaseRequestId', 'item', 'url', 'amount', 'quantity', 'category', 'createdAt', 'updatedAt'])

export type PurchaseRequestItemScalarFieldEnum = z.infer<typeof PurchaseRequestItemScalarFieldEnumSchema>;

// File: FormScalarFieldEnum.schema.ts

export const FormScalarFieldEnumSchema = z.enum(['id', 'slug', 'name', 'description', 'type', 'status', 'organizationId', 'createdAt', 'updatedAt', 'deletedAt'])

export type FormScalarFieldEnum = z.infer<typeof FormScalarFieldEnumSchema>;

// File: FormSiteScalarFieldEnum.schema.ts

export const FormSiteScalarFieldEnumSchema = z.enum(['formId', 'siteId'])

export type FormSiteScalarFieldEnum = z.infer<typeof FormSiteScalarFieldEnumSchema>;

// File: FormFieldScalarFieldEnum.schema.ts

export const FormFieldScalarFieldEnumSchema = z.enum(['id', 'formId', 'label', 'fieldKey', 'type', 'placeholder', 'helpText', 'required', 'order', 'options', 'validation', 'profileFieldKey', 'customFieldId', 'targetPersonType', 'createdAt', 'updatedAt', 'consentItemId'])

export type FormFieldScalarFieldEnum = z.infer<typeof FormFieldScalarFieldEnumSchema>;

// File: ApplicationFieldValueScalarFieldEnum.schema.ts

export const ApplicationFieldValueScalarFieldEnumSchema = z.enum(['id', 'applicationId', 'formFieldId', 'value', 'createdAt'])

export type ApplicationFieldValueScalarFieldEnum = z.infer<typeof ApplicationFieldValueScalarFieldEnumSchema>;

// File: OrganizationApplicationSettingsScalarFieldEnum.schema.ts

export const OrganizationApplicationSettingsScalarFieldEnumSchema = z.enum(['id', 'organizationId', 'autoMigrate', 'emailNotifications', 'createdAt', 'updatedAt', 'studentIdMode', 'mentorContractUrl', 'mentorSecurityClearanceUrl', 'showMentorContract', 'showMentorSecurityClearance', 'enableMentorDocumentUpload'])

export type OrganizationApplicationSettingsScalarFieldEnum = z.infer<typeof OrganizationApplicationSettingsScalarFieldEnumSchema>;

// File: MentorApplicationScalarFieldEnum.schema.ts

export const MentorApplicationScalarFieldEnumSchema = z.enum(['id', 'organizationId', 'siteId', 'status', 'firstName', 'lastName', 'email', 'phone', 'addressLine1', 'city', 'stateProvince', 'postalCode', 'country', 'mentorContractFileUrl', 'mentorSecurityClearanceFileUrl', 'assignedGroupId', 'reviewedAt', 'reviewedBy', 'createdAt', 'updatedAt'])

export type MentorApplicationScalarFieldEnum = z.infer<typeof MentorApplicationScalarFieldEnumSchema>;

// File: MentorApplicationFormFieldValueScalarFieldEnum.schema.ts

export const MentorApplicationFormFieldValueScalarFieldEnumSchema = z.enum(['id', 'mentorApplicationId', 'formFieldId', 'value', 'createdAt'])

export type MentorApplicationFormFieldValueScalarFieldEnum = z.infer<typeof MentorApplicationFormFieldValueScalarFieldEnumSchema>;

// File: MentorApplicationCustomFieldValueScalarFieldEnum.schema.ts

export const MentorApplicationCustomFieldValueScalarFieldEnumSchema = z.enum(['id', 'mentorApplicationId', 'customFieldId', 'value', 'createdAt'])

export type MentorApplicationCustomFieldValueScalarFieldEnum = z.infer<typeof MentorApplicationCustomFieldValueScalarFieldEnumSchema>;

// File: CustomFieldFolderScalarFieldEnum.schema.ts

export const CustomFieldFolderScalarFieldEnumSchema = z.enum(['id', 'organizationId', 'name', 'nameEs', 'order', 'createdAt', 'updatedAt'])

export type CustomFieldFolderScalarFieldEnum = z.infer<typeof CustomFieldFolderScalarFieldEnumSchema>;

// File: CustomFieldScalarFieldEnum.schema.ts

export const CustomFieldScalarFieldEnumSchema = z.enum(['id', 'organizationId', 'folderId', 'name', 'nameEs', 'type', 'required', 'options', 'order', 'collectInApplication', 'createdAt', 'updatedAt'])

export type CustomFieldScalarFieldEnum = z.infer<typeof CustomFieldScalarFieldEnumSchema>;

// File: CustomFieldValueScalarFieldEnum.schema.ts

export const CustomFieldValueScalarFieldEnumSchema = z.enum(['id', 'customFieldId', 'personId', 'value', 'createdAt', 'updatedAt'])

export type CustomFieldValueScalarFieldEnum = z.infer<typeof CustomFieldValueScalarFieldEnumSchema>;

// File: ApplicationCustomFieldValueScalarFieldEnum.schema.ts

export const ApplicationCustomFieldValueScalarFieldEnumSchema = z.enum(['id', 'applicationId', 'customFieldId', 'value', 'createdAt', 'updatedAt'])

export type ApplicationCustomFieldValueScalarFieldEnum = z.infer<typeof ApplicationCustomFieldValueScalarFieldEnumSchema>;

// File: AcademicRecordScalarFieldEnum.schema.ts

export const AcademicRecordScalarFieldEnumSchema = z.enum(['id', 'personId', 'schoolYear', 'term', 'termGpa', 'cumulativeGpa', 'gradeLevel', 'gradeScale', 'notes', 'recordedById', 'createdAt', 'updatedAt'])

export type AcademicRecordScalarFieldEnum = z.infer<typeof AcademicRecordScalarFieldEnumSchema>;

// File: AcademicYearScalarFieldEnum.schema.ts

export const AcademicYearScalarFieldEnumSchema = z.enum(['id', 'organizationId', 'label', 'startDate', 'endDate', 'isActive', 'createdAt', 'updatedAt'])

export type AcademicYearScalarFieldEnum = z.infer<typeof AcademicYearScalarFieldEnumSchema>;

// File: PersonConsentScalarFieldEnum.schema.ts

export const PersonConsentScalarFieldEnumSchema = z.enum(['id', 'personId', 'academicYearId', 'consentItemId', 'granted', 'grantedAt', 'signatureFileUrl', 'createdAt', 'updatedAt'])

export type PersonConsentScalarFieldEnum = z.infer<typeof PersonConsentScalarFieldEnumSchema>;

// File: NotificationScalarFieldEnum.schema.ts

export const NotificationScalarFieldEnumSchema = z.enum(['id', 'organizationId', 'recipientId', 'type', 'title', 'message', 'link', 'isRead', 'readAt', 'createdAt', 'entityType', 'entityId'])

export type NotificationScalarFieldEnum = z.infer<typeof NotificationScalarFieldEnumSchema>;

// File: ConsentItemScalarFieldEnum.schema.ts

export const ConsentItemScalarFieldEnumSchema = z.enum(['id', 'organizationId', 'name', 'nameES', 'pdfKey', 'applicantType', 'isActive', 'sortOrder', 'createdAt', 'updatedAt'])

export type ConsentItemScalarFieldEnum = z.infer<typeof ConsentItemScalarFieldEnumSchema>;

// File: SortOrder.schema.ts

export const SortOrderSchema = z.enum(['asc', 'desc'])

export type SortOrder = z.infer<typeof SortOrderSchema>;

// File: NullableJsonNullValueInput.schema.ts

export const NullableJsonNullValueInputSchema = z.enum(['DbNull', 'JsonNull'])

export type NullableJsonNullValueInput = z.infer<typeof NullableJsonNullValueInputSchema>;

// File: QueryMode.schema.ts

export const QueryModeSchema = z.enum(['default', 'insensitive'])

export type QueryMode = z.infer<typeof QueryModeSchema>;

// File: NullsOrder.schema.ts

export const NullsOrderSchema = z.enum(['first', 'last'])

export type NullsOrder = z.infer<typeof NullsOrderSchema>;

// File: JsonNullValueFilter.schema.ts

export const JsonNullValueFilterSchema = z.enum(['DbNull', 'JsonNull', 'AnyNull'])

export type JsonNullValueFilter = z.infer<typeof JsonNullValueFilterSchema>;

// File: PurchaseType.schema.ts

export const PurchaseTypeSchema = z.enum(['SUBSCRIPTION', 'ONE_TIME'])

export type PurchaseType = z.infer<typeof PurchaseTypeSchema>;

// File: PersonType.schema.ts

export const PersonTypeSchema = z.enum(['STUDENT', 'PARENT', 'MENTOR'])

export type PersonType = z.infer<typeof PersonTypeSchema>;

// File: EventType.schema.ts

export const EventTypeSchema = z.enum(['regular', 'guest', 'family_site_visit'])

export type EventType = z.infer<typeof EventTypeSchema>;

// File: FormType.schema.ts

export const FormTypeSchema = z.enum(['STUDENT', 'MENTOR'])

export type FormType = z.infer<typeof FormTypeSchema>;

// File: FormStatus.schema.ts

export const FormStatusSchema = z.enum(['PUBLISHED', 'UNPUBLISHED'])

export type FormStatus = z.infer<typeof FormStatusSchema>;

// File: FormFieldType.schema.ts

export const FormFieldTypeSchema = z.enum(['TEXT', 'TEXTAREA', 'NUMBER', 'DATE', 'SELECT', 'CHECKBOX', 'RADIO', 'FILE', 'HEADER', 'PROFILE', 'CUSTOM', 'SITE_SELECTOR', 'CONSENT'])

export type FormFieldType = z.infer<typeof FormFieldTypeSchema>;

// File: CustomFieldType.schema.ts

export const CustomFieldTypeSchema = z.enum(['TEXT', 'TEXTAREA', 'NUMBER', 'CHECKBOX', 'SELECT', 'DATE', 'FILE'])

export type CustomFieldType = z.infer<typeof CustomFieldTypeSchema>;

// File: GpaTerm.schema.ts

export const GpaTermSchema = z.enum(['Q1', 'Q2', 'Q3', 'Q4', 'SEMESTER_1', 'SEMESTER_2', 'TRIMESTER_1', 'TRIMESTER_2', 'TRIMESTER_3', 'ANNUAL'])

export type GpaTerm = z.infer<typeof GpaTermSchema>;

// File: User.schema.ts

export const UserSchema = z.object({
  id: z.string(),
  name: z.string(),
  email: z.string(),
  emailVerified: z.boolean(),
  image: z.string().nullish(),
  createdAt: z.date(),
  updatedAt: z.date(),
  username: z.string().nullish(),
  role: z.string().nullish(),
  banned: z.boolean().nullish(),
  banReason: z.string().nullish(),
  banExpires: z.date().nullish(),
  onboardingComplete: z.boolean(),
  paymentsCustomerId: z.string().nullish(),
  locale: z.string().nullish(),
  displayUsername: z.string().nullish(),
  twoFactorEnabled: z.boolean().nullish(),
});

export type UserType = z.infer<typeof UserSchema>;


// File: Session.schema.ts

export const SessionSchema = z.object({
  id: z.string(),
  expiresAt: z.date(),
  ipAddress: z.string().nullish(),
  userAgent: z.string().nullish(),
  userId: z.string(),
  impersonatedBy: z.string().nullish(),
  activeOrganizationId: z.string().nullish(),
  token: z.string(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export type SessionType = z.infer<typeof SessionSchema>;


// File: Account.schema.ts

export const AccountSchema = z.object({
  id: z.string(),
  accountId: z.string(),
  providerId: z.string(),
  userId: z.string(),
  accessToken: z.string().nullish(),
  refreshToken: z.string().nullish(),
  idToken: z.string().nullish(),
  expiresAt: z.date().nullish(),
  password: z.string().nullish(),
  accessTokenExpiresAt: z.date().nullish(),
  refreshTokenExpiresAt: z.date().nullish(),
  scope: z.string().nullish(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export type AccountType = z.infer<typeof AccountSchema>;


// File: Verification.schema.ts

export const VerificationSchema = z.object({
  id: z.string(),
  identifier: z.string(),
  value: z.string(),
  expiresAt: z.date(),
  createdAt: z.date().nullish(),
  updatedAt: z.date().nullish(),
});

export type VerificationType = z.infer<typeof VerificationSchema>;


// File: Passkey.schema.ts

export const PasskeySchema = z.object({
  id: z.string(),
  name: z.string().nullish(),
  publicKey: z.string(),
  userId: z.string(),
  credentialID: z.string(),
  counter: z.number().int(),
  deviceType: z.string(),
  backedUp: z.boolean(),
  transports: z.string().nullish(),
  aaguid: z.string().nullish(),
  createdAt: z.date().nullish(),
});

export type PasskeyType = z.infer<typeof PasskeySchema>;


// File: TwoFactor.schema.ts

export const TwoFactorSchema = z.object({
  id: z.string(),
  secret: z.string(),
  backupCodes: z.string(),
  userId: z.string(),
});

export type TwoFactorType = z.infer<typeof TwoFactorSchema>;


// File: Organization.schema.ts

export const OrganizationSchema = z.object({
  id: z.string(),
  name: z.string(),
  slug: z.string().nullish(),
  logo: z.string().nullish(),
  createdAt: z.date(),
  metadata: z.string().nullish(),
  paymentsCustomerId: z.string().nullish(),
});

export type OrganizationType = z.infer<typeof OrganizationSchema>;


// File: Member.schema.ts

export const MemberSchema = z.object({
  id: z.string(),
  organizationId: z.string(),
  userId: z.string(),
  role: z.string(),
  createdAt: z.date(),
});

export type MemberType = z.infer<typeof MemberSchema>;


// File: Invitation.schema.ts

export const InvitationSchema = z.object({
  id: z.string(),
  organizationId: z.string(),
  email: z.string(),
  role: z.string().nullish(),
  status: z.string(),
  expiresAt: z.date(),
  inviterId: z.string(),
  createdAt: z.date(),
});

export type InvitationType = z.infer<typeof InvitationSchema>;


// File: InvitationRoleAssignment.schema.ts

export const InvitationRoleAssignmentSchema = z.object({
  invitationId: z.string(),
  lcRole: z.string(),
  siteIds: z.array(z.string()),
  groupIds: z.array(z.string()),
  createdAt: z.date(),
});

export type InvitationRoleAssignmentType = z.infer<typeof InvitationRoleAssignmentSchema>;


// File: Purchase.schema.ts

export const PurchaseSchema = z.object({
  id: z.string(),
  organizationId: z.string().nullish(),
  userId: z.string().nullish(),
  type: PurchaseTypeSchema,
  customerId: z.string(),
  subscriptionId: z.string().nullish(),
  productId: z.string(),
  status: z.string().nullish(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export type PurchaseModel = z.infer<typeof PurchaseSchema>;

// File: Area.schema.ts

export const AreaSchema = z.object({
  id: z.string(),
  organizationId: z.string(),
  name: z.string(),
  description: z.string().nullish(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export type AreaType = z.infer<typeof AreaSchema>;


// File: Site.schema.ts

export const SiteSchema = z.object({
  id: z.string(),
  areaId: z.string(),
  name: z.string(),
  slug: z.string(),
  addressLine1: z.string().nullish(),
  city: z.string().nullish(),
  stateProvince: z.string().nullish(),
  postalCode: z.string().nullish(),
  country: z.string().nullish(),
  phone: z.string().nullish(),
  email: z.string().nullish(),
  acceptApplications: z.boolean().default(true),
  applicationDeadline: z.date().nullish(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export type SiteType = z.infer<typeof SiteSchema>;


// File: UserSite.schema.ts

export const UserSiteSchema = z.object({
  userId: z.string(),
  siteId: z.string(),
  createdAt: z.date(),
});

export type UserSiteType = z.infer<typeof UserSiteSchema>;


// File: Household.schema.ts

export const HouseholdSchema = z.object({
  id: z.string(),
  organizationId: z.string(),
  name: z.string(),
  addressLine1: z.string().nullish(),
  city: z.string().nullish(),
  stateProvince: z.string().nullish(),
  postalCode: z.string().nullish(),
  country: z.string().nullish(),
  phone: z.string().nullish(),
  email: z.string().nullish(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export type HouseholdType = z.infer<typeof HouseholdSchema>;


// File: Person.schema.ts

export const PersonSchema = z.object({
  id: z.string(),
  organizationId: z.string(),
  householdId: z.string().nullish(),
  firstName: z.string(),
  lastName: z.string(),
  email: z.string().nullish(),
  phone: z.string().nullish(),
  dateOfBirth: z.date().nullish(),
  gender: z.string().nullish(),
  personType: PersonTypeSchema.default("STUDENT"),
  isActive: z.boolean().default(true),
  grade: z.string().nullish(),
  studentId: z.string().nullish(),
  notes: z.string().nullish(),
  allergies: z.string().nullish(),
  medicalNotes: z.string().nullish(),
  avatarUrl: z.string().nullish(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export type PersonModel = z.infer<typeof PersonSchema>;

// File: Guardian.schema.ts

export const GuardianSchema = z.object({
  personId: z.string(),
  kidId: z.string(),
  relation: z.string().nullish(),
});

export type GuardianType = z.infer<typeof GuardianSchema>;


// File: PersonNote.schema.ts

export const PersonNoteSchema = z.object({
  id: z.string(),
  organizationId: z.string(),
  personId: z.string(),
  authorId: z.string(),
  body: z.string(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export type PersonNoteType = z.infer<typeof PersonNoteSchema>;


// File: PersonNoteMention.schema.ts

export const PersonNoteMentionSchema = z.object({
  id: z.string(),
  noteId: z.string(),
  userId: z.string(),
});

export type PersonNoteMentionType = z.infer<typeof PersonNoteMentionSchema>;


// File: Group.schema.ts

export const GroupSchema = z.object({
  id: z.string(),
  siteId: z.string(),
  name: z.string(),
  description: z.string().nullish(),
  gradeLevel: z.string().nullish(),
  startDate: z.date().nullish(),
  endDate: z.date().nullish(),
  meetingDay: z.string().nullish(),
  meetingTime: z.string().nullish(),
  meetingEndTime: z.string().nullish(),
  meetingRecurrence: z.string().nullish(),
  image: z.string().nullish(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export type GroupType = z.infer<typeof GroupSchema>;


// File: UserGroup.schema.ts

export const UserGroupSchema = z.object({
  userId: z.string(),
  groupId: z.string(),
  createdAt: z.date(),
});

export type UserGroupType = z.infer<typeof UserGroupSchema>;


// File: PersonGroup.schema.ts

export const PersonGroupSchema = z.object({
  personId: z.string(),
  groupId: z.string(),
  role: z.string().default("MEMBER"),
  joinedAt: z.date(),
});

export type PersonGroupType = z.infer<typeof PersonGroupSchema>;


// File: Event.schema.ts

export const EventSchema = z.object({
  id: z.string(),
  groupId: z.string().nullish(),
  name: z.string(),
  description: z.string().nullish(),
  eventType: EventTypeSchema.default("regular"),
  guestName: z.string().nullish(),
  guestCompany: z.string().nullish(),
  guestIndustry: z.string().nullish(),
  startsAt: z.date(),
  endsAt: z.date().nullish(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export type EventModel = z.infer<typeof EventSchema>;

// File: EventGroup.schema.ts

export const EventGroupSchema = z.object({
  id: z.string(),
  eventId: z.string(),
  groupId: z.string(),
});

export type EventGroupType = z.infer<typeof EventGroupSchema>;


// File: Attendance.schema.ts

export const AttendanceSchema = z.object({
  id: z.string(),
  eventId: z.string(),
  personId: z.string(),
  status: z.string().default("PRESENT"),
  notes: z.string().nullish(),
  createdAt: z.date(),
});

export type AttendanceType = z.infer<typeof AttendanceSchema>;


// File: Application.schema.ts

export const ApplicationSchema = z.object({
  id: z.string(),
  siteId: z.string(),
  parentFirstName: z.string(),
  parentLastName: z.string(),
  parentEmail: z.string().nullish(),
  parentPhone: z.string().nullish(),
  parentAddressLine1: z.string().nullish(),
  parentCity: z.string().nullish(),
  parentStateProvince: z.string().nullish(),
  parentPostalCode: z.string().nullish(),
  parentCountry: z.string().nullish(),
  spouseFirstName: z.string().nullish(),
  spouseLastName: z.string().nullish(),
  spouseEmail: z.string().nullish(),
  spousePhone: z.string().nullish(),
  status: z.string().default("PENDING"),
  reviewedAt: z.date().nullish(),
  reviewedBy: z.string().nullish(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export type ApplicationType = z.infer<typeof ApplicationSchema>;


// File: ApplicationChild.schema.ts

export const ApplicationChildSchema = z.object({
  id: z.string(),
  applicationId: z.string(),
  firstName: z.string(),
  lastName: z.string(),
  birthday: z.date().nullish(),
  grade: z.string().nullish(),
  isPartOfChurch: z.boolean(),
  emergencyContactName: z.string().nullish(),
  emergencyContactPhone: z.string().nullish(),
  emergencyContactEmail: z.string().nullish(),
  photoUrl: z.string().nullish(),
  observationConsent: z.boolean(),
  termsConsent: z.boolean(),
  photoVideoConsent: z.boolean(),
  observationConsentFileUrl: z.string().nullish(),
  termsConsentFileUrl: z.string().nullish(),
  photoVideoConsentFileUrl: z.string().nullish(),
  createdAt: z.date(),
});

export type ApplicationChildType = z.infer<typeof ApplicationChildSchema>;


// File: ApplicationChildCustomFieldValue.schema.ts

export const ApplicationChildCustomFieldValueSchema = z.object({
  id: z.string(),
  applicationChildId: z.string(),
  customFieldId: z.string(),
  value: z.string().nullish(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export type ApplicationChildCustomFieldValueType = z.infer<typeof ApplicationChildCustomFieldValueSchema>;


// File: ApplicationChildFormFieldValue.schema.ts

export const ApplicationChildFormFieldValueSchema = z.object({
  id: z.string(),
  applicationChildId: z.string(),
  formFieldId: z.string(),
  value: z.string(),
  createdAt: z.date(),
});

export type ApplicationChildFormFieldValueType = z.infer<typeof ApplicationChildFormFieldValueSchema>;


// File: GroupResource.schema.ts

export const GroupResourceSchema = z.object({
  id: z.string(),
  groupId: z.string(),
  eventId: z.string().nullish(),
  name: z.string(),
  url: z.string(),
  description: z.string().nullish(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export type GroupResourceType = z.infer<typeof GroupResourceSchema>;


// File: PurchaseRequest.schema.ts

export const PurchaseRequestSchema = z.object({
  id: z.string(),
  groupId: z.string(),
  name: z.string(),
  description: z.string(),
  dueDate: z.date().nullish(),
  status: z.string().default("PENDING"),
  requestedById: z.string(),
  reviewedById: z.string().nullish(),
  reviewedAt: z.date().nullish(),
  reviewNote: z.string().nullish(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export type PurchaseRequestType = z.infer<typeof PurchaseRequestSchema>;


// File: PurchaseRequestItem.schema.ts

export const PurchaseRequestItemSchema = z.object({
  id: z.string(),
  purchaseRequestId: z.string(),
  item: z.string(),
  url: z.string().nullish(),
  amount: z.instanceof(Prisma.Decimal, {
  message: "Field 'amount' must be a Decimal. Location: ['Models', 'PurchaseRequestItem']",
}),
  quantity: z.number().int().default(1),
  category: z.string(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export type PurchaseRequestItemType = z.infer<typeof PurchaseRequestItemSchema>;


// File: Form.schema.ts

export const FormSchema = z.object({
  id: z.string(),
  slug: z.string(),
  name: z.string(),
  description: z.string().nullish(),
  type: FormTypeSchema,
  status: FormStatusSchema.default("UNPUBLISHED"),
  organizationId: z.string(),
  createdAt: z.date(),
  updatedAt: z.date(),
  deletedAt: z.date().nullish(),
});

export type FormModel = z.infer<typeof FormSchema>;

// File: FormSite.schema.ts

export const FormSiteSchema = z.object({
  formId: z.string(),
  siteId: z.string(),
});

export type FormSiteType = z.infer<typeof FormSiteSchema>;


// File: FormField.schema.ts

export const FormFieldSchema = z.object({
  id: z.string(),
  formId: z.string().nullish(),
  label: z.string(),
  fieldKey: z.string(),
  type: FormFieldTypeSchema,
  placeholder: z.string().nullish(),
  helpText: z.string().nullish(),
  required: z.boolean(),
  order: z.number().int(),
  options: z.unknown().refine((val) => { const getDepth = (obj: unknown, depth: number = 0): number => { if (depth > 10) return depth; if (obj === null || typeof obj !== 'object') return depth; const values = Object.values(obj as Record<string, unknown>); if (values.length === 0) return depth; return Math.max(...values.map(v => getDepth(v, depth + 1))); }; return getDepth(val) <= 10; }, "JSON nesting depth exceeds maximum of 10").nullish(),
  validation: z.unknown().refine((val) => { const getDepth = (obj: unknown, depth: number = 0): number => { if (depth > 10) return depth; if (obj === null || typeof obj !== 'object') return depth; const values = Object.values(obj as Record<string, unknown>); if (values.length === 0) return depth; return Math.max(...values.map(v => getDepth(v, depth + 1))); }; return getDepth(val) <= 10; }, "JSON nesting depth exceeds maximum of 10").nullish(),
  profileFieldKey: z.string().nullish(),
  customFieldId: z.string().nullish(),
  targetPersonType: PersonTypeSchema.nullish(),
  createdAt: z.date(),
  updatedAt: z.date(),
  consentItemId: z.string().nullish(),
});

export type FormFieldModel = z.infer<typeof FormFieldSchema>;

// File: ApplicationFieldValue.schema.ts

export const ApplicationFieldValueSchema = z.object({
  id: z.string(),
  applicationId: z.string(),
  formFieldId: z.string(),
  value: z.string(),
  createdAt: z.date(),
});

export type ApplicationFieldValueType = z.infer<typeof ApplicationFieldValueSchema>;


// File: OrganizationApplicationSettings.schema.ts

export const OrganizationApplicationSettingsSchema = z.object({
  id: z.string(),
  organizationId: z.string(),
  autoMigrate: z.boolean(),
  emailNotifications: z.boolean(),
  createdAt: z.date(),
  updatedAt: z.date(),
  studentIdMode: z.string().default("auto"),
  mentorContractUrl: z.string().nullish(),
  mentorSecurityClearanceUrl: z.string().nullish(),
  showMentorContract: z.boolean(),
  showMentorSecurityClearance: z.boolean(),
  enableMentorDocumentUpload: z.boolean(),
});

export type OrganizationApplicationSettingsType = z.infer<typeof OrganizationApplicationSettingsSchema>;


// File: MentorApplication.schema.ts

export const MentorApplicationSchema = z.object({
  id: z.string(),
  organizationId: z.string(),
  siteId: z.string().nullish(),
  status: z.string().default("PENDING"),
  firstName: z.string(),
  lastName: z.string(),
  email: z.string(),
  phone: z.string().nullish(),
  addressLine1: z.string().nullish(),
  city: z.string().nullish(),
  stateProvince: z.string().nullish(),
  postalCode: z.string().nullish(),
  country: z.string().nullish(),
  mentorContractFileUrl: z.string().nullish(),
  mentorSecurityClearanceFileUrl: z.string().nullish(),
  assignedGroupId: z.string().nullish(),
  reviewedAt: z.date().nullish(),
  reviewedBy: z.string().nullish(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export type MentorApplicationType = z.infer<typeof MentorApplicationSchema>;


// File: MentorApplicationFormFieldValue.schema.ts

export const MentorApplicationFormFieldValueSchema = z.object({
  id: z.string(),
  mentorApplicationId: z.string(),
  formFieldId: z.string(),
  value: z.string(),
  createdAt: z.date(),
});

export type MentorApplicationFormFieldValueType = z.infer<typeof MentorApplicationFormFieldValueSchema>;


// File: MentorApplicationCustomFieldValue.schema.ts

export const MentorApplicationCustomFieldValueSchema = z.object({
  id: z.string(),
  mentorApplicationId: z.string(),
  customFieldId: z.string(),
  value: z.string().nullish(),
  createdAt: z.date(),
});

export type MentorApplicationCustomFieldValueType = z.infer<typeof MentorApplicationCustomFieldValueSchema>;


// File: CustomFieldFolder.schema.ts

export const CustomFieldFolderSchema = z.object({
  id: z.string(),
  organizationId: z.string(),
  name: z.string(),
  nameEs: z.string().nullish(),
  order: z.number().int(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export type CustomFieldFolderType = z.infer<typeof CustomFieldFolderSchema>;


// File: CustomField.schema.ts

export const CustomFieldSchema = z.object({
  id: z.string(),
  organizationId: z.string(),
  folderId: z.string().nullish(),
  name: z.string(),
  nameEs: z.string().nullish(),
  type: CustomFieldTypeSchema,
  required: z.boolean(),
  options: z.array(z.string()),
  order: z.number().int(),
  collectInApplication: z.boolean(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export type CustomFieldModel = z.infer<typeof CustomFieldSchema>;

// File: CustomFieldValue.schema.ts

export const CustomFieldValueSchema = z.object({
  id: z.string(),
  customFieldId: z.string(),
  personId: z.string(),
  value: z.string().nullish(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export type CustomFieldValueType = z.infer<typeof CustomFieldValueSchema>;


// File: ApplicationCustomFieldValue.schema.ts

export const ApplicationCustomFieldValueSchema = z.object({
  id: z.string(),
  applicationId: z.string(),
  customFieldId: z.string(),
  value: z.string().nullish(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export type ApplicationCustomFieldValueType = z.infer<typeof ApplicationCustomFieldValueSchema>;


// File: AcademicRecord.schema.ts

export const AcademicRecordSchema = z.object({
  id: z.string(),
  personId: z.string(),
  schoolYear: z.string(),
  term: GpaTermSchema,
  termGpa: z.number().nullish(),
  cumulativeGpa: z.number().nullish(),
  gradeLevel: z.string().nullish(),
  gradeScale: z.number().default(4.0),
  notes: z.string().nullish(),
  recordedById: z.string().nullish(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export type AcademicRecordType = z.infer<typeof AcademicRecordSchema>;


// File: AcademicYear.schema.ts

export const AcademicYearSchema = z.object({
  id: z.string(),
  organizationId: z.string(),
  label: z.string(),
  startDate: z.date().nullish(),
  endDate: z.date().nullish(),
  isActive: z.boolean().default(true),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export type AcademicYearType = z.infer<typeof AcademicYearSchema>;


// File: PersonConsent.schema.ts

export const PersonConsentSchema = z.object({
  id: z.string(),
  personId: z.string(),
  academicYearId: z.string(),
  consentItemId: z.string(),
  granted: z.boolean(),
  grantedAt: z.date().nullish(),
  signatureFileUrl: z.string().nullish(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export type PersonConsentType = z.infer<typeof PersonConsentSchema>;


// File: Notification.schema.ts

export const NotificationSchema = z.object({
  id: z.string(),
  organizationId: z.string(),
  recipientId: z.string(),
  type: z.string(),
  title: z.string(),
  message: z.string(),
  link: z.string().nullish(),
  isRead: z.boolean(),
  readAt: z.date().nullish(),
  createdAt: z.date(),
  entityType: z.string().nullish(),
  entityId: z.string().nullish(),
});

export type NotificationType = z.infer<typeof NotificationSchema>;


// File: ConsentItem.schema.ts

export const ConsentItemSchema = z.object({
  id: z.string(),
  organizationId: z.string(),
  name: z.string(),
  nameES: z.string().nullish(),
  pdfKey: z.string().nullish(),
  applicantType: PersonTypeSchema,
  isActive: z.boolean().default(true),
  sortOrder: z.number().int(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export type ConsentItemType = z.infer<typeof ConsentItemSchema>;

