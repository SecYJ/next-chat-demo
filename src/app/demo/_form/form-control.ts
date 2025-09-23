import { createFormControl } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";

export const formSchema = z.object({
	room: z.string(),
	username: z.string(),
	message: z.string(),
});

export type FormSchema = z.output<typeof formSchema>;

export const formControl = createFormControl<FormSchema>({
	defaultValues: {
		room: "",
		username: "",
		message: "",
	},
	resolver: zodResolver(formSchema),
});
