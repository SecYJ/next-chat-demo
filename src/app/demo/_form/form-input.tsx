import { Input, type InputProps } from "@/components/ui/input";
import { Control, FieldValues, Path, useController } from "react-hook-form";

interface Props<T extends FieldValues> extends Omit<InputProps, "name"> {
	control: Control<T>;
	name: Path<T>;
}

const FormInput = <T extends FieldValues>({ control, name, ...inputProps }: Props<T>) => {
	const { field } = useController({ control, name });

	return <Input {...field} {...inputProps} />;
};

export default FormInput;
