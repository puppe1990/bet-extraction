import { Eye, EyeOff } from "lucide-react";
import { useState } from "react";
import { cn } from "#/lib/utils";

type PasswordInputProps = Omit<React.ComponentProps<"input">, "type">;

export function PasswordInput({ className, ...props }: PasswordInputProps) {
	const [visible, setVisible] = useState(false);

	return (
		<div className="relative">
			<input
				type={visible ? "text" : "password"}
				data-slot="input"
				className={cn(
					"h-9 w-full min-w-0 rounded-md border border-input bg-transparent px-3 py-1 pr-11 text-base shadow-xs transition-[color,box-shadow] outline-none selection:bg-primary selection:text-primary-foreground file:inline-flex file:h-7 file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 md:text-sm dark:bg-input/30",
					"focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50",
					"aria-invalid:border-destructive aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40",
					className,
				)}
				{...props}
			/>
			<button
				type="button"
				aria-label={visible ? "Ocultar senha" : "Mostrar senha"}
				title={visible ? "Ocultar senha" : "Mostrar senha"}
				className="absolute inset-y-0 right-0 inline-flex w-11 items-center justify-center text-zinc-500 transition hover:text-zinc-100"
				onClick={() => setVisible((current) => !current)}
			>
				{visible ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
			</button>
		</div>
	);
}
