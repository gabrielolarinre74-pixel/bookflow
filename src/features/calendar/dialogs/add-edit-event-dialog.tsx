import { zodResolver } from "@hookform/resolvers/zod";
import { addMinutes, set } from "date-fns";
import { type ReactNode, useMemo } from "react";
import { useForm, useWatch } from "react-hook-form";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { DateTimePicker } from "@/components/ui/date-time-picker";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
	Modal,
	ModalClose,
	ModalContent,
	ModalDescription,
	ModalFooter,
	ModalHeader,
	ModalTitle,
	ModalTrigger,
} from "@/components/ui/responsive-modal";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { hasConflict } from "@/features/booking/availability";
import { useBookingStore } from "@/features/booking/store";
import { COLOR_DOT } from "@/features/calendar/constants";
import { useCalendar } from "@/features/calendar/contexts/calendar-context";
import { useDisclosure } from "@/features/calendar/hooks";
import type { IEvent } from "@/features/calendar/interfaces";
import { eventSchema, type TEventFormData } from "@/features/calendar/schemas";

interface IProps {
	children: ReactNode;
	startDate?: Date;
	startTime?: { hour: number; minute: number };
	event?: IEvent;
}

export function AddEditEventDialog({ children, startDate, startTime, event }: IProps) {
	const { isOpen, onClose, onToggle } = useDisclosure();
	const { addEvent, updateEvent } = useCalendar();
	const services = useBookingStore((s) => s.services);
	const staff = useBookingStore((s) => s.staff);
	const isEditing = !!event;

	const defaults = useMemo((): TEventFormData => {
		const service = services.find((s) => s.id === event?.serviceId) ?? services[0];
		let start: Date;
		if (event) start = new Date(event.startDate);
		else if (startDate)
			start = startTime
				? set(new Date(startDate), { hours: startTime.hour, minutes: startTime.minute, seconds: 0, milliseconds: 0 })
				: new Date(startDate);
		else start = set(new Date(), { minutes: Math.ceil(new Date().getMinutes() / 15) * 15, seconds: 0, milliseconds: 0 });
		return {
			serviceId: service?.id ?? "",
			staffId: event?.user.id ?? staff.find((s) => service && s.serviceIds.includes(service.id))?.id ?? "",
			customerName: event?.customer?.name ?? "",
			customerEmail: event?.customer?.email ?? "",
			customerPhone: event?.customer?.phone ?? "",
			description: event?.description ?? "",
			startDate: start,
			endDate: event ? new Date(event.endDate) : addMinutes(start, service?.durationMin ?? 30),
		};
	}, [event, startDate, startTime, services, staff]);

	const form = useForm<TEventFormData>({ resolver: zodResolver(eventSchema), values: defaults });
	const serviceId = useWatch({ control: form.control, name: "serviceId" });
	const eligibleStaff = staff.filter((s) => s.serviceIds.includes(serviceId));

	const onServiceChange = (id: string) => {
		form.setValue("serviceId", id);
		const svc = services.find((s) => s.id === id);
		if (svc) form.setValue("endDate", addMinutes(form.getValues("startDate"), svc.durationMin));
		if (!staff.find((s) => s.id === form.getValues("staffId"))?.serviceIds.includes(id)) {
			form.setValue("staffId", staff.find((s) => s.serviceIds.includes(id))?.id ?? "");
		}
	};

	const onSubmit = (values: TEventFormData) => {
		const service = services.find((s) => s.id === values.serviceId);
		const member = staff.find((s) => s.id === values.staffId);
		if (!service || !member) return;
		if (hasConflict({ id: event?.id, staffId: member.id, start: values.startDate, end: values.endDate }, useBookingStore.getState().bookings)) {
			form.setError("startDate", { message: `${member.name} already has an appointment at this time` });
			return;
		}
		const booking: IEvent = {
			id: event?.id ?? 0,
			title: service.name,
			color: service.color,
			description: values.description,
			startDate: values.startDate.toISOString(),
			endDate: values.endDate.toISOString(),
			user: { id: member.id, name: member.name, picturePath: member.picturePath },
			serviceId: service.id,
			customer: { name: values.customerName, email: values.customerEmail, phone: values.customerPhone },
			status: event?.status ?? "confirmed",
			price: service.price,
			bufferMin: service.bufferMin,
			source: event?.source ?? "staff",
		};
		if (isEditing) {
			updateEvent(booking);
			toast.success("Appointment updated");
		} else {
			addEvent(booking);
			toast.success(`Booked ${values.customerName} with ${member.name}`);
		}
		onClose();
	};

	return (
		<Modal open={isOpen} onOpenChange={onToggle} modal={false}>
			<ModalTrigger asChild>{children}</ModalTrigger>
			<ModalContent>
				<ModalHeader>
					<ModalTitle>{isEditing ? "Edit appointment" : "New appointment"}</ModalTitle>
					<ModalDescription>
						{isEditing ? "Change the time, service or customer details." : "Book a walk-in or phone booking."}
					</ModalDescription>
				</ModalHeader>
				<Form {...form}>
					<form id="event-form" onSubmit={form.handleSubmit(onSubmit)} className="grid gap-4 py-4 sm:grid-cols-2">
						<FormField
							control={form.control}
							name="serviceId"
							render={({ field }) => (
								<FormItem>
									<FormLabel className="required">Service</FormLabel>
									<Select value={field.value} onValueChange={onServiceChange}>
										<FormControl>
											<SelectTrigger className="w-full">
												<SelectValue placeholder="Choose a service" />
											</SelectTrigger>
										</FormControl>
										<SelectContent>
											{services.map((s) => (
												<SelectItem key={s.id} value={s.id}>
													<span className={`size-2.5 rounded-full ${COLOR_DOT[s.color]}`} />
													{s.name} · {s.durationMin} min
												</SelectItem>
											))}
										</SelectContent>
									</Select>
									<FormMessage />
								</FormItem>
							)}
						/>
						<FormField
							control={form.control}
							name="staffId"
							render={({ field }) => (
								<FormItem>
									<FormLabel className="required">With</FormLabel>
									<Select value={field.value} onValueChange={field.onChange}>
										<FormControl>
											<SelectTrigger className="w-full">
												<SelectValue placeholder="Choose a team member" />
											</SelectTrigger>
										</FormControl>
										<SelectContent>
											{eligibleStaff.map((s) => (
												<SelectItem key={s.id} value={s.id}>
													{s.name}
												</SelectItem>
											))}
										</SelectContent>
									</Select>
									<FormMessage />
								</FormItem>
							)}
						/>
						<FormField control={form.control} name="startDate" render={({ field }) => <DateTimePicker form={form} field={field} />} />
						<FormField control={form.control} name="endDate" render={({ field }) => <DateTimePicker form={form} field={field} />} />
						<FormField
							control={form.control}
							name="customerName"
							render={({ field }) => (
								<FormItem className="sm:col-span-2">
									<FormLabel className="required">Customer name</FormLabel>
									<FormControl>
										<Input placeholder="Full name" {...field} />
									</FormControl>
									<FormMessage />
								</FormItem>
							)}
						/>
						<FormField
							control={form.control}
							name="customerEmail"
							render={({ field }) => (
								<FormItem>
									<FormLabel>Email</FormLabel>
									<FormControl>
										<Input type="email" placeholder="name@example.com" {...field} />
									</FormControl>
									<FormMessage />
								</FormItem>
							)}
						/>
						<FormField
							control={form.control}
							name="customerPhone"
							render={({ field }) => (
								<FormItem>
									<FormLabel>Phone / WhatsApp</FormLabel>
									<FormControl>
										<Input type="tel" placeholder="+1 555 010 0200" {...field} />
									</FormControl>
									<FormMessage />
								</FormItem>
							)}
						/>
						<FormField
							control={form.control}
							name="description"
							render={({ field }) => (
								<FormItem className="sm:col-span-2">
									<FormLabel>Notes</FormLabel>
									<FormControl>
										<Textarea {...field} placeholder="Allergies, preferences, parking…" />
									</FormControl>
									<FormMessage />
								</FormItem>
							)}
						/>
					</form>
				</Form>
				<ModalFooter className="flex justify-end gap-2">
					<ModalClose asChild>
						<Button type="button" variant="outline">
							Cancel
						</Button>
					</ModalClose>
					<Button form="event-form" type="submit">
						{isEditing ? "Save changes" : "Book appointment"}
					</Button>
				</ModalFooter>
			</ModalContent>
		</Modal>
	);
}
