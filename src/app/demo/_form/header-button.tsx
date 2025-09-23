import { Button } from "@/components/ui/button";
import { useWatch } from "react-hook-form";
import { formControl } from "./form-control";
import { ReactNode } from "react";

const HeaderButton = ({ children }: { children: ReactNode }) => {
	const watchValue = useWatch({ control: formControl.control, name: ["room", "username"] });
	const disabled = watchValue.some((c) => c.trim() === "");

	return (
		<Button type="submit" disabled={disabled}>
			{children}
		</Button>
	);
};

export default HeaderButton;
