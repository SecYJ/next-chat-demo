import { Button } from "@/components/ui/button";
import { formControl } from "./form-control";
import { useWatch } from "react-hook-form";
import { PropsWithChildren, ReactNode } from "react";

interface Props extends PropsWithChildren {
	disabled?: boolean;
	children: ReactNode;
}

const FooterButton = ({ disabled, children }: Props) => {
	const watchValue = useWatch({ control: formControl.control, name: "message" });
	const derivedDisabled = disabled || !watchValue.trim();

	return (
		<Button type="submit" disabled={derivedDisabled}>
			{children}
		</Button>
	);
};

export default FooterButton;
