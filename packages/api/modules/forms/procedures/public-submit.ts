import { ORPCError } from "@orpc/client";
import {
  getOrganizationBySlug,
  getFormBySlug,
  createApplication,
  createMentorApplication,
  createPerson,
  updatePerson,
  addGuardian,
  createHousehold,
  db,
} from "@repo/database";
import { publicProcedure } from "../../../orpc/procedures";
import { publicSubmitFormSchema } from "../types";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Extract the string value of a PROFILE field by its profileFieldKey from a fieldId→value map. */
function profileValue(
  fields: Record<string, string>,
  formFields: { id: string; profileFieldKey?: string | null }[],
  key: string,
): string | undefined {
  const field = formFields.find((f) => f.profileFieldKey === key);
  if (!field) return undefined;
  return fields[field.id] ?? undefined;
}

interface PersonProfileUpdates {
  firstName?: string;
  lastName?: string;
  email?: string;
  phone?: string;
  dateOfBirth?: Date;
  gender?: string;
  grade?: string;
  studentId?: string;
  notes?: string;
  allergies?: string;
  medicalNotes?: string;
  avatarUrl?: string;
}

// Known person profile field keys that map directly to Person columns
const PERSON_PROFILE_STRING_KEYS: ReadonlySet<keyof PersonProfileUpdates> = new Set([
  "firstName",
  "lastName",
  "email",
  "phone",
  "gender",
  "grade",
  "studentId",
  "notes",
  "allergies",
  "medicalNotes",
  "avatarUrl",
]);

/** Build the Person column updates from PROFILE-type form fields. */
function buildPersonProfileUpdates(
  fields: Record<string, string>,
  formFields: { id: string; type: string; profileFieldKey?: string | null }[],
): PersonProfileUpdates {
  const updates: PersonProfileUpdates = {};
  for (const ff of formFields) {
    if (ff.type !== "PROFILE" || !ff.profileFieldKey) continue;
    const val = fields[ff.id];
    if (val === undefined || val === "") continue;
    if (ff.profileFieldKey === "dateOfBirth") {
      updates.dateOfBirth = new Date(val);
    } else if (PERSON_PROFILE_STRING_KEYS.has(ff.profileFieldKey as keyof PersonProfileUpdates)) {
      (updates as Record<string, string>)[ff.profileFieldKey] = val;
    }
  }
  return updates;
}

/** Build custom field value pairs from CUSTOM-type form fields. */
function buildCustomFieldValues(
  fields: Record<string, string>,
  formFields: { id: string; type: string; customFieldId?: string | null }[],
): { customFieldId: string; value: string }[] {
  const values: { customFieldId: string; value: string }[] = [];
  for (const ff of formFields) {
    if (ff.type !== "CUSTOM" || !ff.customFieldId) continue;
    const val = fields[ff.id];
    if (val === undefined || val === "") continue;
    values.push({ customFieldId: ff.customFieldId, value: val });
  }
  return values;
}

/** Build ApplicationFieldValue pairs for non-PROFILE, non-CUSTOM fields. */
function buildAppFieldValues(
  fields: Record<string, string>,
  formFields: { id: string; type: string }[],
): { formFieldId: string; value: string }[] {
  const values: { formFieldId: string; value: string }[] = [];
  for (const ff of formFields) {
    if (ff.type === "PROFILE" || ff.type === "CUSTOM" || ff.type === "HEADER" || ff.type === "SITE_SELECTOR") continue;
    const val = fields[ff.id];
    if (val === undefined || val === "") continue;
    values.push({ formFieldId: ff.id, value: val });
  }
  return values;
}

