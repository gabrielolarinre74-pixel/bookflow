import { z } from "zod/v4";

export const eventSchema = z
	.object({
		serviceId: z.string().min(1, "Choose a service"),
		staffId: z.string().min(1, "Choose a team member"),
		customerName: z.string().trim().min(2, "Enter the customer's name").max(80),
		customerEmail: z.email("Enter a valid email").or(z.literal("")),
		customerPhone: z
			.string()
			.trim()
			.max(25)
			.regex(/^[+()\d\s-]*$/, "Use digits, spaces, +, - or brackets only"),
		description: z.string().max(500),
		startDate: z.date("Start date is required"),
		endDate: z.date("End date is required"),
	})
	.refine((v) => v.endDate.getTime() > v.startDate.getTime(), {
		message: "End time must be after the start time",
		path: ["endDate"],
	})
	.refine((v) => v.customerEmail !== "" || v.customerPhone !== "", {
		message: "Add an email or phone number so reminders can be sent",
		path: ["customerPhone"],
	});

export type TEventFormData = z.infer<typeof eventSchema>;