/** Validate that all required fields have non-empty values. */
function validateRequiredFields(
  fields: Record<string, string>,
  formFields: { id: string; label: string; required: boolean; type: string }[],
): void {
  const missing: string[] = [];
  for (const ff of formFields) {
    if (!ff.required) continue;
    if (ff.type === "HEADER" || ff.type === "SITE_SELECTOR") continue;
    const val = fields[ff.id];
    // CONSENT fields: "true" (agreed) or "agreed:{fileKey}" (agreed + uploaded) are valid
    if (ff.type === "CONSENT") {
      const agreed = val === "true" || val?.startsWith("agreed:");
      if (!agreed) missing.push(ff.label);
    } else if (!val || val.trim() === "") {
      missing.push(ff.label);
    }
  }
  if (missing.length > 0) {
    throw new ORPCError("BAD_REQUEST", {
      message: `Missing required fields: ${missing.join(", ")}`,
    });
  }
}

// ---------------------------------------------------------------------------
// Procedure
// ---------------------------------------------------------------------------

export const publicSubmitForm = publicProcedure
  .route({
    method: "POST",
    path: "/public/forms/{orgSlug}/{formSlug}/submit",
    tags: ["Forms"],
    summary: "Submit a public form",
  })
  .input(publicSubmitFormSchema)
  .handler(async ({ input }) => {
    const org = await getOrganizationBySlug(input.orgSlug);
    if (!org) throw new ORPCError("NOT_FOUND");

    const form = await getFormBySlug(org.id, input.formSlug);
    if (!form) throw new ORPCError("NOT_FOUND");
    if (form.deletedAt) throw new ORPCError("NOT_FOUND");
    if (form.status === "UNPUBLISHED") {
      throw new ORPCError("NOT_FOUND", { message: "This form isn't available." });
    }

    // Determine the target site: use provided siteId or fall back to first form site
    const formSiteIds = form.formSites.map((fs) => fs.siteId);
    const targetSiteId = input.siteId && formSiteIds.includes(input.siteId)
      ? input.siteId
      : formSiteIds[0];

    if (!targetSiteId) {
      throw new ORPCError("BAD_REQUEST", { message: "No site is linked to this form." });
    }

    const allFields = form.fields;

    // -----------------------------------------------------------------------
    // MENTOR form submission
    // -----------------------------------------------------------------------
    if (form.type === "MENTOR") {
      const submittedFields = input.fields ?? {};
      const visibleFields = allFields.filter((f) => f.type !== "HEADER" && f.type !== "SITE_SELECTOR");

      validateRequiredFields(submittedFields, visibleFields);

      // Extract named profile fields for the top-level mentor application columns
      const firstName = profileValue(submittedFields, allFields, "firstName") ?? "";
      const lastName = profileValue(submittedFields, allFields, "lastName") ?? "";
      const email = profileValue(submittedFields, allFields, "email") ?? "";
      const phone = profileValue(submittedFields, allFields, "phone");
      const addressLine1 = profileValue(submittedFields, allFields, "addressLine1");
      const city = profileValue(submittedFields, allFields, "city");
      const stateProvince = profileValue(submittedFields, allFields, "stateProvince");
      const postalCode = profileValue(submittedFields, allFields, "postalCode");
      const country = profileValue(submittedFields, allFields, "country");

      if (!email) {
        throw new ORPCError("BAD_REQUEST", { message: "Email is required for mentor applications." });
      }

      const mentorAppFieldValues = buildAppFieldValues(submittedFields, allFields);
      const mentorCustomFieldValues = buildCustomFieldValues(submittedFields, allFields);

      const result = await createMentorApplication({
        organizationId: org.id,
        siteId: targetSiteId,
        firstName,
        lastName,
        email,
        phone,
        addressLine1,
        city,
        stateProvince,
        postalCode,
        country,
        formFieldValues: mentorAppFieldValues.length ? mentorAppFieldValues : undefined,
        profileFieldValues: mentorCustomFieldValues.length ? mentorCustomFieldValues : undefined,
      });

      return { success: true, mentorApplicationId: result.id };
    }

    // -----------------------------------------------------------------------
    // STUDENT form submission
    // -----------------------------------------------------------------------
    const parentFields = input.parentFields ?? {};
    const students = input.students ?? [];

    // Split form fields by targetPersonType
    const parentFormFields = allFields.filter(
      (f) => f.targetPersonType === "PARENT" || f.targetPersonType === null,
    );
    const studentFormFields = allFields.filter(
      (f) => f.targetPersonType === "STUDENT",
    );
    const parentVisibleFields = parentFormFields.filter(
      (f) => f.type !== "HEADER" && f.type !== "SITE_SELECTOR",
    );

    validateRequiredFields(parentFields, parentVisibleFields);
    for (const studentEntry of students) {
      const studentVisibleFields = studentFormFields.filter(
        (f) => f.type !== "HEADER" && f.type !== "SITE_SELECTOR",
      );
      validateRequiredFields(studentEntry, studentVisibleFields);
    }

    // Extract parent identity fields.
    // PROFILE form fields (added via builder) are keyed by field ID.
    // The hardcoded layout inputs fall back to their fixed key names.
    const parentFirstName =
      profileValue(parentFields, parentFormFields, "firstName") ??
      parentFields["parentFirstName"] ?? "";
    const parentLastName =
      profileValue(parentFields, parentFormFields, "lastName") ??
      parentFields["parentLastName"] ?? "";
    const parentEmail =
      profileValue(parentFields, parentFormFields, "email") ??
      parentFields["parentEmail"];
    const parentPhone =
      profileValue(parentFields, parentFormFields, "phone") ??
      parentFields["parentPhone"];
    const parentAddressLine1 = profileValue(parentFields, parentFormFields, "addressLine1");
    const parentCity = profileValue(parentFields, parentFormFields, "city");
    const parentStateProvince = profileValue(parentFields, parentFormFields, "stateProvince");
    const parentPostalCode = profileValue(parentFields, parentFormFields, "postalCode");
    const parentCountry = profileValue(parentFields, parentFormFields, "country");

    if (!parentFirstName || !parentLastName) {
      throw new ORPCError("BAD_REQUEST", { message: "Parent first name and last name are required." });
    }

    // Build field value arrays for the Application record
    // appProfileFieldValues → ApplicationCustomFieldValue (customFieldId-based)
    const appProfileFieldValues = buildCustomFieldValues(parentFields, parentFormFields);
    // appFormFieldValues → ApplicationFieldValue (formFieldId-based, stored after createApplication)
    const appFormFieldValues = buildAppFieldValues(parentFields, parentFormFields);

    // Build student children array for createApplication
    const childrenData = students.map((studentEntry) => {
      // firstName/lastName come in as direct keys (hardcoded layout inputs)
      const firstName =
        profileValue(studentEntry, studentFormFields, "firstName") ??
        studentEntry["firstName"] ?? "";
      const lastName =
        profileValue(studentEntry, studentFormFields, "lastName") ??
        studentEntry["lastName"] ?? "";
      const birthdayStr = profileValue(studentEntry, studentFormFields, "dateOfBirth");
      const grade = profileValue(studentEntry, studentFormFields, "grade");

      const childFormFieldValues = buildAppFieldValues(studentEntry, studentFormFields);
      const childCustomFieldValues = buildCustomFieldValues(studentEntry, studentFormFields);

      return {
        firstName,
        lastName,
        birthday: birthdayStr ? new Date(birthdayStr) : undefined,
        grade,
        formFieldValues: childFormFieldValues.length ? childFormFieldValues : undefined,
        profileFieldValues: childCustomFieldValues.length ? childCustomFieldValues : undefined,
      };
    });

    // Create the Application record (legacy flat structure used for tracking/review)
    const application = await createApplication({
      siteId: targetSiteId,
      parentFirstName,
      parentLastName,
      parentEmail,
      parentPhone,
      parentAddressLine1,
      parentCity,
      parentStateProvince,
      parentPostalCode,
      parentCountry,
      children: childrenData,
      profileFieldValues: appProfileFieldValues.length ? appProfileFieldValues : undefined,
    });

    // Also store top-level ApplicationFieldValues for any non-profile/non-custom parent fields
    if (appFormFieldValues.length > 0) {
      await db.applicationFieldValue.createMany({
        data: appFormFieldValues.map((v) => ({
          applicationId: application.id,
          formFieldId: v.formFieldId,
          value: v.value,
        })),
        skipDuplicates: true,
      });
    }

    // Upsert Person records (PARENT + STUDENT) if parent email is provided
    if (parentEmail) {
      const parentProfileUpdates = buildPersonProfileUpdates(parentFields, parentFormFields);

      // Find existing parent in this org by email
      const existingParent = await db.person.findFirst({
        where: { organizationId: org.id, email: parentEmail, personType: "PARENT" },
      });

      let parentPersonId: string;
      let parentHouseholdId: string | null;

      if (existingParent) {
        // Update existing parent
        await updatePerson(existingParent.id, {
          ...parentProfileUpdates,
          firstName: parentFirstName || existingParent.firstName,
          lastName: parentLastName || existingParent.lastName,
          phone: parentPhone ?? existingParent.phone ?? undefined,
        });
        parentPersonId = existingParent.id;
        parentHouseholdId = existingParent.householdId;
      } else {
        // Create household + parent
        const household = await createHousehold({
          organizationId: org.id,
          name: `${parentLastName} Family`,
          email: parentEmail,
          phone: parentPhone,
          addressLine1: parentAddressLine1,
          city: parentCity,
          stateProvince: parentStateProvince,
          postalCode: parentPostalCode,
          country: parentCountry,
        });

        const newParent = await createPerson({
          organizationId: org.id,
          householdId: household.id,
          firstName: parentFirstName,
          lastName: parentLastName,
          email: parentEmail,
          phone: parentPhone,
          personType: "PARENT",
          ...parentProfileUpdates,
        });
        parentPersonId = newParent.id;
        parentHouseholdId = household.id;
      }

      // Upsert each student under this parent
      for (const studentEntry of students) {
        const studentFirstName =
          profileValue(studentEntry, studentFormFields, "firstName") ??
          studentEntry["firstName"] ?? "";
        const studentLastName =
          profileValue(studentEntry, studentFormFields, "lastName") ??
          studentEntry["lastName"] ?? "";
        const dobStr = profileValue(studentEntry, studentFormFields, "dateOfBirth");
        const dob = dobStr ? new Date(dobStr) : undefined;
        const grade = profileValue(studentEntry, studentFormFields, "grade");
        const studentProfileUpdates = buildPersonProfileUpdates(studentEntry, studentFormFields);

        if (!studentFirstName || !studentLastName) continue;

        // Look for existing student in the parent's household
        const existingStudent = parentHouseholdId
          ? await db.person.findFirst({
              where: {
                organizationId: org.id,
                householdId: parentHouseholdId,
                firstName: { equals: studentFirstName, mode: "insensitive" },
                lastName: { equals: studentLastName, mode: "insensitive" },
                personType: "STUDENT",
                ...(dob ? { dateOfBirth: dob } : {}),
              },
            })
          : null;

        let studentPersonId: string;

        if (existingStudent) {
          await updatePerson(existingStudent.id, {
            grade: grade ?? existingStudent.grade ?? undefined,
            ...studentProfileUpdates,
          });
          studentPersonId = existingStudent.id;
        } else {
          const newStudent = await createPerson({
            organizationId: org.id,
            householdId: parentHouseholdId ?? undefined,
            firstName: studentFirstName,
            lastName: studentLastName,
            dateOfBirth: dob,
            grade,
            personType: "STUDENT",
            ...studentProfileUpdates,
          });
          await addGuardian(parentPersonId, newStudent.id);
          studentPersonId = newStudent.id;
        }

        // Upsert custom field values for the student
        const studentCustomFieldValues = buildCustomFieldValues(studentEntry, studentFormFields);
        for (const cfv of studentCustomFieldValues) {
          await db.customFieldValue.upsert({
            where: { customFieldId_personId: { customFieldId: cfv.customFieldId, personId: studentPersonId } },
            create: { customFieldId: cfv.customFieldId, personId: studentPersonId, value: cfv.value },
            update: { value: cfv.value },
          });
        }
      }
    }

    return { success: true, applicationId: application.id };
  });
